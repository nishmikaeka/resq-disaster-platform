import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    //eslint-disable-next-line
    super({
      //eslint-disable-next-line
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  //decoded payload which is creted to sign the jwt in authservice
  async validate(payload: any) {
    console.log('JWT payload:', payload);

    // Fetch FULL user from DB
    const user = await this.prisma.user.findUnique({
      //eslint-disable-next-line
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        lat: true,
        lng: true,
        image: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    console.log('User from DB:', user);
    return user;
  }
}
