import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './cache/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  exports: [PrismaModule, RedisModule],
})
export class CommonModule {}
