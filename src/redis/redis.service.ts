import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(configService: ConfigService) {
    this.client = new Redis(configService.getOrThrow<string>('REDIS_URL'));
  }

  set(key: string, value: string, ttlSeconds: number) {
    return this.client.set(key, value, 'EX', ttlSeconds);
  }

  get(key: string) {
    return this.client.get(key);
  }

  del(key: string) {
    return this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
