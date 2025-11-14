// apps/api/src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const options: StrategyOptions = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super(options);
  }

  validate(payload: JwtPayload): {
    userId: string;
    email: string;
    role: string;
  } {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new Error('Invalid JWT payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
