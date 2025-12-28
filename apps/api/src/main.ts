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
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
      },
    }),
  );

  // Passport initialization
  app.use(passport.initialize());
  app.use(passport.session());

  // CORS configuration - UPDATED
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://resq-disaster-platform-web.vercel.app',
      'https://resq.lk',
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
