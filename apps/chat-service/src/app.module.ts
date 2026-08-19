import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaModule } from '@medcare/kafka';
import { LoggerModule } from '@medcare/logger';
import { SharedModule } from '@medcare/shared';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KafkaModule,
    LoggerModule,
    SharedModule,
    PrismaModule,
    ChatModule,
  ],
  providers: [ChatGateway],
})
export class AppModule {}
