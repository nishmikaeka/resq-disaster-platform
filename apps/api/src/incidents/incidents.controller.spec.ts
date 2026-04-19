import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('IncidentsController Integration Flow', () => {
  let controller: IncidentsController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        { provide: IncidentsService, useValue: { create: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
            incident: {
              findUnique: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<IncidentsController>(IncidentsController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('accept() flow', () => {
    // 1. The "Ghost" Incident Scenario
    it('should throw NotFoundException if trying to accept an ID that does not exist', async () => {
      // prisma.incident.findUnique returns null
      (prisma.incident.findUnique as jest.Mock).mockResolvedValue(null);

      const mockReq = { user: { id: 'volunteer-1' } };

      await expect(
        controller.accept('ghost-id', mockReq as any),
      ).rejects.toThrow(NotFoundException);
    });

    // 2. The "Invalid State" Scenario
    // Note: In your current controller, if someone tries to accept a RESOLVED incident,
    // updateMany will return count: 0 because the where clause filter (status: 'OPEN') fails.
    it('should throw BadRequestException if the incident is already RESOLVED', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        status: 'RESOLVED',
      });
      (prisma.incident.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const mockReq = { user: { id: 'volunteer-1' } };

      await expect(controller.accept('1', mockReq as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if updateMany returns count: 0 (Race Condition)', async () => {
      (prisma.incident.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        status: 'OPEN',
      });
      (prisma.incident.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      const mockReq = { user: { id: 'volunteer-123' } };

      await expect(controller.accept('1', mockReq as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('nearby() geospatial', () => {
    // 4. The "Out of Bounds" Scenario
    it('should return empty data if coordinates are 0,0 (Out of Service Area)', async () => {
      // Simulate PostGIS returning no results for 0,0 coordinates
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const result = await controller.nearby(0, 0, 10000, 20);

      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getOne()', () => {
    it('should throw NotFoundException if the incident does not exist', async () => {
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([]);
      const mockReq = { user: { lat: 6.9, lng: 79.8 } };

      await expect(
        controller.getOne('non-existent-id', mockReq as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return a formatted incident with numerical coordinates', async () => {
      const mockDbIncident = {
        id: 'inc-1',
        title: 'Help!',
        lat: '6.9271',
        lng: '79.8612',
        distance_meters: 150.4,
        volunteer: null,
      };
      jest.spyOn(prisma, '$queryRaw').mockResolvedValue([mockDbIncident]);
      const mockReq = { user: { lat: 6.9, lng: 79.8 } };

      const result = await controller.getOne('inc-1', mockReq as any);

      expect(result.lat).toBe(6.9271);
      expect(result.distance).toBe(150);
      expect(result.id).toBe('inc-1');
    });
  });
});
