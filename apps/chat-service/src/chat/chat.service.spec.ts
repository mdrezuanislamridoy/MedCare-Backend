import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../common/cache/redis/redis.service';
import { AuditService } from '../audit/audit.service';
import {
  ConversationStatus,
  ConversationType,
  MessageType,
  UserRole,
} from '@medcare/contracts';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: any;
  let redis: any;
  let auditService: any;

  const mockUser1 = {
    id: 'usr-1',
    name: 'Dr. Sarah',
    email: 'sarah@medcare.local',
    role: UserRole.DOCTOR,
  };
  const mockUser2 = {
    id: 'usr-2',
    name: 'James Harrington',
    email: 'james@medcare.local',
    role: UserRole.PATIENT,
  };

  const mockConversation = {
    id: 'conv-1',
    title: 'Consultation with Dr. Sarah',
    type: ConversationType.DIRECT,
    status: ConversationStatus.ACTIVE,
    appointmentId: null,
    lastMessage: 'Hello Doctor',
    lastMessageAt: new Date(),
    participants: [
      {
        id: 'part-1',
        conversationId: 'conv-1',
        userId: 'usr-1',
        unreadCount: 0,
        user: mockUser1,
      },
      {
        id: 'part-2',
        conversationId: 'conv-1',
        userId: 'usr-2',
        unreadCount: 1,
        user: mockUser2,
      },
    ],
  };

  const mockMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'usr-1',
    senderRole: UserRole.DOCTOR,
    message: 'Hello James, how are you feeling today?',
    type: MessageType.TEXT,
    isInternalNote: false,
    createdAt: new Date(),
    sender: mockUser1,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'usr-1') return Promise.resolve(mockUser1);
          if (where.id === 'usr-2') return Promise.resolve(mockUser2);
          return Promise.resolve(null);
        }),
      },
      conversation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockConversation),
        findMany: jest.fn().mockResolvedValue([mockConversation]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(mockConversation),
      },
      chatParticipant: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.conversationId_userId) {
            return Promise.resolve({
              id: 'part-1',
              conversationId: where.conversationId_userId.conversationId,
              userId: where.conversationId_userId.userId,
              unreadCount: 1,
              user: mockUser1,
            });
          }
          return Promise.resolve(null);
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({ id: 'part-1', unreadCount: 0 }),
        aggregate: jest.fn().mockResolvedValue({ _sum: { unreadCount: 2 } }),
      },
      chatMessage: {
        create: jest.fn().mockResolvedValue(mockMessage),
        findMany: jest.fn().mockResolvedValue([mockMessage]),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(null),
    };

    auditService = {
      recordLog: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startOrGetConversation', () => {
    it('should create new conversation between sender and recipient', async () => {
      const result = await service.startOrGetConversation('usr-1', {
        recipientUserId: 'usr-2',
        title: 'Consultation Chat',
      });

      expect(result).toBeDefined();
      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it('should throw error if user tries to chat with themselves', async () => {
      await expect(
        service.startOrGetConversation('usr-1', { recipientUserId: 'usr-1' }),
      ).rejects.toThrow('Cannot start a chat conversation with yourself');
    });
  });

  describe('sendMessage', () => {
    it('should save message, update conversation snippet, increment unread for others', async () => {
      const msg = await service.sendMessage('usr-1', 'conv-1', {
        message: 'Hello James, how are you feeling today?',
        type: MessageType.TEXT,
      });

      expect(msg).toBeDefined();
      expect(prisma.chatMessage.create).toHaveBeenCalled();
      expect(prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: expect.objectContaining({
            lastMessage: 'Hello James, how are you feeling today?',
          }),
        }),
      );
      expect(prisma.chatParticipant.updateMany).toHaveBeenCalled();
    });
  });

  describe('listUserConversations', () => {
    it('should return list of conversations with recipient info and unread count', async () => {
      const result = await service.listUserConversations('usr-1', {
        page: 1,
        limit: 10,
      });
      expect(result).toBeDefined();
      expect(result.items.length).toBe(1);
      expect(result.items[0].recipient).toBeDefined();
    });
  });

  describe('getConversationMessages', () => {
    it('should return message history and reset user unread count', async () => {
      const result = await service.getConversationMessages('usr-1', 'conv-1', {
        page: 1,
        limit: 50,
      });
      expect(result).toBeDefined();
      expect(result.messages.length).toBe(1);
      expect(prisma.chatParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ unreadCount: 0 }),
        }),
      );
    });
  });

  describe('markAsRead & getUnreadCount', () => {
    it('should mark conversation as read and return overall unread badge count', async () => {
      const mark = await service.markAsRead('usr-1', 'conv-1');
      expect(mark.success).toBe(true);

      const unread = await service.getUnreadCount('usr-1');
      expect(unread.unreadCount).toBe(2);
    });
  });
});
