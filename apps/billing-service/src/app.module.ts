import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../../../src/common/common.module';
import { KafkaModule } from '../../../../libs/kafka/src';
import { LoggerModule } from '../../../../libs/logger/src';
import { FinanceModule } from '../../../../src/microservices/finance/finance.module';
import { AuditModule } from '../../../../src/microservices/audit/audit.module';
import { validateEnv } from '../../../../src/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CommonModule,
    KafkaModule,
    LoggerModule,
    FinanceModule,
    AuditModule,
  ],
})
export class AppModule {}
