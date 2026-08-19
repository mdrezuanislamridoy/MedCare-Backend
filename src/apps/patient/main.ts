import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { PatientModule } from '../../microservices/patient/patient.module';
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
    PatientModule,
    AuditModule,
  ],
})
export class StandalonePatientAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.PATIENT_SERVICE_PORT || '3003', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandalonePatientAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `🏥 MedCare Patient Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
