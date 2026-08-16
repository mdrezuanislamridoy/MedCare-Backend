import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationAudience, NotificationPriority } from '../../../../generated/prisma/client';

export class BroadcastNotificationDto {
  @ApiProperty({ example: 'Clinic Holiday Schedule Notice', description: 'Notification title' })
  title!: string;

  @ApiProperty({ example: 'The clinic will be operating on reduced emergency hours on upcoming Friday.', description: 'Message body' })
  message!: string;

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.NORMAL })
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationAudience, default: NotificationAudience.ALL })
  audience?: NotificationAudience;
}

export class NotificationFilterDto {
  @ApiPropertyOptional({ enum: NotificationPriority })
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationAudience })
  audience?: NotificationAudience;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
