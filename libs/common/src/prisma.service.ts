import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class BasePrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {}
  async onModuleDestroy() {}
}

@Injectable()
export class PrismaService extends BasePrismaService {}
