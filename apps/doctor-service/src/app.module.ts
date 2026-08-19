import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '../../../libs/kafka/src';
import { LoggerModule } from '../../../libs/logger/src';
import { PrismaModule } from './prisma/prisma.module';
import { DoctorModule } from './doctor/doctor.module';
import { DoctorEventPublisher } from './events/doctor.publisher';
import { DoctorEventConsumer } from './events/doctor.consumer';
import { validateEnv } from '../../../src/common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    KafkaModule,
    LoggerModule,
    PrismaModule,
    DoctorModule,
  ],
  controllers: [DoctorEventConsumer],
  providers: [DoctorEventPublisher],
  exports: [DoctorEventPublisher],
})
export class AppModule {}
