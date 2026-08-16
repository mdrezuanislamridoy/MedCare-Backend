import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, VerificationStatus } from '../../../../generated/prisma/client';

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
