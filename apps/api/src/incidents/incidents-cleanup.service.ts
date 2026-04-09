import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Status } from '@repo/database';

@Injectable()
export class IncidentCleanupService {
  private readonly logger = new Logger(IncidentCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, { timeZone: 'Asia/Colombo' })
  async clearIncidents() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.incident.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: [Status.OPEN, Status.IN_PROGRESS] },
      },
    });

    this.logger.log(`Deleted ${result.count} incidents older than 7 days`);
  }
}
