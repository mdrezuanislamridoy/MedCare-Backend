import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, VerificationStatus, AppointmentStatus, AppointmentType } from '../../../../generated/prisma/client';

export class DoctorFilterDto {
  @ApiPropertyOptional({ description: 'Search doctor name, specialty, license number, or email' })
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by specialty (e.g., Cardiology, Dermatology)' })
  specialty?: string;

  @ApiPropertyOptional({ enum: AccountStatus, description: 'Filter by account status' })
  accountStatus?: AccountStatus;

  @ApiPropertyOptional({ enum: VerificationStatus, description: 'Filter by verification status' })
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Filter by clinic ID' })
  clinicId?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class VerificationDecisionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'DOCUMENTS_REQUESTED'], description: 'Admin verification decision' })
  decision!: 'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUESTED';

  @ApiPropertyOptional({ description: 'Feedback or explanation notes for the doctor' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Admin user ID taking decision' })
  adminId?: string;

  @ApiPropertyOptional({ type: [String], description: 'List of additional documents requested' })
  requestedDocuments?: string[];
}

export class UpdateDoctorStatusDto {
  @ApiProperty({ enum: AccountStatus })
  status!: AccountStatus;

  @ApiPropertyOptional()
  reason?: string;
}

export class PatientDoctorSearchDto {
  @ApiPropertyOptional({ description: 'Search doctor name or specialty' })
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by medical specialty' })
  specialty?: string;

  @ApiPropertyOptional({ description: 'Filter by Clinic ID' })
  clinicId?: string;

  @ApiPropertyOptional({ example: 4.5, description: 'Minimum average rating filter (e.g. 4.0, 4.5)' })
  minRating?: number;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  limit?: number;
}

// ==========================================
// DOCTOR PORTAL SPECIFIC DTOS
// ==========================================

export class DoctorScheduleDayDto {
  @ApiProperty({ example: 'Monday' })
  dayOfWeek!: string;

  @ApiProperty({ example: true })
  isEnabled!: boolean;

  @ApiProperty({ example: '09:00' })
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  endTime!: string;

  @ApiPropertyOptional({ example: '13:00' })
  breakStartTime?: string;

  @ApiPropertyOptional({ example: '14:00' })
  breakEndTime?: string;

  @ApiPropertyOptional({ example: 30, default: 30 })
  slotDurationMin?: number;
}

export class DoctorScheduleDto {
  @ApiProperty({ type: [DoctorScheduleDayDto] })
  days!: DoctorScheduleDayDto[];

  @ApiPropertyOptional({ example: 150, description: 'Consultation fee in USD' })
  consultationFee?: number;

  @ApiPropertyOptional({ example: 30, description: 'Default consultation duration in minutes' })
  slotDurationMin?: number;
}

export class SaveConsultationNotesDto {
  @ApiPropertyOptional({ example: 'Chest pain on exertion, shortness of breath' })
  symptoms?: string;

  @ApiProperty({ example: 'Stage 1 Hypertension & Angina Pectoris' })
  diagnosis!: string;

  @ApiPropertyOptional({ example: 'Patient reports symptom aggravation after physical exertion' })
  clinicalNotes?: string;

  @ApiPropertyOptional({ example: 'Prescribed ACE inhibitors and scheduled follow-up ECG in 2 weeks' })
  treatmentPlan?: string;

  @ApiPropertyOptional({
    example: { bp: '130/85', pulse: 76, temp: '98.6°F', weight: '72kg' },
    description: 'Patient vital signs record',
  })
  vitals?: Record<string, any>;
}

export class PrescriptionMedicineDto {
  @ApiProperty({ example: 'Lisinopril' })
  name!: string;

  @ApiProperty({ example: '10mg' })
  dosage!: string;

  @ApiProperty({ example: 'Once daily' })
  frequency!: string;

  @ApiProperty({ example: '90 days' })
  duration!: string;

  @ApiProperty({ example: 'Take in the morning with water' })
  instructions!: string;
}

export class CreateDoctorPrescriptionDto {
  @ApiProperty({ example: 'apt-1001', description: 'Associated appointment ID' })
  appointmentId!: string;

  @ApiProperty({ example: 'pat-1001', description: 'Patient Profile ID' })
  patientId!: string;

  @ApiPropertyOptional({ example: 'Hypertension' })
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Monitor BP weekly. Low sodium diet.' })
  advice?: string;

  @ApiPropertyOptional({ example: '2026-09-15' })
  followUpDate?: string;

  @ApiProperty({ type: [PrescriptionMedicineDto] })
  medicines!: PrescriptionMedicineDto[];
}

export class DoctorAppointmentFilterDto {
  @ApiPropertyOptional({ description: 'Filter by date (YYYY-MM-DD)' })
  date?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Filter by status' })
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: AppointmentType, description: 'Filter by consultation type (IN_PERSON / VIDEO)' })
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Search patient name' })
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class DoctorPayoutRequestDto {
  @ApiProperty({ example: 1500, description: 'Payout amount requested' })
  amount!: number;

  @ApiPropertyOptional({ example: 'Chase Bank' })
  bankName?: string;

  @ApiPropertyOptional({ example: '****-****-****-4019' })
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Weekly withdrawal request' })
  notes?: string;
}

export class DoctorReplyReviewDto {
  @ApiProperty({ example: 'Thank you for your feedback! Wishing you a speedy recovery.' })
  reply!: string;
}

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: 'Cardiologist' })
  specialty?: string;

  @ApiPropertyOptional({ example: 'MD, FACC' })
  qualifications?: string[];

  @ApiPropertyOptional({ example: 12 })
  experienceYears?: number;

  @ApiPropertyOptional({ example: 150 })
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Room 204' })
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'Board certified cardiologist...' })
  bio?: string;

  @ApiPropertyOptional({ example: '+1 (555) 234-5678' })
  phone?: string;

  @ApiPropertyOptional({ example: 'MCI-12345' })
  licenseNumber?: string;
}
