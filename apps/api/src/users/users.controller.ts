import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from 'src/auth/jwt.guard';
import { JwtService } from '@nestjs/jwt';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateRoleDto {
  @IsNotEmpty()
  @IsIn(['VICTIM', 'VOLUNTEER'])
  role: 'VICTIM' | 'VOLUNTEER';

  @IsNotEmpty()
  @IsNumber({ message: 'Latitude must be a valid number.' })
  @Type(() => Number)
  lat?: number;

  @IsNotEmpty()
  @IsNumber({ message: 'Longitude must be a valid number.' })
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsString()
  phone?: string;
}

class UpdateLocationDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}

interface AuthRequest extends Request {
  user: { id: string; email: string; name?: string };
}

@Controller('users')
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, // Add JwtService
  ) {}

  @Patch('me')
  @UseGuards(JwtGuard)
  async updateMe(@Req() req: AuthRequest, @Body() body: UpdateRoleDto) {
    // Update user location, phone, role in DB
    const updatedUser = await this.prisma.user.update({
      where: { id: req.user.id },
      data: {
        role: body.role,
        lat: body.lat,
        lng: body.lng,
        phone: body.phone,
      },
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

    // Generate a new token with same secret
    const newToken = this.jwtService.sign(
      {
        sub: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      {
        secret: process.env.JWT_SECRET!,
        expiresIn: '7d',
      },
    );

    return {
      user: updatedUser,
      access_token: newToken,
    };
  }

  @Patch('location')
  @UseGuards(JwtGuard)
  async updateLocation(
    @Req() req: AuthRequest,
    @Body() body: UpdateLocationDto,
  ) {
    const updatedUser = await this.prisma.user.update({
      where: { id: req.user.id },
      data: {
        lat: body.lat,
        lng: body.lng,
      },
    });
    console.log(updatedUser.lat, updatedUser.lng);
    return { message: 'Location updated', user: updatedUser };
  }
}
