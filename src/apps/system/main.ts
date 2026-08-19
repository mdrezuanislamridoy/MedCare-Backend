import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { SystemModule } from '../../microservices/system/system.module';
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
    SystemModule,
    AuditModule,
  ],
})
export class StandaloneSystemAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.SYSTEM_SERVICE_PORT || '3013', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneSystemAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `⚙️ MedCare System Telemetry Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
