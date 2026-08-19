import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AccountStatus,
  VerificationStatus,
  AppointmentStatus,
  AppointmentType,
  PayoutStatus,
} from '@medcare/contracts';

export class DoctorFilterDto {
  @ApiPropertyOptional({
    example: 'Cardiology',
    description: 'Search doctor name, specialty, license number, or email',
  })
  q?: string;

  @ApiPropertyOptional({
    example: 'Cardiology',
    description: 'Filter by specialty (e.g., Cardiology, Dermatology)',
  })
  specialty?: string;

  @ApiPropertyOptional({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
    description: 'Filter by account status',
  })
  accountStatus?: AccountStatus;

  @ApiPropertyOptional({
    enum: VerificationStatus,
    example: VerificationStatus.VERIFIED,
    description: 'Filter by verification status',
  })
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({
    example: 'clinic-1',
    description: 'Filter by clinic ID',
  })
  clinicId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}

export class VerificationDecisionDto {
  @ApiProperty({
    enum: ['APPROVED', 'REJECTED', 'DOCUMENTS_REQUESTED'],
    example: 'APPROVED',
    description: 'Admin verification decision',
  })
  decision!: 'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUESTED';

  @ApiPropertyOptional({
    example:
      'Medical license and credentials verified with state medical board.',
    description: 'Feedback or explanation notes for the doctor',
  })
  notes?: string;

  @ApiPropertyOptional({
    example: 'admin-usr-1',
    description: 'Admin user ID taking decision',
  })
  adminId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Updated Board Certification 2026'],
    description: 'List of additional documents requested',
  })
  requestedDocuments?: string[];
}

export class UpdateDoctorStatusDto {
  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  status!: AccountStatus;

  @ApiPropertyOptional({ example: 'Doctor completed identity verification.' })
  reason?: string;
}

export class PatientDoctorSearchDto {
  @ApiPropertyOptional({
    example: 'Sarah Mitchell',
    description: 'Search doctor name or specialty',
  })
  q?: string;

  @ApiPropertyOptional({
    example: 'Cardiology',
    description: 'Filter by medical specialty',
  })
  specialty?: string;

  @ApiPropertyOptional({
    example: 'clinic-1',
    description: 'Filter by Clinic ID',
  })
  clinicId?: string;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Minimum average rating filter (e.g. 4.0, 4.5)',
  })
  minRating?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number;
}

// ==========================================
// DOCTOR PORTAL SPECIFIC REQUEST DTOS
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
  @ApiProperty({
    type: [DoctorScheduleDayDto],
    example: [
      {
        dayOfWeek: 'Monday',
        isEnabled: true,
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        slotDurationMin: 30,
      },
      {
        dayOfWeek: 'Tuesday',
        isEnabled: true,
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        slotDurationMin: 30,
      },
      {
        dayOfWeek: 'Wednesday',
        isEnabled: true,
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        slotDurationMin: 30,
      },
      {
        dayOfWeek: 'Thursday',
        isEnabled: true,
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        slotDurationMin: 30,
      },
      {
        dayOfWeek: 'Friday',
        isEnabled: true,
        startTime: '09:00',
        endTime: '16:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        slotDurationMin: 30,
      },
      {
        dayOfWeek: 'Saturday',
        isEnabled: false,
        startTime: '10:00',
        endTime: '14:00',
        slotDurationMin: 30,
      },
      {
        dayOfWeek: 'Sunday',
        isEnabled: false,
        startTime: '00:00',
        endTime: '00:00',
        slotDurationMin: 30,
      },
    ],
  })
  days!: DoctorScheduleDayDto[];

  @ApiPropertyOptional({ example: 150, description: 'Consultation fee in USD' })
  consultationFee?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Default consultation duration in minutes',
  })
  slotDurationMin?: number;
}

export class SaveConsultationNotesDto {
  @ApiPropertyOptional({
    example:
      'Chest discomfort on exertion, shortness of breath for past 2 weeks',
  })
  symptoms?: string;

