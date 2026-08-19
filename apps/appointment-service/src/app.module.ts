import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '../../../libs/kafka/src';
import { LoggerModule } from '../../../libs/logger/src';
import { PrismaModule } from './prisma/prisma.module';
import { AppointmentModule } from '../../../src/microservices/appointment/appointment.module';
import { AuditModule } from '../../../src/microservices/audit/audit.module';
import { AppointmentEventPublisher } from './events/appointment.publisher';
import { AppointmentEventConsumer } from './events/appointment.consumer';
import { validateEnv } from '../../../src/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    KafkaModule,
    LoggerModule,
    PrismaModule,
    AppointmentModule,
    AuditModule,
  ],
  controllers: [AppointmentEventConsumer],
  providers: [AppointmentEventPublisher],
  exports: [AppointmentEventPublisher],
})
export class AppModule {}
