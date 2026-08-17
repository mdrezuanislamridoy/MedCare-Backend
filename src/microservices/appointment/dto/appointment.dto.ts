import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus, AppointmentType, PaymentStatus, QueueStatus } from '../../../../generated/prisma/client';

export class AppointmentFilterDto {
  @ApiPropertyOptional({ example: 'James', description: 'Search query for patient name, doctor name, or appointment number' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'doc-1001', description: 'Filter by Doctor ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'pat-1001', description: 'Filter by Patient ID' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'clinic-1', description: 'Filter by Clinic ID' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, example: AppointmentStatus.CONFIRMED, description: 'Filter by appointment status' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.PAID, description: 'Filter by payment status' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ enum: AppointmentType, example: AppointmentType.IN_PERSON, description: 'Filter by appointment type (IN_PERSON, VIDEO)' })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ example: '2026-08-01', description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31', description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class TransitionAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.COMPLETED, description: 'New status for appointment' })
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Patient requested cancellation due to travel delay', description: 'Reason for status transition or cancellation' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-08-25', description: 'New date for appointment (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  date!: string;

  @ApiProperty({ example: '11:00 AM', description: 'New time slot for appointment' })
  @IsNotEmpty()
  @IsString()
  time!: string;

  @ApiPropertyOptional({ example: 'doc-1001', description: 'Reassign to another Doctor ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'clinic-1', description: 'Reassign to another Clinic ID' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ example: 'Rescheduled upon patient request', description: 'Reason for rescheduling' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BookAppointmentDto {
  @ApiProperty({ example: 'doc-1001', description: 'Doctor profile ID' })
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @ApiPropertyOptional({ example: 'clinic-1', description: 'Clinic ID where consultation takes place' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiProperty({ example: '2026-08-20', description: 'Appointment date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsString()
  date!: string;

  @ApiProperty({ example: '10:00 AM', description: 'Appointment time slot' })
  @IsNotEmpty()
  @IsString()
  time!: string;

  @ApiPropertyOptional({ enum: AppointmentType, example: AppointmentType.IN_PERSON, default: AppointmentType.IN_PERSON })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ example: 'Experiencing regular migraine headaches and nausea', description: 'Patient symptoms or consultation notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PatientAppointmentFilterDto {
  @ApiPropertyOptional({ enum: ['upcoming', 'completed', 'cancelled', 'all'], example: 'upcoming', default: 'upcoming' })
  @IsOptional()
  @IsEnum(['upcoming', 'completed', 'cancelled', 'all'])
  tab?: 'upcoming' | 'completed' | 'cancelled' | 'all';

  @ApiPropertyOptional({ enum: AppointmentType, example: AppointmentType.IN_PERSON })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

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

export class ReceptionistCheckInDto {
  @ApiProperty({ example: 'apt-1001', description: 'Appointment ID to check in' })
  @IsNotEmpty()
  @IsString()
  appointmentId!: string;

  @ApiPropertyOptional({ example: 'Room 204', description: 'Assigned consultation room number' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'Patient arrived 10 minutes early with insurance card verified', description: 'Front-desk notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceptionistUpdateQueueDto {
  @ApiProperty({ enum: QueueStatus, example: QueueStatus.CALLED, description: 'Target queue status' })
  @IsNotEmpty()
  @IsEnum(QueueStatus)
  status!: QueueStatus;
}

export class ReceptionistWalkInBookingDto {
  @ApiPropertyOptional({ example: 'pat-1001', description: 'Existing patient profile ID (if registered)' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Kareem Abdul', description: 'Patient name (for new walk-in)' })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiPropertyOptional({ example: '+1-555-0199', description: 'Patient contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'doc-1001', description: 'Doctor ID' })
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @ApiPropertyOptional({ example: 'clinic-1', description: 'Clinic ID' })
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiPropertyOptional({ example: '11:30 AM', description: 'Appointment time (defaults to current time)' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ enum: AppointmentType, example: AppointmentType.IN_PERSON, default: AppointmentType.IN_PERSON })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ example: 'Room 101', description: 'Assigned consultation room' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'Walk-in emergency registration for acute back pain', description: 'Walk-in front-desk notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
