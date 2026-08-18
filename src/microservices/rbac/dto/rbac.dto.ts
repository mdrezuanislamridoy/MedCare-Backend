import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsArray,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccessRequestStatus,
  UserRole,
  AccountStatus,
} from '../../../../generated/prisma/client';

export class AccessRequestFilterDto {
  @ApiPropertyOptional({
    enum: AccessRequestStatus,
    example: AccessRequestStatus.PENDING,
    description: 'Filter by access request status',
  })
  @IsOptional()
  @IsEnum(AccessRequestStatus)
  status?: AccessRequestStatus;

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

export class DecideAccessRequestDto {
  @ApiProperty({
    enum: ['APPROVED', 'REJECTED'],
    example: 'APPROVED',
    description: 'Decision on access request',
  })
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    example: 'Granted temporary admin access for quarterly compliance review.',
    description: 'Reviewer decision notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'Clinical Auditor', description: 'Name of the role' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'Can review medical chart history and patient audit logs',
    description: 'Role description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['perm-ehr-read', 'perm-audit-read'],
    description: 'List of permission IDs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UpdateRolePermissionsDto {
  @ApiProperty({
    type: [String],
    example: ['perm-ehr-read', 'perm-audit-read', 'perm-reports-export'],
    description: 'Assigned permission IDs',
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}

export class AdministratorFilterDto {
  @ApiPropertyOptional({
    example: 'admin@medcare.com',
    description: 'Search by name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_MANAGER],
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: AccountStatus })
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

export class CreateAdministratorDto {
  @ApiProperty({
    example: 'Marcus Vance',
    description: 'Administrator full name',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'marcus.vance@medcare.com',
    description: 'Administrator email',
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: 'Admin1234!',
    description: 'Initial account password',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({
    enum: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CLINIC_MANAGER],
    default: UserRole.ADMIN,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    example: 'clinic-001',
    description: 'Assigned clinic branch ID (if clinic manager)',
  })
  @IsOptional()
  @IsString()
  clinicId?: string;
}

export class UpdateAdministratorStatusDto {
  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(AccountStatus)
  status!: AccountStatus;

  @ApiPropertyOptional({
    example: 'Suspended pending security review',
    description: 'Action reason',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
