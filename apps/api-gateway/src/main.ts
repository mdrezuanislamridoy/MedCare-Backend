import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MedCare API Gateway')
    .setDescription(
      'Central API Gateway routing requests to MedCare microservices.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerCustomOptions = {
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  };
  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🌐 MedCare API Gateway is running on: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
