import { AccountStatus } from '../../../../generated/prisma/client';

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
