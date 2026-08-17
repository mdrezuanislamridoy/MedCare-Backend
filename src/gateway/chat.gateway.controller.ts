import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Observable, interval, map, merge } from 'rxjs';
import { ChatService } from '../microservices/chat/chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import {
  StartConversationDto,
  SendChatMessageDto,
  ConversationFilterDto,
  ChatMessageFilterDto,
  UpdateConversationStatusDto,
} from '../microservices/chat/dto/chat.dto';

@ApiTags('Chat & Real-Time Messaging')
@ApiBearerAuth('JWT-auth')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.PATIENT,
  UserRole.DOCTOR,
  UserRole.SUPPORT_STAFF,
  UserRole.RECEPTIONIST,
  UserRole.CLINIC_MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
)
export class ChatGatewayController {
  constructor(private readonly chatService: ChatService) {}

  // ==========================================
  // 1. START OR GET CONVERSATION
  // ==========================================
  @ApiOperation({
    summary: 'Start a new conversation or retrieve existing thread with a doctor, patient, or staff',
  })
  @ApiResponse({ status: 201, description: 'Conversation started or retrieved' })
  @Post('conversations')
  async startConversation(
    @Req() req: AuthenticatedRequest,
    @Body() body: StartConversationDto,
  ) {
    return this.chatService.startOrGetConversation(req.user.id, body);
  }

  // ==========================================
  // 2. LIST USER CONVERSATIONS
  // ==========================================
  @ApiOperation({
    summary: 'List active conversations for logged-in user with latest message, unread badge, and recipient profile',
  })
  @ApiResponse({ status: 200, description: 'User conversations list returned' })
  @Get('conversations')
  async listConversations(
    @Req() req: AuthenticatedRequest,
    @Query() query: ConversationFilterDto,
  ) {
    return this.chatService.listUserConversations(req.user.id, query);
  }

  // ==========================================
  // 3. UNREAD MESSAGES COUNT
  // ==========================================
  @ApiOperation({
    summary: 'Get total unread messages count across all active conversations for badge indicator',
  })
  @ApiResponse({ status: 200, description: 'Unread count returned' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  // ==========================================
  // 4. GET CONVERSATION MESSAGES
  // ==========================================
  @ApiOperation({
    summary: 'Get chronological message history for a conversation and mark unread messages as read',
  })
  @ApiResponse({ status: 200, description: 'Messages list returned' })
  @ApiParam({ name: 'id', description: 'Conversation ID', example: 'conv-1001' })
  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query() query: ChatMessageFilterDto,
  ) {
    return this.chatService.getConversationMessages(req.user.id, id, query);
  }

  // ==========================================
  // 5. SEND MESSAGE
  // ==========================================
  @ApiOperation({
    summary: 'Send a message in a conversation with optional attachments or internal notes',
  })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiParam({ name: 'id', description: 'Conversation ID', example: 'conv-1001' })
  @Post('conversations/:id/messages')
  async sendMessage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SendChatMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, id, body);
  }

  // ==========================================
  // 6. MARK CONVERSATION AS READ
  // ==========================================
  @ApiOperation({
    summary: 'Explicitly mark all unread messages in a conversation as read',
  })
  @ApiResponse({ status: 200, description: 'Conversation marked as read' })
  @ApiParam({ name: 'id', description: 'Conversation ID', example: 'conv-1001' })
  @Post('conversations/:id/read')
  async markAsRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.chatService.markAsRead(req.user.id, id);
  }

  // ==========================================
  // 7. UPDATE CONVERSATION STATUS
  // ==========================================
  @ApiOperation({
    summary: 'Update conversation status (e.g. mark as RESOLVED or ARCHIVED)',
  })
  @ApiResponse({ status: 200, description: 'Conversation status updated' })
  @ApiParam({ name: 'id', description: 'Conversation ID', example: 'conv-1001' })
  @Patch('conversations/:id/status')
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateConversationStatusDto,
  ) {
    return this.chatService.updateConversationStatus(req.user.id, id, body.status);
  }

  // ==========================================
  // 8. REAL-TIME LIVE CHAT EVENT STREAM (SSE)
  // ==========================================
  @ApiOperation({
    summary: 'Server-Sent Events (SSE) live stream for incoming chat messages and typing notifications',
  })
  @ApiResponse({ status: 200, description: 'Chat SSE stream connected' })
  @Sse('stream')
  streamChatEvents(): Observable<MessageEvent> {
    const chatEvents$ = this.chatService.getStream().pipe(
      map(
        event =>
          ({
            data: event,
            type: 'chat-event',
          }) as MessageEvent,
      ),
    );

    const heartbeat$ = interval(15000).pipe(
      map(
        () =>
          ({
            data: { type: 'HEARTBEAT', timestamp: new Date().toISOString() },
            type: 'heartbeat',
          }) as MessageEvent,
      ),
    );

    return merge(chatEvents$, heartbeat$);
  }
}
