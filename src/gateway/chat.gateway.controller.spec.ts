import { Test, TestingModule } from '@nestjs/testing';
import { ChatGatewayController } from './chat.gateway.controller';
import { ChatService } from '../microservices/chat/chat.service';
import { UserRole, ConversationStatus } from '../../generated/prisma/client';

describe('ChatGatewayController', () => {
  let controller: ChatGatewayController;
  let chatService: any;

  const mockUser = { id: 'usr-1', email: 'doctor@medcare.local', role: UserRole.DOCTOR };
  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    chatService = {
      startOrGetConversation: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      listUserConversations: jest.fn().mockResolvedValue({ items: [], meta: { total: 0 } }),
      getUnreadCount: jest.fn().mockResolvedValue({ unreadCount: 0 }),
      getConversationMessages: jest.fn().mockResolvedValue({ messages: [], meta: { total: 0 } }),
      sendMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      markAsRead: jest.fn().mockResolvedValue({ success: true }),
      updateConversationStatus: jest.fn().mockResolvedValue({ success: true }),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatGatewayController],
      providers: [{ provide: ChatService, useValue: chatService }],
    }).compile();

    controller = module.get<ChatGatewayController>(ChatGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should start conversation', async () => {
    const res = await controller.startConversation(mockReq, { recipientUserId: 'usr-2' });
    expect(res).toBeDefined();
    expect(chatService.startOrGetConversation).toHaveBeenCalledWith('usr-1', { recipientUserId: 'usr-2' });
  });

  it('should list conversations and unread count', async () => {
    const list = await controller.listConversations(mockReq, {});
    expect(list).toBeDefined();

    const count = await controller.getUnreadCount(mockReq);
    expect(count.unreadCount).toBe(0);
  });

  it('should send and read messages', async () => {
    const msg = await controller.sendMessage(mockReq, 'conv-1', { message: 'Hello patient' });
    expect(msg).toBeDefined();

    const read = await controller.markAsRead(mockReq, 'conv-1');
    expect(read.success).toBe(true);

    const status = await controller.updateStatus(mockReq, 'conv-1', { status: ConversationStatus.RESOLVED });
    expect(status.success).toBe(true);
  });
});
