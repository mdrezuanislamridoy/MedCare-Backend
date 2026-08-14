import { AccessRequestStatus } from '../../../../generated/prisma/client';

export class AccessRequestFilterDto {
  status?: AccessRequestStatus;
  page?: number;
  limit?: number;
}

export class DecideAccessRequestDto {
  decision!: 'APPROVED' | 'REJECTED';
  notes?: string;
}

export class CreateRoleDto {
  name!: string;
  description?: string;
  permissionIds?: string[];
}

export class UpdateRolePermissionsDto {
  permissionIds!: string[];
}
