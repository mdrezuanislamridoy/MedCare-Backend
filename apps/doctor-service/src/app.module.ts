import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@medcare/kafka';
import { LoggerModule } from '@medcare/logger';
import { PrismaModule } from './prisma/prisma.module';
import { DoctorModule } from './doctor/doctor.module';
import { DoctorEventPublisher } from './events/doctor.publisher';
import { DoctorEventConsumer } from './events/doctor.consumer';
import { SharedModule } from '@medcare/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    LoggerModule,
    SharedModule,
    PrismaModule,
    DoctorModule,
  ],
  controllers: [DoctorEventConsumer],
  providers: [DoctorEventPublisher],
  exports: [DoctorEventPublisher],
})
export class AppModule {}
