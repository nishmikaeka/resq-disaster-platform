import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { randomUUID } from 'crypto';

export interface CreatedIncident {
  id: string;
  title: string;
  description: string | null;
  urgency: string;
  media: string[];
  createdAt: Date;
  location: string;
  user: any;
  lat: number;
  lng: number;
}

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(
    userId: string,
    dto: CreateIncidentDto,
    file?: Express.Multer.File,
  ): Promise<CreatedIncident> {
    const title = dto.title?.trim();
    if (!title) throw new BadRequestException('Title is required');

    const lat = parseFloat(dto.lat ?? '0');
    const lng = parseFloat(dto.lng ?? '0');
    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException(
        'Valid latitude and longitude are required',
      );
    }

    let mediaUrl: string | undefined;
    if (file) {
      try {
        const result = await this.cloudinary.upload(file);
        mediaUrl = result.secure_url;
      } catch {
        throw new InternalServerErrorException('Failed to upload image');
      }
    }

    const result = await this.prisma.$queryRaw<CreatedIncident[]>`
      INSERT INTO incidents (
        id, title, description, location, media, urgency,phone ,"userId", "createdAt"
      ) VALUES (
        ${randomUUID()},
        ${title},
        ${dto.description?.trim() || null},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        ${mediaUrl ? [mediaUrl] : []}::text[],
        ${(dto.urgency || 'MEDIUM').toUpperCase()}::"Urgency",
        ${dto.phone},
        ${userId},
        NOW()
      )
      RETURNING 
        id,
        title,
        description,
        urgency,
        media,
        phone,
        "createdAt",
        ST_X(location)::NUMERIC AS lng, 
        ST_Y(location)::NUMERIC AS lat,
        ST_AsText(location) AS location,
        (SELECT row_to_json(u.*) FROM users u WHERE u.id = ${userId}) AS "user"
    `;

    if (!result || result.length === 0) {
      throw new InternalServerErrorException('Failed to create incident');
    }

    return result[0];
  }
}
