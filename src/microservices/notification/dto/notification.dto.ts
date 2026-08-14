import { NotificationAudience, NotificationPriority } from '../../../../generated/prisma/client';

export class BroadcastNotificationDto {
  title!: string;
  message!: string;
  priority?: NotificationPriority;
  audience?: NotificationAudience;
}

export class NotificationFilterDto {
  priority?: NotificationPriority;
  audience?: NotificationAudience;
  page?: number;
  limit?: number;
}
