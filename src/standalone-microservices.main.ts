import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from './common/common.module';
import { AnalyticsModule } from '../apps/analytics-service/src/analytics/analytics.module';
import { DoctorModule } from '../apps/doctor-service/src/doctor/doctor.module';
import { PatientModule } from '../apps/patient-service/src/patient/patient.module';
import { ClinicModule } from '../apps/clinic-service/src/clinic/clinic.module';
import { AppointmentModule } from '../apps/appointment-service/src/appointment/appointment.module';
import { FinanceModule } from '../apps/billing-service/src/billing/finance.module';
import { NotificationModule } from '../apps/notification-service/src/notification/notification.module';
import { AuditModule } from '../apps/audit-service/src/audit/audit.module';
import { ChatModule } from '../apps/chat-service/src/chat/chat.module';
import {
  getMicroserviceServerOptions,
  getTransportConfig,
} from '../libs/broker/src';
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
    NotificationModule,
    AuditModule,
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
