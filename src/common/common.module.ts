import { Module } from '@nestjs/common';
import { RedisModule } from './cache/redis/redis.module';
import { LiveQueueEventService } from './events/live-queue-event.service';
import { LiveSupportEventService } from './events/live-support-event.service';

@Module({
  imports: [RedisModule],
  providers: [LiveQueueEventService, LiveSupportEventService],
  exports: [
    RedisModule,
    LiveQueueEventService,
    LiveSupportEventService,
  ],
})
export class CommonModule {}
