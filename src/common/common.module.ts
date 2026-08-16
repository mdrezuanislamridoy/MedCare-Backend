import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './cache/redis/redis.module';
import { LiveQueueEventService } from './events/live-queue-event.service';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [LiveQueueEventService],
  exports: [PrismaModule, RedisModule, LiveQueueEventService],
})
export class CommonModule {}
