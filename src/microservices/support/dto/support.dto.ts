import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  ComplaintCategory,
  ComplaintStatus,
} from '../../../../generated/prisma/client';

// ==========================================
// 1. SUPPORT TICKETS DTOs
// ==========================================
export class TicketFilterDto {
  @ApiPropertyOptional({ example: 'Billing', description: 'Search term for subject, patient, or ticket number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TicketStatus, example: TicketStatus.OPEN })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.HIGH })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketCategory, example: TicketCategory.PAYMENT })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ example: 'staff-1001', description: 'Filter by assigned staff user ID' })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateTicketDto {
  @ApiProperty({ example: 'pat-1001', description: 'Patient Profile ID' })
  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @ApiProperty({ example: 'Billing discrepancy on invoice #INV-2091', description: 'Ticket subject' })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiProperty({ example: 'Patient was charged twice for cardiology consultation on 15 Aug.', description: 'Detailed issue description' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: TicketCategory, example: TicketCategory.PAYMENT, default: TicketCategory.GENERAL })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.MEDIUM, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: 'staff-1001', description: 'Assigned staff user ID' })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;
}

export class ReplyTicketDto {
  @ApiProperty({ example: 'We have processed the refund to your original card. It will appear within 2-3 business days.', description: 'Reply content' })
  @IsNotEmpty()
  @IsString()
  message!: string;

  @ApiPropertyOptional({ example: false, default: false, description: 'True if internal note visible only to staff' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isInternalNote?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['/uploads/receipts/refund-ack-9021.pdf'], description: 'Attachment file URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class AssignTicketDto {
  @ApiProperty({ example: 'staff-1001', description: 'Assigned staff user ID' })
  @IsNotEmpty()
  @IsString()
  staffId!: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: TicketStatus.RESOLVED })
  @IsNotEmpty()
  @IsEnum(TicketStatus)
  status!: TicketStatus;

  @ApiPropertyOptional({ example: 'Issue resolved: refunded duplicate payment via Stripe.', description: 'Resolution summary or closing notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ==========================================
// 2. COMPLAINTS DTOs
// ==========================================
export class ComplaintFilterDto {
  @ApiPropertyOptional({ example: 'delay', description: 'Search by complaint number, patient, or doctor' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ComplaintStatus, example: ComplaintStatus.NEW })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.HIGH })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: ComplaintCategory, example: ComplaintCategory.WAIT_TIME })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateComplaintDto {
  @ApiProperty({ example: 'pat-1001', description: 'Patient Profile ID' })
  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @ApiPropertyOptional({ example: 'doc-1001', description: 'Related Doctor Profile ID' })
  @IsOptional()
  @IsString()
  relatedDoctorId?: string;

  @ApiProperty({ example: 'Doctor arrived 45 mins late without prior notice', description: 'Complaint title' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Patient waited in Room 101 for over 45 minutes past the scheduled appointment time.', description: 'Incident description' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: ComplaintCategory, example: ComplaintCategory.WAIT_TIME, default: ComplaintCategory.OTHER })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.HIGH, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.UNDER_INVESTIGATION })
  @IsNotEmpty()
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Investigating delay with clinic manager and doctor.', description: 'Staff response or resolution notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class EscalateComplaintDto {
  @ApiProperty({ example: 'Patient dissatisfied with initial response and requesting clinic director review.', description: 'Reason for escalating to Admin/Management' })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}

// ==========================================
// 3. PATIENT SUPPORT DTOs (Privacy-Preserved)
// ==========================================
export class SupportPatientSearchDto {
  @ApiPropertyOptional({ example: 'James', description: 'Search by patient name, email, phone, or Patient ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ResendNotificationDto {
  @ApiProperty({ enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'APPOINTMENT_REMINDER'], example: 'EMAIL_VERIFICATION' })
  @IsNotEmpty()
  @IsEnum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'APPOINTMENT_REMINDER'])
  type!: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'APPOINTMENT_REMINDER';
}

// ==========================================
// 4. APPOINTMENT ASSISTANCE DTOs
// ==========================================
export class AssistRescheduleAppointmentDto {
  @ApiProperty({ example: '2026-08-22', description: 'New consultation date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  date!: string;

  @ApiProperty({ example: '11:00 AM', description: 'New time slot' })
  @IsNotEmpty()
  @IsString()
  time!: string;

  @ApiPropertyOptional({ example: 'doc-1001', description: 'New Doctor Profile ID if reassigning' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'Patient has family emergency on original appointment date.', description: 'Reason for rescheduling assistance' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ==========================================
// 5. ACTIVITY LOGS DTOs
// ==========================================
export class SupportActivityFilterDto {
  @ApiPropertyOptional({ example: 'staff-1001', description: 'Filter by staff user ID' })
  @IsOptional()
  @IsString()
  staffId?: string;

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
