import { AccountStatus, RecordCategory } from '../../../../generated/prisma/client';

export class PatientFilterDto {
  q?: string;
  status?: AccountStatus;
  page?: number;
  limit?: number;
}

export class UpdatePatientStatusDto {
  status!: AccountStatus;
  reason?: string;
}

export class UpdatePatientProfileDto {
  name?: string;
  phone?: string;
  dateOfBirth?: string | Date;
  gender?: string;
  address?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies?: string;
  chronicConditions?: string;
}

export class CreateMedicalRecordDto {
  title!: string;
  category!: RecordCategory;
  fileUrl!: string;
  fileType?: string;
  fileSize?: number;
  recordDate?: string | Date;
  notes?: string;
}
