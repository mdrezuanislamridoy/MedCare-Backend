import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: 'Search term for subject, patient, or ticket number' })
  search?: string;

  @ApiPropertyOptional({ enum: TicketStatus })
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketCategory })
  category?: TicketCategory;

  @ApiPropertyOptional({ description: 'Filter by assigned staff user ID' })
  assignedStaffId?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

export class CreateTicketDto {
  @ApiProperty({ example: 'pat-cuid-123', description: 'Patient Profile ID' })
  patientId!: string;

  @ApiProperty({ example: 'Billing discrepancy on invoice #INV-2091', description: 'Ticket subject' })
  subject!: string;

  @ApiProperty({ example: 'Patient was charged twice for cardiology consultation.', description: 'Detailed issue description' })
  description!: string;

  @ApiPropertyOptional({ enum: TicketCategory, default: TicketCategory.GENERAL })
  category?: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Assigned staff user ID' })
  assignedStaffId?: string;
}

export class ReplyTicketDto {
  @ApiProperty({ example: 'We have processed the refund to your original card.', description: 'Reply content' })
  message!: string;

  @ApiPropertyOptional({ default: false, description: 'True if internal note visible only to staff' })
  isInternalNote?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Attachment file URLs' })
  attachments?: string[];
}

export class AssignTicketDto {
  @ApiProperty({ example: 'staff-cuid-456', description: 'Assigned staff user ID' })
  staffId!: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: TicketStatus.RESOLVED })
  status!: TicketStatus;

  @ApiPropertyOptional({ description: 'Resolution summary or closing notes' })
  notes?: string;
}

// ==========================================
// 2. COMPLAINTS DTOs
// ==========================================
export class ComplaintFilterDto {
  @ApiPropertyOptional({ description: 'Search by complaint number, patient, or doctor' })
  search?: string;

  @ApiPropertyOptional({ enum: ComplaintStatus })
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: ComplaintCategory })
  category?: ComplaintCategory;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

export class CreateComplaintDto {
  @ApiProperty({ example: 'pat-cuid-123', description: 'Patient Profile ID' })
  patientId!: string;

  @ApiPropertyOptional({ example: 'doc-cuid-456', description: 'Related Doctor Profile ID' })
  relatedDoctorId?: string;

  @ApiProperty({ example: 'Doctor arrived 45 mins late without notice', description: 'Complaint title' })
  title!: string;

  @ApiProperty({ example: 'Patient waited in Room 101 for over 45 minutes.', description: 'Incident description' })
  description!: string;

  @ApiPropertyOptional({ enum: ComplaintCategory, default: ComplaintCategory.OTHER })
  category?: ComplaintCategory;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority?: TicketPriority;
}

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.UNDER_INVESTIGATION })
  status!: ComplaintStatus;

  @ApiPropertyOptional({ description: 'Staff response or resolution notes' })
  notes?: string;
}

export class EscalateComplaintDto {
  @ApiProperty({ example: 'Patient threatening legal action regarding billing overcharge.', description: 'Reason for escalating to Admin/Management' })
  reason!: string;
}

// ==========================================
// 3. PATIENT SUPPORT DTOs (Privacy-Preserved)
// ==========================================
export class SupportPatientSearchDto {
  @ApiPropertyOptional({ description: 'Search by patient name, email, phone, or Patient ID' })
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

export class ResendNotificationDto {
  @ApiProperty({ enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'APPOINTMENT_REMINDER'], example: 'EMAIL_VERIFICATION' })
  type!: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'APPOINTMENT_REMINDER';
}

// ==========================================
// 4. APPOINTMENT ASSISTANCE DTOs
// ==========================================
export class AssistRescheduleAppointmentDto {
  @ApiProperty({ example: '2026-08-22', description: 'New consultation date (YYYY-MM-DD)' })
  date!: string;

  @ApiProperty({ example: '11:00 AM', description: 'New time slot' })
  time!: string;

  @ApiPropertyOptional({ description: 'New Doctor Profile ID if reassigning' })
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Reason for rescheduling assistance' })
  reason?: string;
}

// ==========================================
// 5. ACTIVITY LOGS DTOs
// ==========================================
export class SupportActivityFilterDto {
  @ApiPropertyOptional({ description: 'Filter by staff user ID' })
  staffId?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
