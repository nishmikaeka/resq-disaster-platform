// apps/api/src/auth/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DbUser } from 'src/types/authInterfaces';
import { GoogleUser } from 'src/types/authInterfaces';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: 'http://localhost:3001/api/auth/callback/google',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<DbUser> {
    const googleUser: GoogleUser = {
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName,
      picture: profile.photos?.[0]?.value ?? null,
    };

    const user = await this.authService.validateGoogleUser(googleUser);
    return user;
  }
}
