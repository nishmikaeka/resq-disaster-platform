import { Module } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IncidentCleanupService } from './incidents-cleanup.service';

@Module({
  imports: [
    PrismaModule, // Makes PrismaService available
    CloudinaryModule, // Makes CloudinaryService available
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentCleanupService],
})
export class IncidentsModule {}
