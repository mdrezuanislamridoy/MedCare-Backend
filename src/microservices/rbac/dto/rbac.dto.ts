import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, IsArray, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { AccessRequestStatus } from '../../../../generated/prisma/client';

export class AccessRequestFilterDto {
  @ApiPropertyOptional({ enum: AccessRequestStatus, example: AccessRequestStatus.PENDING, description: 'Filter by access request status' })
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
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], example: 'APPROVED', description: 'Decision on access request' })
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Granted temporary admin access for quarterly compliance review.', description: 'Reviewer decision notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'Clinical Auditor', description: 'Name of the role' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Can review medical chart history and patient audit logs', description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['perm-ehr-read', 'perm-audit-read'], description: 'List of permission IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [String], example: ['perm-ehr-read', 'perm-audit-read', 'perm-reports-export'], description: 'Assigned permission IDs' })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}
