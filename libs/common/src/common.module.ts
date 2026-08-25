import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisModule } from './cache/redis/redis.module';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { LiveQueueEventService } from './events/live-queue-event.service';
import { LiveSupportEventService } from './events/live-support-event.service';

@Global()
@Module({
  imports: [RedisModule, MailModule],
  providers: [
    PrismaService,
    MailService,
    LiveQueueEventService,
    LiveSupportEventService,
  ],
  exports: [
    PrismaService,
    RedisModule,
    MailModule,
    MailService,
    LiveQueueEventService,
    LiveSupportEventService,
  ],
})
export class CommonModule {}
