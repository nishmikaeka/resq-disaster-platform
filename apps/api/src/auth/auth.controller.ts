import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { JwtGuard } from './jwt.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfile, AuthUserPayload } from 'src/types/authInterfaces';

interface AuthRequest extends Request {
  user: AuthUserPayload;
}

// Cookie configuration helper
const isProduction = () => process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_NAME = 'resq_refresh_token';
const ACCESS_COOKIE_NAME = 'resq_access_token';

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: (isProduction() ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  maxAge,
});

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) { }

  // --- Trigger Google login ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport handles redirect to Google
  }

  // --- Google callback — sets HttpOnly cookies instead of URL params ---
  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: AuthRequest, @Res() res: Response) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      'https://resq-disaster-platform-web.vercel.app';

    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=failed`);
    }

    // Generate short-lived access token
    const accessToken = this.authService.generateAccessToken(req.user);

    // Generate long-lived refresh token and store hash in DB
    const refreshToken = await this.authService.generateRefreshToken(
      req.user.id,
    );

    // Set tokens in HttpOnly, Secure cookies
    res.cookie(
      ACCESS_COOKIE_NAME,
      accessToken,
      cookieOptions(15 * 60 * 1000), // 15 minutes
    );
    res.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      cookieOptions(7 * 24 * 60 * 60 * 1000), // 7 days
    );

    // Redirect without tokens in the URL
    return res.redirect(`${frontendUrl}/onboarding?redirect=/dashboard`);
  }

  // --- Refresh: issue new access token using refresh cookie ---
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Validate refresh token signature/expiry and DB hash
    const user = await this.authService.validateRefreshToken(refreshToken);

    // Rotate: issue new tokens
    const newAccessToken = this.authService.generateAccessToken(user);
    const newRefreshToken = await this.authService.generateRefreshToken(
      user.id,
    );

    res.cookie(
      ACCESS_COOKIE_NAME,
      newAccessToken,
      cookieOptions(15 * 60 * 1000),
    );
    res.cookie(
      REFRESH_COOKIE_NAME,
      newRefreshToken,
      cookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    return res.json({ message: 'Tokens refreshed' });
  }

  // --- Logout: clear cookies and invalidate refresh token in DB ---
  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthRequest, @Res() res: Response) {
    await this.authService.invalidateRefreshToken(req.user.id);

    res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions(0));
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions(0));

    return res.json({ message: 'Logged out successfully' });
  }

  // --- Get current user profile ---
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
