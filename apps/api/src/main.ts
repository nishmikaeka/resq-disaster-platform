// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as passport from 'passport';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Keep your global prefix — totally fine
  app.setGlobalPrefix('api');

  // THIS IS THE CORRECT WAY — NO TS ERROR
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || 'resq-super-secret-2025-change-in-prod',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: 'lax',
      },
    }),
  );

  // Passport session support — REQUIRED for Google OAuth
  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://resq-disaster-platform-web.vercel.app',
      'https://resq.lk',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  console.log('Backend started on port 3001');
  console.log('Google OAuth ready — callback: /api/auth/callback/google');

  await app.listen(3001);
}
bootstrap();
