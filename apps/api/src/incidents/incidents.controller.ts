import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Query,
  Param,
  Patch,
  ParseFloatPipe,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentsService } from './incidents.service';
import { AuthRequest } from 'src/types/authInterfaces';
import type { Express } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { IncidentWithGeo } from 'src/types/authInterfaces';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

@Controller('incidents')
export class IncidentsController {
  private twilioClient: any;
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    //eslint-disable-next-line
    const sid = this.configService.get('TWILIO_ACCOUNT_SID');
    //eslint-disable-next-line
    const token = this.configService.get('TWILIO_AUTH_TOKEN');
    if (sid && token) {
      //eslint-disable-next-line
      this.twilioClient = require('twilio')(sid, token);
    }
  }

  @Post()
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, callback) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
        if (!allowed) {
          return callback(
            new BadRequestException(
              'Only images allowed (jpg, png, gif, webp)',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )

  //create a incident as a victim
  async create(
    @Req() req: AuthRequest,
    @Body() dto: CreateIncidentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log(dto);
    return this.incidentsService.create(req.user.id, dto, file);
  }

  @Get('nearby')
  async nearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', new DefaultValuePipe(10000), ParseIntPipe) radius: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string, // ID of last incident from previous load
  ): Promise<{
    data: IncidentWithGeo[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    try {
      const validLimit = Math.min(Math.max(1, limit), 50); // Max 50 per load

      // Fetch limit + 1 to check if there are more results
      const results = await this.prismaService.$queryRaw<IncidentWithGeo[]>`
      WITH search_point AS (
        SELECT ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography AS geog
      )
      SELECT 
        i.id, 
        i.title, 
        i.description, 
        i.urgency, 
        i.status,
        i.phone,
        i."createdAt",
        ST_Y(i.location::geometry) AS lat,
        ST_X(i.location::geometry) AS lng,
        ST_Distance(i.location::geography, sp.geog) AS distance_meters,
        
        json_build_object(
          'id', u.id,
          'email', u.email,
          'name', u.name,
          'role', u.role,
          'image', u.image,
          'phone', u.phone,
          'lat', u.lat,
          'lng', u.lng
        ) AS "user",
        
        json_build_object(
          'id', v.id,
          'email', v.email,
          'name', v.name,
          'role', v.role,
          'image', v.image,
          'phone', v.phone
        ) AS "volunteer"
        
      FROM incidents i 
      CROSS JOIN search_point sp
      INNER JOIN users u ON u.id = i."userId"
      LEFT JOIN users v ON v.id = i."volunteerId"
      
      WHERE 
        i.status IN ('OPEN', 'IN_PROGRESS')
        AND ST_DWithin(i.location::geography, sp.geog, ${radius})
        ${
          cursor
            ? Prisma.sql`AND (
          ST_Distance(i.location::geography, sp.geog), i.id
        ) > (
          (SELECT ST_Distance(location::geography, sp.geog) FROM incidents WHERE id = ${cursor}),
          ${cursor}
        )`
            : Prisma.empty
        }
        
      ORDER BY distance_meters ASC, i.id ASC
      LIMIT ${validLimit + 1}
    `;

      // Check if there are more results
      const hasMore = results.length > validLimit;

      // Return only the requested number of items
      const items = results.slice(0, validLimit);

      const data = items.map((inc) => ({
        ...inc,
        lat: Number(inc.lat),
        lng: Number(inc.lng),
        distance: Math.round(Number(inc.distance_meters)),
      }));

      return {
        data,
        nextCursor:
          hasMore && items.length > 0 ? items[items.length - 1].id : null,
        hasMore,
      };
    } catch (error) {
      console.error('Nearby error:', error);
      throw error;
    }
  }

  @Get('map-pins')
  async getMapPins(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius', ParseIntPipe) radius: number,
  ) {
    // Same PostGIS logic as 'nearby', but NO LIMIT and NO JOINS
    return this.prismaService.$queryRaw`
    SELECT id, urgency, status,
           ST_Y(location::geometry) AS lat, 
           ST_X(location::geometry) AS lng
    FROM incidents
    WHERE status IN ('OPEN', 'IN_PROGRESS')
      AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radius})
  `;
  }

  @Get('my-responses')
  @UseGuards(JwtGuard)
  async getMyResponses(@Req() req: AuthRequest): Promise<IncidentWithGeo[]> {
    // Use user's current location from JWT payload for distance calculation
    const volunteerLat = req.user.lat;
    const volunteerLng = req.user.lng;

    const results = await this.prismaService.$queryRaw<IncidentWithGeo[]>`
    SELECT 
      i.id, 
      i.title, 
      i.description, 
      i.urgency, 
      i.status,
      i.phone,
      i."createdAt",

      ST_Y(i.location::geometry) AS lat,
      ST_X(i.location::geometry) AS lng,
      
      ST_Distance(
        i.location::geography, 
        ST_SetSRID(ST_MakePoint(${volunteerLng}, ${volunteerLat}), 4326)::geography
      ) AS distance_meters,
      
      -- Fetch creator's details as a nested JSON object
      (
        SELECT row_to_json(u.*)
        FROM users u
        WHERE u.id = i."userId"
      ) AS "user",
      (
        SELECT row_to_json(v.*)
        FROM users v
        WHERE v.id = i."volunteerId"
      ) AS "volunteer"      

    FROM incidents i
    
    WHERE 
      i."volunteerId" = ${req.user.id} 
      AND i.status IN ('IN_PROGRESS','RESOLVED') -- Only show active responses and resolved responses
      
    ORDER BY i."createdAt" DESC
  `;

    return Array.isArray(results)
      ? results.map((inc) => ({
          ...inc,
          // Ensure coordinates are cast to numbers
          lat: parseFloat(inc.lat as any),
          lng: parseFloat(inc.lng as any),
          distance: Math.round(inc.distance_meters as number),
        }))
      : [];
  }

  @Get('my-reports')
  @UseGuards(JwtGuard)
  async getMyCreatedIncidents(
    @Req() req: AuthRequest,
  ): Promise<IncidentWithGeo[]> {
    //Extract the current user's location from the JWT payload
    const userLat = req.user.lat;
    const userLng = req.user.lng;

    const results = await this.prismaService.$queryRaw<IncidentWithGeo[]>`
    SELECT 
      i.id, 
      i.title, 
      i.description, 
      i.urgency, 
      i.status,
      i.phone,
      i."createdAt",

      ST_Y(i.location::geometry) AS lat,
      ST_X(i.location::geometry) AS lng,
      
      -- Calculate distance from the incident location (i.location) to the user's location
      ST_Distance(
        i.location::geography, 
        ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
      ) AS distance_meters,
      
      -- Fetch creator's details as a nested JSON 
      (
        SELECT row_to_json(u.*)
        FROM users u
        WHERE u.id = i."userId"
      ) AS "user",
      (
        SELECT row_to_json(v.*)
        FROM users v
        WHERE v.id = i."volunteerId"
      ) AS "volunteer"
      
    FROM incidents i
    
    WHERE 
      i."userId" = ${req.user.id} -- Filter by the creator ID
      
    ORDER BY i."createdAt" DESC
  `;

    // Process results to ensure lat/lng are number types AND include the calculated distance
    return Array.isArray(results)
      ? results.map((inc) => ({
          ...inc,
          lat: parseFloat(inc.lat as any),
          lng: parseFloat(inc.lng as any),
          // Map the calculated distance_meters to the 'distance' property (in meters)
          distance: Math.round(inc.distance_meters as number),
        }))
      : [];
  }
  @Get(':id')
  @UseGuards(JwtGuard)
  async getOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<IncidentWithGeo> {
    const userLat = req.user.lat;
    const userLng = req.user.lng;
    const results = await this.prismaService.$queryRaw<IncidentWithGeo[]>`
    
        SELECT 
            i.id, 
            i.title, 
            i.description, 
            i.urgency, 
            i.status,
            i.phone,
            i."createdAt",
            i."userId",
            i."volunteerId",
            i.media,
            
            -- Extract Coordinates using PostGIS functions
            ST_Y(i.location::geometry) AS lat,
            ST_X(i.location::geometry) AS lng,

            ST_Distance(
            i.location::geography, 
           ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
            ) AS distance_meters,
            
            -- Fetch creator's details as a nested JSON object
            (
              SELECT row_to_json(u.*)
              FROM users u
              WHERE u.id = i."userId"
            ) AS "user",
            
            -- Fetch volunteer's details as a nested JSON object
            (
              SELECT row_to_json(v.*)
              FROM users v
              WHERE v.id = i."volunteerId"
            ) AS "volunteer"
            
        FROM incidents i
        
        WHERE 
            i.id = ${id}
            
    `;

    const incident = results[0];

    if (!incident) {
      throw new NotFoundException(`Incident with ID "${id}" not found.`);
    }

    // Process the result to convert string coordinates to numbers
    const processedIncident: IncidentWithGeo = {
      ...incident,
      lat: parseFloat(incident.lat as any),
      lng: parseFloat(incident.lng as any),
      // Ensure that if volunteer is NULL/undefined from the SQL row_to_json, it becomes null
      volunteer: incident.volunteer || null,
      distance: Math.round(incident.distance_meters as number),
    };

    return processedIncident;
  }

  //volunteer accepting an open status incident
  @Patch(':id/accept')
  @UseGuards(JwtGuard)
  async accept(@Param('id') id: string, @Req() req: AuthRequest) {
    const incident = await this.prismaService.incident.findUnique({
      where: { id },
      include: { user: true, volunteer: true },
    });

    if (!incident) throw new NotFoundException('Incident Not Found');
    if (incident.status !== 'OPEN')
      throw new BadRequestException('Already taken');

    const updatedIncident = await this.prismaService.incident.update({
      where: { id },
      data: { status: 'IN_PROGRESS', volunteerId: req.user.id },
      include: { user: true, volunteer: true },
    });

    // Send sms to victim notifying about the volunteer
    if (this.twilioClient && updatedIncident.phone) {
      const volunteerName = updatedIncident.volunteer?.name || 'A ResQ hero';
      const volunteerPhone = updatedIncident.volunteer?.phone || 'unknown';

      const messageBody = `HELP IS ON THE WAY!
      ${volunteerName} is coming to rescue you!
      Call them now: ${volunteerPhone}
      Stay strong — ResQ is here.`;

      const toPhone = updatedIncident.phone.startsWith('+94')
        ? updatedIncident.user.phone
        : `+94${updatedIncident.phone.replace(/^0/, '')}`;

      try {
        //eslint-disable-next-line
        const message = await this.twilioClient.messages.create({
          body: messageBody,
          //eslint-disable-next-line
          from: this.configService.get('TWILIO_PHONE_NUMBER'),
          to: toPhone,
        });
      } catch (error: any) {
        console.error('TWILIO SMS FAILED:', error.message);
        console.error('Error Code:', error.code);
        console.error('To:', toPhone);
      }
    }

    return updatedIncident;
  }

  @Patch(':id/cancel')
  @UseGuards(JwtGuard)
  async cancel(@Param('id') id: string, @Req() req: AuthRequest) {
    const updatedIncident = await this.prismaService.incident.update({
      where: { id, volunteerId: req.user.id },
      data: { status: 'OPEN', volunteerId: null },
      include: { user: true, volunteer: true },
    });

    // The 'volunteer' property on the returned object will now be null.
    return updatedIncident;
  }

  //user closing the status of the incident after getting help
  @Patch(':id/close')
  @UseGuards(JwtGuard)
  async close(@Param('id') id: string, @Req() req: AuthRequest) {
    const updatedIncident = await this.prismaService.incident.update({
      where: { id, userId: req.user.id },
      data: { status: 'RESOLVED' },
      include: { user: true, volunteer: true },
    });

    return updatedIncident;
  }
}
