import { AccountStatus } from '../../../../generated/prisma/client';

export class ClinicFilterDto {
  q?: string;
  status?: AccountStatus;
  page?: number;
  limit?: number;
}

export class CreateClinicDto {
  name!: string;
  location!: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerId?: string;
}

export class UpdateClinicDto {
  name?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerId?: string;
}

export class UpdateClinicStatusDto {
  status!: AccountStatus;
  reason?: string;
}
