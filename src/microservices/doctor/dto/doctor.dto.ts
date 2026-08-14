import { AccountStatus, VerificationStatus } from '../../../../generated/prisma/client';

export class DoctorFilterDto {
  q?: string;
  specialty?: string;
  accountStatus?: AccountStatus;
  verificationStatus?: VerificationStatus;
  clinicId?: string;
  page?: number;
  limit?: number;
}

export class VerificationDecisionDto {
  decision!: 'APPROVED' | 'REJECTED' | 'DOCUMENTS_REQUESTED';
  notes?: string;
  adminId?: string;
  requestedDocuments?: string[];
}

export class UpdateDoctorStatusDto {
  status!: AccountStatus;
  reason?: string;
}
