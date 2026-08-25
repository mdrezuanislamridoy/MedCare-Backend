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
    .setTitle('MedCare Healthcare Platform API')
    .setDescription(
      `## 🏥 MedCare Enterprise Healthcare Management & Telemedicine Platform
      
This OpenAPI documentation provides a complete reference for all REST endpoints routed through the API Gateway to MedCare microservices:

- **Public & Discovery**: Unauthenticated public doctor and clinic directory, aggregations, stats.
- **Patient Portal**: Self-service appointments, digital prescriptions, lab reports, video consultations, invoices, and reviews.
- **Doctor Portal**: Doctor workspace, consultation notes, digital prescriptions, teleconsultation tokens, schedules, earnings.
- **Receptionist Portal**: Front-desk operations, 6-step patient check-in wizard, live token queue, doctor schedule matrix, walk-ins.
- **Clinic Manager Portal**: Clinic branch operations, doctor rosters, staff management, room allocation, appointments, queues.
- **Support Staff Portal**: Helpdesk tickets, patient lookup, and appointment assistance.
- **Admin & Management**: Platform analytics, doctor verification queues, patient directory, financial refunds, audit logs.
- **Super Admin & RBAC**: Role-permission matrix, elevated access requests, and system health monitors.
- **Chat & Real-Time**: Bi-directional messaging, rooms, threads, and attachments.
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
    .addTag(
      'Public Gateway',
      'Public directory, landing page aggregations, and stats',
    )
    .addTag(
      'Patient Portal',
      'Patient self-service, bookings, prescriptions, medical records, and video consultations',
    )
    .addTag(
      'Doctor Portal',
      'Doctor clinical workspace, consultation notes, digital prescriptions, schedule management, earnings',
    )
    .addTag(
      'Chat & Real-Time Messaging',
      'Bi-directional real-time messaging, direct patient-doctor threads, file attachments',
    )
    .addTag(
      'Receptionist Portal',
      'Front-desk operations, 6-step check-in wizard, token queues, and doctor schedules',
    )
    .addTag(
      'Support Staff Portal',
      'Helpdesk support tickets, dispute complaints escalation, patient lookup',
    )
    .addTag(
      'Clinic Manager Portal',
      'Clinic branch operations, doctor rosters, staff management, room allocation',
    )
    .addTag(
      'Admin Analytics',
      'Platform-wide analytics, revenue stats, and utilization metrics',
    )
    .addTag(
      'Admin Doctor Management',
      'Doctor accounts, verification queue decisions, and specialties',
    )
    .addTag(
      'Admin Patient Management',
      'Patient directory and account status management',
    )
    .addTag(
      'Admin Appointments',
      'Appointment scheduling, status transitions, and doctor reassignments',
    )
    .addTag(
      'Admin Finance & Transactions',
      'Invoices, transaction history, and refunds',
    )
    .addTag(
      'Admin Clinic Management',
      'Clinic branches, room capacities, and locations',
    )
    .addTag(
      'Admin Reviews & Ratings',
      'Patient review moderation and feedback flags',
    )
    .addTag(
      'Admin Notifications',
      'System notifications, broadcast alerts, and priority messages',
    )
    .addTag(
      'Admin Audit Logs',
      'Immutable security and front-desk audit trail logs',
    )
    .addTag(
      'Super Admin & RBAC',
      'Privileged access requests, role-permission matrix, and platform roles',
    )
    .addTag(
      'Super Admin System & Health',
      'Microservices status, system settings, and database backups',
    )
    .addTag('Public Payments & Webhooks', 'Payment gateway webhook receivers')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerCustomOptions = {
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
  };
  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🌐 MedCare API Gateway is running on: http://localhost:${port}`);
  console.log(`📖 Swagger API Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