  @ApiProperty({ example: 'Stage 1 Essential Hypertension & Stable Angina' })
  diagnosis!: string;

  @ApiPropertyOptional({
    example:
      'Patient reports symptom aggravation after physical exertion. ECG shows normal sinus rhythm.',
  })
  clinicalNotes?: string;

  @ApiPropertyOptional({
    example:
      'Prescribe ACE inhibitor (Lisinopril 10mg). Low sodium diet. Follow-up lipid panel & ECG in 4 weeks.',
  })
  treatmentPlan?: string;

  @ApiPropertyOptional({
    example: {
      bp: '135/85',
      pulse: 74,
      temp: '98.6°F',
      weight: '74kg',
      spO2: '99%',
    },
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

  @ApiProperty({ example: 'Take in the morning with a full glass of water' })
  instructions!: string;
}

export class CreateDoctorPrescriptionDto {
  @ApiProperty({
    example: 'apt-1001',
    description: 'Associated appointment ID',
  })
  appointmentId!: string;

  @ApiProperty({ example: 'pat-1001', description: 'Patient Profile ID' })
  patientId!: string;

  @ApiPropertyOptional({ example: 'Stage 1 Hypertension' })
  diagnosis?: string;

  @ApiPropertyOptional({
    example:
      'Maintain regular physical activity (30 mins walking). Restrict dietary sodium.',
  })
  advice?: string;

  @ApiPropertyOptional({ example: '2026-09-15' })
  followUpDate?: string;

  @ApiProperty({
    type: [PrescriptionMedicineDto],
    example: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '90 days',
        instructions: 'Take in the morning',
      },
      {
        name: 'Aspirin (Cardio)',
        dosage: '81mg',
        frequency: 'Once daily',
        duration: '90 days',
        instructions: 'Take after breakfast',
      },
    ],
  })
  medicines!: PrescriptionMedicineDto[];
}

export class DoctorAppointmentFilterDto {
  @ApiPropertyOptional({
    example: '2026-08-17',
    description: 'Filter by date (YYYY-MM-DD)',
  })
  date?: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
    description: 'Filter by status',
  })
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    enum: AppointmentType,
    example: AppointmentType.IN_PERSON,
    description: 'Filter by consultation type (IN_PERSON / VIDEO)',
  })
  type?: AppointmentType;

  @ApiPropertyOptional({ example: 'James', description: 'Search patient name' })
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}

export class DoctorPrescriptionFilterDto {
  @ApiPropertyOptional({
    example: 'James',
    description: 'Search patient name or diagnosis',
  })
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}

export class DoctorPatientFilterDto {
  @ApiPropertyOptional({
    example: 'James',
    description: 'Search patient name, phone, or email',
  })
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}

export class DoctorReviewFilterDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  limit?: number;
}

export class DoctorPayoutRequestDto {
  @ApiProperty({ example: 1500, description: 'Payout amount requested in USD' })
  amount!: number;

  @ApiPropertyOptional({ example: 'Chase Bank NA' })
  bankName?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Weekly earnings withdrawal' })
  notes?: string;
}

export class DoctorReplyReviewDto {
  @ApiProperty({
    example: 'Thank you for your valuable feedback! Wishing you good health.',
  })
  reply!: string;
}

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: 'Interventional Cardiology' })
  specialty?: string;

  @ApiPropertyOptional({ example: ['MBBS', 'MD (Cardiology)', 'FACC'] })
  qualifications?: string[];

  @ApiPropertyOptional({ example: 12 })
  experienceYears?: number;

  @ApiPropertyOptional({ example: 150 })
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Consultation Room 204' })
  roomNumber?: string;

  @ApiPropertyOptional({
    example:
      'Board-certified cardiologist specializing in preventive cardiovascular medicine and coronary care.',
  })
  bio?: string;

  @ApiPropertyOptional({ example: '+1 (555) 234-5678' })
  phone?: string;

  @ApiPropertyOptional({ example: 'MD-NY-98421' })
  licenseNumber?: string;
}
