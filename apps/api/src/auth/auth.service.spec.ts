import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      update: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let jwt: { sign: jest.Mock; verify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    jwt = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('stores a hash when generating refresh token', async () => {
    jwt.sign.mockReturnValue('refresh.jwt.token');
    prisma.user.update.mockResolvedValue({});

    const token = await service.generateRefreshToken('user-1');

    expect(token).toBe('refresh.jwt.token');
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-1' }),
      expect.objectContaining({ expiresIn: '7d' }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { refreshTokenHash: expect.any(String) },
      }),
    );
  });

  it('validates a refresh token and returns user payload', async () => {
    const token = 'refresh.jwt.token';
    jwt.verify.mockReturnValue({ sub: 'user-1' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: 'VICTIM',
      name: 'Test',
      phone: null,
      image: null,
      lat: null,
      lng: null,
      refreshTokenHash: createHash('sha256').update(token).digest('hex'),
    });

    const user = await service.validateRefreshToken(token);

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('test@example.com');
  });

  it('rejects invalid refresh signature', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    await expect(service.validateRefreshToken('bad.token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
