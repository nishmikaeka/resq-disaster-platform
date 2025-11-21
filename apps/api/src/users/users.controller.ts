// apps/api/src/users/users.controller.ts
import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from 'src/auth/jwt.guard';

class UpdateRoleDto {
  role: 'VICTIM' | 'VOLUNTEER';
}
interface AuthRequest extends Request {
  user: { id: string; email: string; name?: string };
}

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Patch('me')
  @UseGuards(JwtGuard)
  async updateMe(@Req() req: AuthRequest, @Body() body: UpdateRoleDto) {
    return this.prisma.user.update({
      where: { id: req.user.id },
      data: { role: body.role },
    });
  }
}
