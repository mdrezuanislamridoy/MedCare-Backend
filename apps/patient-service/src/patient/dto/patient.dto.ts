import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccountStatus,
  RecordCategory,
} from '@medcare/contracts';

export class PatientFilterDto {
  @ApiPropertyOptional({
    example: 'James',
    description: 'Search by patient name, email, phone, address',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
    description: 'Filter by account status',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

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

export class UpdatePatientStatusDto {
  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(AccountStatus)
  status!: AccountStatus;

  @ApiPropertyOptional({
    example: 'Account unlocked by receptionist upon ID verification.',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdatePatientProfileDto {
  @ApiPropertyOptional({
    example: 'James Harrington',
    description: 'Patient full name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '+1-555-0123',
    description: 'Patient phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '1995-05-15',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string | Date;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({
    example: '123 Health Ave, Suite 400',
    description: 'Residential address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Jane Harrington',
    description: 'Emergency contact full name',
  })
  @IsOptional()
  @IsString()
  emergencyName?: string;

  @ApiPropertyOptional({
    example: 'Spouse',
    description: 'Relationship with emergency contact',
  })
  @IsOptional()
  @IsString()
  emergencyRelationship?: string;

  @ApiPropertyOptional({
    example: '+1-555-0987',
    description: 'Emergency contact phone',
  })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({
    example: '+1-555-0987',
    description: 'Legacy emergency contact field',
  })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({
    example: 'A+',
    description: 'Blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)',
  })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 178.5, description: 'Height in centimeters' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  height?: number;

  @ApiPropertyOptional({ example: 74.2, description: 'Weight in kilograms' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({
    example: 'Penicillin, Peanuts',
    description: 'Known allergies',
  })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({
    example: 'Hypertension',
    description: 'Pre-existing chronic conditions',
  })
  @IsOptional()
  @IsString()
  chronicConditions?: string;
}

export class CreateMedicalRecordDto {
  @ApiProperty({
    example: 'Blood Test Report (CBC & Lipid Profile)',
    description: 'Document title',
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({
    enum: RecordCategory,
    example: RecordCategory.LAB_REPORT,
    description: 'Record category',
  })
  @IsNotEmpty()
  @IsEnum(RecordCategory)
  category!: RecordCategory;

  @ApiProperty({
    example: '/uploads/medical-records/report-123.pdf',
    description: 'Uploaded file URL or path',
  })
  @IsNotEmpty()
  @IsString()
  fileUrl!: string;

  @ApiPropertyOptional({
    example: 'application/pdf',
    description: 'File MIME type',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ example: 2048576, description: 'File size in bytes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fileSize?: number;

  @ApiPropertyOptional({
    example: '2026-08-10',
    description: 'Date of medical test or record',
  })
  @IsOptional()
  @IsString()
  recordDate?: string | Date;

  @ApiPropertyOptional({
    example: 'Cholesterol levels slightly elevated',
    description: 'Doctor or patient notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
