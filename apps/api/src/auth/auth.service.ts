// apps/api/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleUser } from 'src/types/authInterfaces';
import { DbUser } from 'src/types/authInterfaces';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

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
      id: user.id, //these returning is again injected to generateToken function below then create a access_token //dbuser interface
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      image: user.image,
      lat: user.lat,
      lng: user.lng,
    };
  }

  generateToken(user: DbUser): { access_token: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      image: user.image,
      lat: user.lat,
      lng: user.lng,
    };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      }),
    };
  }
}
