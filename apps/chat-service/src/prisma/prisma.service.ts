import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Optional() configService?: ConfigService) {
    const connectionString =
      configService?.get<string>('DATABASE_URL_CHAT') ||
      process.env.DATABASE_URL_CHAT ||
      configService?.get<string>('DATABASE_URL') ||
      process.env.DATABASE_URL ||
      'postgresql://medcare:medcare_secure_pass@localhost:5435/medcare_db?schema=public';

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
