import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService, ChatLiveEvent } from './chat.service';
import { SendChatMessageDto } from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.logger.log('Chat WebSocket Gateway initialized on namespace /chat');

    // Subscribe to internal chat events to broadcast to appropriate rooms
    this.chatService.getStream().subscribe((event: ChatLiveEvent) => {
      if (this.server) {
        this.server.to(`conversation_${event.conversationId}`).emit('chatEvent', event);
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to chat: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from chat: ${client.id}`);
  }

  // ==========================================
  // ROOM SUBSCRIPTION
  // ==========================================
  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId?: string },
  ) {
    const room = `conversation_${data.conversationId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation_${data.conversationId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left ${room}`);
    return { event: 'left', room };
  }

  // ==========================================
  // TYPING INDICATOR
  // ==========================================
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    },
  ) {
    const room = `conversation_${data.conversationId}`;
    client.to(room).emit('userTyping', {
      conversationId: data.conversationId,
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
    });
  }

  // ==========================================
  // REAL-TIME MESSAGE SEND
  // ==========================================
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      message: SendChatMessageDto;
    },
  ) {
    try {
      const saved = await this.chatService.sendMessage(
        data.senderId,
        data.conversationId,
        data.message,
      );

      const room = `conversation_${data.conversationId}`;
      this.server.to(room).emit('newMessage', saved);

      return { status: 'success', data: saved };
    } catch (err: any) {
      return { status: 'error', message: err?.message || 'Failed to send message' };
    }
  }
}
