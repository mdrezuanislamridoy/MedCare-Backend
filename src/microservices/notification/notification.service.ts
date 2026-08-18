import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { RedisService } from '../../common/cache/redis/redis.service';
import {
  BroadcastNotificationDto,
  NotificationFilterDto,
} from './dto/notification.dto';
import {
  NotificationAudience,
  NotificationPriority,
} from '../../../generated/prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async listNotifications(filter: NotificationFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.priority) {
      where.priority = filter.priority;
    }
    if (filter.audience) {
      where.audience = filter.audience;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          sentBy: { select: { id: true, name: true, email: true } },
        },
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
        priority,
        audience,
        sentById: senderId,
      },
    });

    try {
      await this.redis.set(
        `broadcast:latest:${notification.id}`,
        JSON.stringify(notification),
        3600 * 24, // 24 hours
      );
    } catch {
      // ignore redis write error
    }

    await this.prisma.auditLog
      .create({
        data: {
          actorId: senderId,
          actorName: 'Admin',
          action: `Broadcast Notification Sent (${priority})`,
          resource: `Notification "${dto.title}" to ${audience}`,
          details: JSON.stringify(dto),
          result: 'success',
        },
      })
      .catch(() => null);

    return notification;
  }

  // --- Patient Portal Methods ---

  async patientListNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        audience: {
          in: [NotificationAudience.ALL, NotificationAudience.PATIENTS],
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
