import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../../src/common/common.module';
import { KafkaModule } from '../../../libs/kafka/src';
import { LoggerModule } from '../../../libs/logger/src';
import { PatientModule } from '../../../src/microservices/patient/patient.module';
import { AuditModule } from '../../../src/microservices/audit/audit.module';
import { PrismaModule } from './prisma/prisma.module';
import { validateEnv } from '../../../src/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CommonModule,
    KafkaModule,
    LoggerModule,
    PrismaModule,
    PatientModule,
    AuditModule,
  ],
})
export class AppModule {}
