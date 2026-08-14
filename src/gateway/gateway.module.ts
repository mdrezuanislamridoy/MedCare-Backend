import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../microservices/analytics/analytics.module';
import { AdminAnalyticsGatewayController } from './admin-analytics.gateway.controller';

@Module({
  imports: [
    AnalyticsModule,
  ],
  controllers: [
    AdminAnalyticsGatewayController,
  ],
})
export class GatewayModule {}
