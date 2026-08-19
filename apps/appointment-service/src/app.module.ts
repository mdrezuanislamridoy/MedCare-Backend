import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../../../src/common/common.module';
import { KafkaModule } from '../../../libs/kafka/src';
import { LoggerModule } from '../../../libs/logger/src';
import { AppointmentModule } from '../../../src/microservices/appointment/appointment.module';
import { AuditModule } from '../../../src/microservices/audit/audit.module';
import { AppointmentEventPublisher } from './events/appointment.publisher';
import { AppointmentEventConsumer } from './events/appointment.consumer';
import { validateEnv } from '../../../src/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CommonModule,
    KafkaModule,
    LoggerModule,
    AppointmentModule,
    AuditModule,
  ],
  controllers: [AppointmentEventConsumer],
  providers: [AppointmentEventPublisher],
  exports: [AppointmentEventPublisher],
})
export class AppModule {}
