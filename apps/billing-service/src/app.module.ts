import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@medcare/kafka';
import { LoggerModule } from '@medcare/logger';
import { SharedModule } from '@medcare/shared';
import { PrismaModule } from './prisma/prisma.module';
import { FinanceModule } from './billing/finance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    LoggerModule,
    SharedModule,
    PrismaModule,
    FinanceModule,
  ],
})
export class AppModule {}
