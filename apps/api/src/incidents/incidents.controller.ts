// src/incidents/incidents.controller.ts
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentsService } from './incidents.service';
import type { Express } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

interface AuthRequest extends Request {
  user: { id: string; email: string; name?: string };
}

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly prismaService: PrismaService,
  ) {}

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
    return this.incidentsService.create(req.user.id, dto, file);
  }

  //get the nearby indicent default 10KM
  @Get()
  async nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: '10000',
  ) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    return this.prismaService.$queryRaw`SELECT *, 
      ST_Distance(location, ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326)) as distance
    FROM "Incident"
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lngNum}, ${latNum}), 4326), ${radiusNum})
    ORDER BY distance
  `;
  }

  //get more details of the incident
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.prismaService.incident.findUnique({
      where: { id },
      include: { user: true, volunteer: true },
    });
  }

  //edit the status of the incident to IN PROGRESS after volunteer offer a help
  @Patch(':id/accept')
  @UseGuards(JwtGuard)
  async accept(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.prismaService.incident.update({
      where: { id },
      data: { status: 'IN_PROGRESS', volunteerId: req.user.id },
    });
  }

  //edit the status of the incident to OPEN after volunteer rejected to help
  @Patch(':id/cancel')
  @UseGuards(JwtGuard)
  async cancel(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.prismaService.incident.update({
      where: { id, volunteerId: req.user.id },
      data: { status: 'OPEN', volunteerId: null },
    });
  }

  //user closing the status of the incident after getting help
  @Patch(':id/close')
  @UseGuards(JwtGuard)
  async close(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.prismaService.incident.update({
      where: { id, userId: req.user.id },
      data: { status: 'RESOLVED' },
    });
  }
}
