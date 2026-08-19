import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { NotificationModule } from '../../microservices/notification/notification.module';
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
    NotificationModule,
    AuditModule,
  ],
})
export class StandaloneNotificationAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3007', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneNotificationAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `🔔 MedCare Notification Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
