import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class BasePrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Base hook
  }

  async onModuleDestroy() {
    // Base hook
  }
}
