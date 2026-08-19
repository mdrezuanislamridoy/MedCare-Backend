import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { SupportModule } from '../../microservices/support/support.module';
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
    SupportModule,
    AuditModule,
  ],
})
export class StandaloneSupportAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.SUPPORT_SERVICE_PORT || '3012', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneSupportAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `🎧 MedCare Support Staff Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
