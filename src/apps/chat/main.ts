import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CommonModule } from '../../common/common.module';
import { ChatModule } from '../../microservices/chat/chat.module';
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
    ChatModule,
    AuditModule,
  ],
})
export class StandaloneChatAppModule {}

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    parseInt(process.env.CHAT_SERVICE_PORT || '3014', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    StandaloneChatAppModule,
    options,
  );
  const config = getTransportConfig();
  await app.listen();
  console.log(
    `💬 MedCare Chat & Messaging Microservice is running [Transport: ${config.transportType}]`,
  );
}

bootstrap();
