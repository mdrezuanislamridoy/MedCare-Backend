import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@medcare/kafka';
import { LoggerModule } from '@medcare/logger';
import { SharedModule } from '@medcare/shared';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    LoggerModule,
    SharedModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
