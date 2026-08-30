import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const corsOrigins = configService
    .get<string>('CORS_ORIGIN')
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Monesto PWA API')
    .setDescription(
      'Backend API for @monesto/pwa: email/Telegram auth, feature flags, FX rates, and the finance domain (income sources, expenses, assets, distribution rules, vacation periods). ' +
        'Independent of, and unrelated to, apps/server and apps/webapp.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'UUID',
        description:
          'End-user session token from `sessionToken` in the response of `POST /auth/email/verify-code` or `POST /auth/telegram`. Header: `Authorization: Bearer <token>`.',
      },
      'session',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'UUID',
        description:
          'Admin session token from `sessionToken` in the response of `POST /admin/auth/login`. Header: `Authorization: Bearer <token>`.',
      },
      'admin-session',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
