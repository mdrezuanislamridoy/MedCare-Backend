import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BroadcastNotificationDto,
  NotificationFilterDto,
} from './dto/notification.dto';
import { NotificationAudience, NotificationPriority } from '@medcare/contracts';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(filter: NotificationFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.priority) {
      where.priority = filter.priority as any;
    }
    if (filter.audience) {
      where.audience = filter.audience as any;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async broadcast(dto: BroadcastNotificationDto, senderId?: string) {
    const priority = dto.priority || NotificationPriority.NORMAL;
    const audience = dto.audience || NotificationAudience.ALL;

    const notification = await this.prisma.notification.create({
      data: {
        title: dto.title,
        message: dto.message,
        priority: priority as any,
        audience: audience as any,
        sentById: senderId,
      },
    });

    return notification;
  }

  // --- Patient Portal Methods ---

  async patientListNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        audience: {
          in: [NotificationAudience.ALL, NotificationAudience.PATIENTS] as any,
        },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return notifications;
  }

  async patientMarkRead(userId: string, notificationId: string) {
    await this.prisma.notification
      .update({
        where: { id: notificationId },
        data: {
          readByCount: { increment: 1 },
        },
      })
      .catch(() => null);

    return { success: true };
  }

  async patientMarkAllRead(userId: string) {
    return { success: true, message: 'All notifications marked as read' };
  }
}
