import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS } from '@medcare/contracts';
import { JwtAuthGuard } from '@medcare/shared';

@ApiTags('Chat & Messaging')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatGatewayController {
  constructor(
    @Inject(MICROSERVICES.CHAT) private readonly chatClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'List user conversations' })
  @Get('conversations')
  async listConversations(@Req() req: any) {
    return this.chatClient.send(PATTERNS.CHAT.LIST_CONVERSATIONS, req.user.id);
  }

  @ApiOperation({ summary: 'Get messages in a conversation' })
  @Get('conversations/:id/messages')
  async getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query() query: any,
  ) {
    return this.chatClient.send(PATTERNS.CHAT.GET_CONVERSATION_MESSAGES, {
      userId: req.user.id,
      conversationId: id,
      filter: query,
    });
  }

  @ApiOperation({ summary: 'Send a message' })
  @Post('messages')
  async sendMessage(@Req() req: any, @Body() body: any) {
    return this.chatClient.send(PATTERNS.CHAT.SEND_MESSAGE, {
      userId: req.user.id,
      dto: body,
    });
  }

  @ApiOperation({ summary: 'Mark conversation as read' })
  @Patch('conversations/:id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.chatClient.send(PATTERNS.CHAT.MARK_AS_READ, {
      userId: req.user.id,
      conversationId: id,
    });
  }
}
