import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, AppointmentType, PaymentStatus, QueueStatus } from '../../../../generated/prisma/client';

export class AppointmentFilterDto {
  @ApiPropertyOptional({ description: 'Search query for patient name, doctor name, or appointment number' })
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by Doctor ID' })
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Filter by Patient ID' })
  patientId?: string;

  @ApiPropertyOptional({ description: 'Filter by Clinic ID' })
  clinicId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Filter by appointment status' })
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filter by payment status' })
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: AppointmentType, description: 'Filter by appointment type (IN_PERSON, VIDEO)' })
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  page?: number;

  @ApiPropertyOptional({ default: 20, description: 'Items per page' })
  limit?: number;
}

export class TransitionAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, description: 'New status for appointment' })
  status!: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Reason for status transition or cancellation' })
  cancellationReason?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-08-25', description: 'New date for appointment (YYYY-MM-DD)' })
  date!: string;

  @ApiProperty({ example: '11:00 AM', description: 'New time slot for appointment' })
  time!: string;

  @ApiPropertyOptional({ description: 'Reassign to another Doctor ID' })
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Reassign to another Clinic ID' })
  clinicId?: string;

  @ApiPropertyOptional({ description: 'Reason for rescheduling' })
  reason?: string;
}

export class BookAppointmentDto {
  @ApiProperty({ example: 'doc-cuid-123', description: 'Doctor profile ID' })
  doctorId!: string;

  @ApiPropertyOptional({ description: 'Clinic ID where consultation takes place' })
  clinicId?: string;

  @ApiProperty({ example: '2026-08-20', description: 'Appointment date (YYYY-MM-DD)' })
  date!: string;

  @ApiProperty({ example: '10:00 AM', description: 'Appointment time slot' })
  time!: string;

  @ApiPropertyOptional({ enum: AppointmentType, default: AppointmentType.IN_PERSON })
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Patient symptoms or consultation notes' })
  notes?: string;
}

export class PatientAppointmentFilterDto {
  @ApiPropertyOptional({ enum: ['upcoming', 'completed', 'cancelled', 'all'], default: 'upcoming' })
  tab?: 'upcoming' | 'completed' | 'cancelled' | 'all';

  @ApiPropertyOptional({ enum: AppointmentType })
  type?: AppointmentType;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

export class ReceptionistCheckInDto {
  @ApiProperty({ example: 'apt-cuid-123', description: 'Appointment ID to check in' })
  appointmentId!: string;

  @ApiPropertyOptional({ example: 'Room 204', description: 'Assigned consultation room number' })
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Front-desk notes' })
  notes?: string;
}

export class ReceptionistUpdateQueueDto {
  @ApiProperty({ enum: QueueStatus, example: QueueStatus.CALLED, description: 'Target queue status' })
  status!: QueueStatus;
}

export class ReceptionistWalkInBookingDto {
  @ApiPropertyOptional({ description: 'Existing patient profile ID (if registered)' })
  patientId?: string;

  @ApiPropertyOptional({ example: 'Kareem Abdul', description: 'Patient name (for new walk-in)' })
  patientName?: string;

  @ApiPropertyOptional({ example: '+1-555-0199', description: 'Patient contact phone' })
  phone?: string;

  @ApiProperty({ example: 'doc-cuid-123', description: 'Doctor ID' })
  doctorId!: string;

  @ApiPropertyOptional({ description: 'Clinic ID' })
  clinicId?: string;

  @ApiPropertyOptional({ example: '11:30 AM', description: 'Appointment time (defaults to current time)' })
  time?: string;

  @ApiPropertyOptional({ enum: AppointmentType, default: AppointmentType.IN_PERSON })
  type?: AppointmentType;

  @ApiPropertyOptional({ example: 'Room 101', description: 'Assigned consultation room' })
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Walk-in front-desk notes' })
  notes?: string;
}
