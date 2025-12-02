// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import passport from 'passport';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Session configuration
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || 'resq-super-secret-2025-change-in-prod',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: true,
      },
    }),
  );

  // Passport initialization
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

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Important for Railway

  console.log(`🚀 Backend started on port ${port}`);
  console.log('🔐 Google OAuth ready — callback: /api/auth/callback/google');
}
bootstrap();
