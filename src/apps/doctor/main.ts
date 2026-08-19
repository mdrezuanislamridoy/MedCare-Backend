import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { DoctorModule } from '../../microservices/doctor/doctor.module';
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
    DoctorModule,
    AuditModule,
  ],
})
export class StandaloneDoctorAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.DOCTOR_SERVICE_PORT || '3002', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneDoctorAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `🩺 MedCare Doctor Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
