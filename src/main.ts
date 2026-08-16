import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Serve static uploaded files (medical records, avatars, etc.)
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Swagger OpenAPI Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MedCare Healthcare Platform API')
    .setDescription(
      `## 🏥 MedCare Enterprise Healthcare Management & Telemedicine Platform
      
This OpenAPI documentation provides a complete reference for all REST endpoints across MedCare services:

- **Patient Portal**: Self-service appointments, digital prescriptions, lab reports upload, video consultation sessions, invoices, and reviews.
- **Receptionist Portal**: Front-desk operations, 6-step patient check-in wizard, live token queue, real-time SSE stream, doctor schedule matrix, and walk-in bookings.
- **Admin & Management**: Clinic branches, doctor verification queues, patient management, analytics, financial refunds, notifications broadcast, and compliance audit logs.
- **Super Admin & RBAC**: Role-permission matrix, elevated access requests, and system health monitors.
- **Public Payments & Webhooks**: Stripe, SSLCommerz, and asynchronous payment callbacks.

### 🔐 Authentication
Use the **Authorize** button with a valid JWT Bearer token:
\`\`\`
Bearer <your-access-token>
\`\`\`
    `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT Bearer token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Patient Portal', 'Patient self-service, bookings, prescriptions, medical records, and video consultations')
    .addTag('Receptionist Portal', 'Front-desk operations, 6-step check-in wizard, token queues, and doctor schedules')
    .addTag('Admin Analytics', 'Platform-wide analytics, revenue stats, and utilization metrics')
    .addTag('Admin Doctor Management', 'Doctor accounts, verification queue decisions, and specialties')
    .addTag('Admin Patient Management', 'Patient directory and account status management')
    .addTag('Admin Appointments', 'Appointment scheduling, status transitions, and doctor reassignments')
    .addTag('Admin Finance & Transactions', 'Invoices, transaction history, and refunds')
    .addTag('Admin Clinic Management', 'Clinic branches, room capacities, and locations')
    .addTag('Admin Reviews & Ratings', 'Patient review moderation and feedback flags')
    .addTag('Admin Notifications', 'System notifications, broadcast alerts, and priority messages')
    .addTag('Admin Audit Logs', 'Immutable security and front-desk audit trail logs')
    .addTag('Super Admin & RBAC', 'Privileged access requests, role-permission matrix, and platform roles')
    .addTag('Super Admin System & Health', 'Microservices status, system settings, and database backups')
    .addTag('Public Payments & Webhooks', 'Payment gateway webhook receivers')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'MedCare API Documentation',
    customCss: `
      .swagger-ui .topbar { background-color: #1e3a8a; }
      .swagger-ui .topbar .topbar-wrapper img { content: url('https://img.icons8.com/color/48/hospital-room.png'); }
      .swagger-ui .info { margin: 20px 0; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 MedCare Backend is running on: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
