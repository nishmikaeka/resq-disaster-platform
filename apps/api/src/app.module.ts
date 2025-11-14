// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // makes env global
    AuthModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService], // export if other modules need PrismaService
})
export class AppModule {}
