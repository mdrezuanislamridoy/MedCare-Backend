import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from './common/common.module';
import { AnalyticsModule } from './microservices/analytics/analytics.module';
import { DoctorModule } from './microservices/doctor/doctor.module';
import { PatientModule } from './microservices/patient/patient.module';
import { ClinicModule } from './microservices/clinic/clinic.module';
import { AppointmentModule } from './microservices/appointment/appointment.module';
import { FinanceModule } from './microservices/finance/finance.module';
import { ReviewModule } from './microservices/review/review.module';
import { NotificationModule } from './microservices/notification/notification.module';
import { AuditModule } from './microservices/audit/audit.module';
import { RbacModule } from './microservices/rbac/rbac.module';
import { SystemModule } from './microservices/system/system.module';
import { SupportModule } from './microservices/support/support.module';
import { ChatModule } from './microservices/chat/chat.module';
import {
  getMicroserviceServerOptions,
  getTransportConfig,
} from './microservices/common/microservices.transport';
import { validateEnv } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    CommonModule,
    AnalyticsModule,
    DoctorModule,
    PatientModule,
    ClinicModule,
    AppointmentModule,
    FinanceModule,
    ReviewModule,
    NotificationModule,
    AuditModule,
    RbacModule,
    SystemModule,
    SupportModule,
    ChatModule,
  ],
})
export class StandaloneMicroservicesModule {}

async function bootstrap() {
  const microserviceOptions = getMicroserviceServerOptions();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneMicroservicesModule,
    microserviceOptions,
  );

  const config = getTransportConfig();
  await app.listen();
  console.log(
    `🩺 MedCare Standalone Microservices Cluster is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
