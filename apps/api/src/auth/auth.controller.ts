import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { JwtGuard } from './jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfile, AuthUserPayload } from 'src/types/authInterfaces';

interface AuthRequest extends Request {
  user: AuthUserPayload;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  // Trigger Google login
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport handles redirect to Google
  }

  // Google callback — THIS WORKS WITH globalPrefix('api')
  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: AuthRequest, @Res() res: Response) {
    if (!req.user) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'https://resq-disaster-platform-web.vercel.app'}/login?error=failed`,
      );
    }

    const { access_token } = this.authService.generateToken(req.user);

    return res.redirect(
      `${process.env.FRONTEND_URL || 'https://resq-disaster-platform-web.vercel.app'}/onboarding?access_token=${access_token}`,
    );
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Req() req: AuthRequest): Promise<UserProfile | null> {
    return this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lat: true,
        lng: true,
        image: true,
        phone: true,
      },
    });
  }
}
