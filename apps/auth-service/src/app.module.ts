import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@medcare/kafka';
import { LoggerModule } from '@medcare/logger';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from '@medcare/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    LoggerModule,
    SharedModule,
    PrismaModule,
    AuthModule,
  ],
})
export class AppModule {}
