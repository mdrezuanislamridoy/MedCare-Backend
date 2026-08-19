import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { ClinicModule } from '../../microservices/clinic/clinic.module';
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
    ClinicModule,
    AuditModule,
  ],
})
export class StandaloneClinicAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.CLINIC_SERVICE_PORT || '3005', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneClinicAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `🏢 MedCare Clinic Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
