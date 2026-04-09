import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleUser, DbUser } from 'src/types/authInterfaces';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // --- Google User Validation (unchanged logic) ---
  async validateGoogleUser(googleUser: GoogleUser): Promise<DbUser> {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture ?? null,
          role: 'VICTIM',
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      image: user.image,
      lat: user.lat,
      lng: user.lng,
    };
  }

  // --- Short-lived Access Token (15 min) ---
  generateAccessToken(user: DbUser): string {
    const isOnboarded = user.role !== 'VICTIM' && user.phone !== null;
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      image: user.image,
      lat: user.lat,
      lng: user.lng,
      isOnboarded,
    };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
  }

  // --- Long-lived Refresh Token (7 days) ---
  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        jti: randomBytes(16).toString('hex'),
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      },
    );
    const hash = this.hashToken(refreshToken);

    // Store the hash in the DB for revocation/rotation
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });

    return refreshToken;
  }

  // --- Validate & Rotate Refresh Token ---
  async validateRefreshToken(token: string): Promise<DbUser> {
    let userId: string;
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      userId = decoded.sub;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hash = this.hashToken(token);
    if (hash !== user.refreshTokenHash) {
      // Possible token theft — invalidate all sessions for this user
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      image: user.image,
      lat: user.lat,
      lng: user.lng,
    };
  }

  // --- Invalidate Refresh Token (Logout) ---
  async invalidateRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // --- Helper: SHA-256 hash ---
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
