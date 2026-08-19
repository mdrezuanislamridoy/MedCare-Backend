import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { FinanceModule } from '../../microservices/finance/finance.module';
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
    FinanceModule,
    AuditModule,
  ],
})
export class StandaloneFinanceAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.FINANCE_SERVICE_PORT || '3006', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneFinanceAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `💳 MedCare Finance Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
