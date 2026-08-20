import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisModule } from './cache/redis/redis.module';
import { LiveQueueEventService } from './events/live-queue-event.service';
import { LiveSupportEventService } from './events/live-support-event.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [PrismaService, LiveQueueEventService, LiveSupportEventService],
  exports: [PrismaService, RedisModule, LiveQueueEventService, LiveSupportEventService],
})
export class CommonModule {}
