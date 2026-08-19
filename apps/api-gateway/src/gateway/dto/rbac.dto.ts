import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@medcare/contracts';

export class AccessRequestFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: number;
}

export class DecideAccessRequestDto {
  @ApiProperty({ example: 'APPROVED' })
  @IsNotEmpty()
  @IsString()
  decision!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'CLINIC_ADMIN' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: ['appointments:read', 'appointments:write'] })
  @IsNotEmpty()
  permissions!: string[];
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ example: ['appointments:read', 'appointments:write'] })
  @IsNotEmpty()
  permissions!: string[];
}

export class AdministratorFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: number;
}

export class CreateAdministratorDto {
  @ApiProperty({ example: 'admin@medcare.com' })
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiProperty({ example: 'Admin User' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  @IsNotEmpty()
  role!: UserRole;
}

export class UpdateAdministratorStatusDto {
  @ApiProperty({ example: 'ACTIVE' })
  @IsNotEmpty()
  @IsString()
  status!: string;
}
