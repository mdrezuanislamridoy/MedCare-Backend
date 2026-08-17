import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationAudience, NotificationPriority } from '../../../../generated/prisma/client';

export class BroadcastNotificationDto {
  @ApiProperty({ example: 'Clinic Holiday Schedule Notice', description: 'Notification title' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'The clinic will be operating on reduced emergency hours on upcoming Friday.', description: 'Message body' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({ enum: NotificationPriority, example: NotificationPriority.NORMAL, default: NotificationPriority.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationAudience, example: NotificationAudience.ALL, default: NotificationAudience.ALL })
  @IsOptional()
  @IsEnum(NotificationAudience)
  audience?: NotificationAudience;
}

export class NotificationFilterDto {
  @ApiPropertyOptional({ enum: NotificationPriority, example: NotificationPriority.NORMAL })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiPropertyOptional({ enum: NotificationAudience, example: NotificationAudience.ALL })
  @IsOptional()
  @IsEnum(NotificationAudience)
  audience?: NotificationAudience;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
