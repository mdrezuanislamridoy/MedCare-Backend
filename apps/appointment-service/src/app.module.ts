import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@medcare/kafka';
import { LoggerModule } from '@medcare/logger';
import { SharedModule } from '@medcare/shared';
import { PrismaModule } from './prisma/prisma.module';
import { AppointmentModule } from './appointment/appointment.module';
import { AppointmentEventPublisher } from './events/appointment.publisher';
import { AppointmentEventConsumer } from './events/appointment.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    LoggerModule,
    SharedModule,
    PrismaModule,
    AppointmentModule,
  ],
  controllers: [AppointmentEventConsumer],
  providers: [AppointmentEventPublisher],
  exports: [AppointmentEventPublisher],
})
export class AppModule {}
