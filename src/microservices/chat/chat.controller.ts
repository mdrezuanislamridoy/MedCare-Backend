import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { ChatService } from './chat.service';
import {
  StartConversationDto,
  SendChatMessageDto,
  ConversationFilterDto,
  ChatMessageFilterDto,
} from './dto/chat.dto';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @MessagePattern(PATTERNS.CHAT.START_CONVERSATION)
  async startConversation(
    @Payload() payload: { userId: string; dto: StartConversationDto },
  ) {
    return this.chatService.startOrGetConversation(payload.userId, payload.dto);
  }

  @MessagePattern(PATTERNS.CHAT.LIST_CONVERSATIONS)
  async listConversations(
    @Payload() payload: { userId: string; filter: ConversationFilterDto },
  ) {
    return this.chatService.listUserConversations(
      payload.userId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.CHAT.GET_CONVERSATION_MESSAGES)
  async getMessages(
    @Payload()
    payload: {
      userId: string;
      conversationId: string;
      filter: ChatMessageFilterDto;
    },
  ) {
    return this.chatService.getConversationMessages(
      payload.userId,
      payload.conversationId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.CHAT.SEND_MESSAGE)
  async sendMessage(
    @Payload()
    payload: {
      senderId: string;
      conversationId: string;
      dto: SendChatMessageDto;
    },
  ) {
    return this.chatService.sendMessage(
      payload.senderId,
      payload.conversationId,
      payload.dto,
    );
  }

  @MessagePattern(PATTERNS.CHAT.MARK_AS_READ)
  async markAsRead(
    @Payload() payload: { userId: string; conversationId: string },
  ) {
    return this.chatService.markAsRead(payload.userId, payload.conversationId);
  }

  @MessagePattern(PATTERNS.CHAT.GET_UNREAD_COUNT)
  async getUnreadCount(@Payload() payload: { userId: string }) {
    return this.chatService.getUnreadCount(payload.userId);
  }
}
