import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TicketFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: number;
}

export class CreateTicketDto {
  @ApiProperty({ example: 'Cannot access video consultation' })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiProperty({ example: 'When clicking start call, camera shows black screen' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({ example: 'HIGH' })
  @IsOptional()
  @IsString()
  priority?: string;
}

export class ReplyTicketDto {
  @ApiProperty({ example: 'We have resolved the permissions issue' })
  @IsNotEmpty()
  @IsString()
  message!: string;
}

export class AssignTicketDto {
  @ApiPropertyOptional({ example: 'user-support-101' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ example: 'user-support-101' })
  @IsOptional()
  @IsString()
  staffId?: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ example: 'RESOLVED' })
  @IsNotEmpty()
  @IsString()
  status!: string;
}

export class ComplaintFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateComplaintDto {
  @ApiProperty({ example: 'Doctor delayed appointment by 45 minutes' })
  @IsNotEmpty()
  @IsString()
  complaint!: string;

  @ApiPropertyOptional({ example: 'apt-101' })
  @IsOptional()
  @IsString()
  appointmentId?: string;
}

export class UpdateComplaintStatusDto {
  @ApiProperty({ example: 'RESOLVED' })
  @IsNotEmpty()
  @IsString()
  status!: string;
}

export class EscalateComplaintDto {
  @ApiPropertyOptional({ example: 'Escalated to Hospital Director' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SupportPatientSearchDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  q?: string;
}

export class ResendNotificationDto {
  @ApiPropertyOptional({ example: 'notif-101' })
  @IsOptional()
  @IsString()
  notificationId?: string;

  @ApiPropertyOptional({ example: 'EMAIL' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class AssistRescheduleAppointmentDto {
  @ApiProperty({ example: '2026-09-01' })
  @IsNotEmpty()
  @IsString()
  date!: string;

  @ApiProperty({ example: '11:00 AM' })
  @IsNotEmpty()
  @IsString()
  time!: string;
}

export class SupportActivityFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: number;
}
