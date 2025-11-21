// apps/api/src/auth/auth.controller.ts
import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { JwtGuard } from './jwt.guard';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth
  }

  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) {
      // Handle error or redirect to login page
      return res.redirect('http://localhost:3000/login?error=auth_failed');
    }

    // Generate token and set cookie
    const { access_token } = this.authService.generateToken(req.user);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Perform redirect
    res.redirect('http://localhost:3000/login');
  }
  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@Req() req: AuthRequest) {
    //returning user data to the frontend auth.ts getUser()
    return {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };
  }
}
