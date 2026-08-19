import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  ConversationType,
  ConversationStatus,
  MessageType,
} from '@medcare/contracts';

export class StartConversationDto {
  @ApiProperty({
    example: 'usr-recipient-101',
    description:
      'Target user ID to chat with (Doctor, Patient, or Support Staff)',
  })
  @IsNotEmpty()
  @IsString()
  recipientUserId!: string;

  @ApiPropertyOptional({
    enum: ConversationType,
    example: ConversationType.DIRECT,
    default: ConversationType.DIRECT,
  })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  @ApiPropertyOptional({
    example: 'apt-1001',
    description: 'Associated appointment ID for teleconsultation chat',
  })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({
    example: 'Consultation with Dr. Sarah',
    description: 'Conversation title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example:
      'Hello Dr. Sarah, I have a question regarding my prescription dosage.',
    description: 'Initial message text',
  })
  @IsOptional()
  @IsString()
  initialMessage?: string;
}

export class SendChatMessageDto {
  @ApiProperty({
    example:
      'Hello! Please take 1 tablet after breakfast every morning with plenty of water.',
    description: 'Message body',
  })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    enum: MessageType,
    example: MessageType.TEXT,
    default: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'True if internal note visible only to medical/support staff',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isInternalNote?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['/uploads/medical-records/ecg-test-aug2026.pdf'],
    description: 'Attached document or image file URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class ConversationFilterDto {
  @ApiPropertyOptional({
    example: 'Dr. Sarah',
    description: 'Search conversation title, participant name, or last message',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ConversationType,
    example: ConversationType.DIRECT,
  })
  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  @ApiPropertyOptional({
    enum: ConversationStatus,
    example: ConversationStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

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

export class ChatMessageFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class UpdateConversationStatusDto {
  @ApiProperty({
    enum: ConversationStatus,
    example: ConversationStatus.RESOLVED,
  })
  @IsNotEmpty()
  @IsEnum(ConversationStatus)
  status!: ConversationStatus;
}
