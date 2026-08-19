import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { RbacModule } from '../../microservices/rbac/rbac.module';
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
    RbacModule,
    AuditModule,
  ],
})
export class StandaloneRbacAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.RBAC_SERVICE_PORT || '3009', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneRbacAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `🛡️ MedCare RBAC & Security Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
