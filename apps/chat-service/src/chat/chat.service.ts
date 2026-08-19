import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConversationStatus,
  ConversationType,
  MessageType,
} from '@medcare/contracts';
import {
  StartConversationDto,
  SendChatMessageDto,
  ConversationFilterDto,
  ChatMessageFilterDto,
} from './dto/chat.dto';

export interface ChatLiveEvent {
  type: 'NEW_MESSAGE' | 'MESSAGES_READ' | 'CONVERSATION_UPDATED';
  conversationId: string;
  senderId?: string;
  message?: any;
  timestamp: string;
}

@Injectable()
export class ChatService {
  private readonly chatEventSubject = new Subject<ChatLiveEvent>();

  constructor(private readonly prisma: PrismaService) {}

  getStream(): Observable<ChatLiveEvent> {
    return this.chatEventSubject.asObservable();
  }

  // ==========================================
  // 1. START OR GET CONVERSATION
  // ==========================================
  async startOrGetConversation(userId: string, dto: StartConversationDto) {
    if (userId === dto.recipientUserId) {
      throw new BadRequestException(
        'Cannot start a chat conversation with yourself',
      );
    }

    // Check if direct conversation already exists between these 2 users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        appointmentId: dto.appointmentId || null,
        type: (dto.type as any) || ConversationType.DIRECT,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.recipientUserId } } },
        ],
      },
      include: {
        participants: true,
      },
    });

    if (existing) {
      if (dto.initialMessage) {
        await this.sendMessage(userId, existing.id, {
          message: dto.initialMessage,
          type: MessageType.TEXT,
        });
      }
      return existing;
    }

    // Auto-generate title if not specified
    const title = dto.title || `Chat between ${userId} & ${dto.recipientUserId}`;

    // Create new conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        title,
        type: (dto.type as any) || ConversationType.DIRECT,
        status: ConversationStatus.ACTIVE,
        appointmentId: dto.appointmentId,
        participants: {
          create: [
            { userId, unreadCount: 0 },
            { userId: dto.recipientUserId, unreadCount: 0 },
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    if (dto.initialMessage) {
      await this.sendMessage(userId, conversation.id, {
        message: dto.initialMessage,
        type: MessageType.TEXT,
      });
    }

    return conversation;
  }

  // ==========================================
  // 2. SEND MESSAGE
  // ==========================================
  async sendMessage(
    senderUserId: string,
    conversationId: string,
    dto: SendChatMessageDto,
  ) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderUserId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const created = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: senderUserId,
        message: dto.message,
        type: (dto.type as any) || MessageType.TEXT,
        isInternalNote: dto.isInternalNote || false,
        attachments: (dto.attachments as any) || [],
      },
    });

    // Update conversation snippet and increment unread for other participants
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: dto.message,
        lastMessageAt: new Date(),
        status: ConversationStatus.ACTIVE,
      },
    });

    await this.prisma.chatParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: senderUserId },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Emit live event for WebSocket / SSE subscribers
    const liveEvent: ChatLiveEvent = {
      type: 'NEW_MESSAGE',
      conversationId,
      senderId: senderUserId,
      message: created,
      timestamp: new Date().toISOString(),
    };
    this.chatEventSubject.next(liveEvent);

    return created;
  }

  // ==========================================
  // 3. LIST USER CONVERSATIONS
  // ==========================================
  async listUserConversations(userId: string, query: ConversationFilterDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      participants: {
        some: { userId },
      },
    };

    if (query.type) {
      where.type = query.type as any;
    }
    if (query.status) {
      where.status = query.status as any;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { lastMessage: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participants: true,
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const formatted = items.map((c) => {
      const myParticipant = c.participants.find((p) => p.userId === userId);
      const recipient = c.participants.find((p) => p.userId !== userId);
      return {
        id: c.id,
        title: c.title,
        type: c.type,
        status: c.status,
        appointmentId: c.appointmentId,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unreadCount: myParticipant?.unreadCount || 0,
        createdAt: c.createdAt,
        recipientUserId: recipient?.userId || null,
        participants: c.participants,
      };
    });

    return {
      items: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================
  // 4. GET CONVERSATION MESSAGES & MARK READ
  // ==========================================
  async getConversationMessages(
    userId: string,
    conversationId: string,
    query: ChatMessageFilterDto,
  ) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.chatMessage.count({ where: { conversationId } }),
    ]);

    // Reset unread count for current user
    if (participant.unreadCount > 0) {
      await this.prisma.chatParticipant.update({
        where: { id: participant.id },
        data: {
          unreadCount: 0,
          lastReadAt: new Date(),
        },
      });

      this.chatEventSubject.next({
        type: 'MESSAGES_READ',
        conversationId,
        senderId: userId,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      messages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================
  // 5. MARK CONVERSATION AS READ
  // ==========================================
  async markAsRead(userId: string, conversationId: string) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    await this.prisma.chatParticipant.update({
      where: { id: participant.id },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    return { success: true, message: 'Messages marked as read' };
  }

  // ==========================================
  // 6. UPDATE CONVERSATION STATUS (RESOLVE / ARCHIVE)
  // ==========================================
  async updateConversationStatus(
    userId: string,
    conversationId: string,
    status: ConversationStatus,
  ) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: status as any },
    });

    return {
      success: true,
      message: `Conversation status updated to ${status}`,
      conversation: updated,
    };
  }

  // ==========================================
  // 7. GET OVERALL UNREAD COUNT
  // ==========================================
  async getUnreadCount(userId: string) {
    const aggregations = await this.prisma.chatParticipant.aggregate({
      where: {
        userId,
        conversation: { status: ConversationStatus.ACTIVE as any },
      },
      _sum: {
        unreadCount: true,
      },
    });

    return {
      unreadCount: aggregations._sum.unreadCount || 0,
    };
  }
}
