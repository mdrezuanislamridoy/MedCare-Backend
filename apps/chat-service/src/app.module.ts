import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../../../src/common/common.module';
import { KafkaModule } from '../../../../libs/kafka/src';
import { LoggerModule } from '../../../../libs/logger/src';
import { ChatModule } from '../../../../src/microservices/chat/chat.module';
import { AuditModule } from '../../../../src/microservices/audit/audit.module';
import { validateEnv } from '../../../../src/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CommonModule,
    KafkaModule,
    LoggerModule,
    ChatModule,
    AuditModule,
  ],
})
export class AppModule {}
