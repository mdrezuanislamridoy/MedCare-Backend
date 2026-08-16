import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, RecordCategory } from '../../../../generated/prisma/client';

export class PatientFilterDto {
  @ApiPropertyOptional({ description: 'Search by patient name, email, phone, address' })
  q?: string;

  @ApiPropertyOptional({ enum: AccountStatus, description: 'Filter by account status' })
  status?: AccountStatus;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class UpdatePatientStatusDto {
  @ApiProperty({ enum: AccountStatus })
  status!: AccountStatus;

  @ApiPropertyOptional()
  reason?: string;
}

export class UpdatePatientProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Patient full name' })
  name?: string;

  @ApiPropertyOptional({ example: '+1-555-0123', description: 'Patient phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: '1995-05-15', description: 'Date of birth (YYYY-MM-DD)' })
  dateOfBirth?: string | Date;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender' })
  gender?: string;

  @ApiPropertyOptional({ example: '123 Health Ave, Suite 400', description: 'Residential address' })
  address?: string;

  @ApiPropertyOptional({ example: 'Jane Doe', description: 'Emergency contact full name' })
  emergencyName?: string;

  @ApiPropertyOptional({ example: 'Spouse', description: 'Relationship with emergency contact' })
  emergencyRelationship?: string;

  @ApiPropertyOptional({ example: '+1-555-0987', description: 'Emergency contact phone' })
  emergencyPhone?: string;

  @ApiPropertyOptional({ example: '+1-555-0987', description: 'Legacy emergency contact field' })
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'O+', description: 'Blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)' })
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 178.5, description: 'Height in centimeters' })
  height?: number;

  @ApiPropertyOptional({ example: 74.2, description: 'Weight in kilograms' })
  weight?: number;

  @ApiPropertyOptional({ example: 'Penicillin, Peanuts', description: 'Known allergies' })
  allergies?: string;

  @ApiPropertyOptional({ example: 'Hypertension', description: 'Pre-existing chronic conditions' })
  chronicConditions?: string;
}

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'Blood Test Report (CBC & Lipid Profile)', description: 'Document title' })
  title!: string;

  @ApiProperty({ enum: RecordCategory, example: RecordCategory.LAB_REPORT, description: 'Record category' })
  category!: RecordCategory;

  @ApiProperty({ example: '/uploads/medical-records/report-123.pdf', description: 'Uploaded file URL or path' })
  fileUrl!: string;

  @ApiPropertyOptional({ example: 'application/pdf', description: 'File MIME type' })
  fileType?: string;

  @ApiPropertyOptional({ example: 2048576, description: 'File size in bytes' })
  fileSize?: number;

  @ApiPropertyOptional({ example: '2026-08-10', description: 'Date of medical test or record' })
  recordDate?: string | Date;

  @ApiPropertyOptional({ example: 'Cholesterol levels slightly elevated', description: 'Doctor or patient notes' })
  notes?: string;
}
