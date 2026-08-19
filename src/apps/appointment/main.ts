import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { AppointmentModule } from '../../microservices/appointment/appointment.module';
import { AuditModule } from '../../microservices/audit/audit.module';
import {
  getMicroserviceServerOptions,
  getTransportConfig,
} from '../../microservices/common/microservices.transport';
import { validateEnv } from '../../common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CommonModule,
    AppointmentModule,
    AuditModule,
  ],
})
export class StandaloneAppointmentAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.APPOINTMENT_SERVICE_PORT || '3004', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneAppointmentAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `📅 MedCare Appointment Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
