import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CommonModule } from '../../common/common.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CommonModule, AuditModule],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
