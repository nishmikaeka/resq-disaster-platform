import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { IncidentsModule } from './incidents/incidents.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersController } from './users/users.controller';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // makes env global
    PrismaModule,
    AuthModule,
    IncidentsModule,
    CloudinaryModule,
    UsersModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
  controllers: [UsersController],
})
export class AppModule {}
