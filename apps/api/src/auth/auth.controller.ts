import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { JwtGuard } from './jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfile } from 'src/types/authInterfaces';
import { AuthUserPayload } from 'src/types/authInterfaces';

interface AuthRequest extends Request {
  user: AuthUserPayload; // Use the complete structure here
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: AuthRequest, @Res() res: Response) {
    if (!req.user) {
      return res.redirect('http://localhost:3000/login?error=auth_failed');
    }

    const { access_token } = this.authService.generateToken(req.user);

    const redirectUrl = `http://localhost:3000/onboarding?access_token=${access_token}`;

    return res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Req() req: AuthRequest): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
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

    // Return the found user (or null if not found)
    return user;
  }
}
