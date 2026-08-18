import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './cache/redis/redis.module';
import { LiveQueueEventService } from './events/live-queue-event.service';
import { LiveSupportEventService } from './events/live-support-event.service';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [LiveQueueEventService, LiveSupportEventService],
  exports: [
    PrismaModule,
    RedisModule,
    LiveQueueEventService,
    LiveSupportEventService,
  ],
})
export class CommonModule {}
