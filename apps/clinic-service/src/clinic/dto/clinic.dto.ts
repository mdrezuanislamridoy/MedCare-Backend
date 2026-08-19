import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '../../../../generated/prisma/client';

export class ClinicFilterDto {
  @ApiPropertyOptional({
    example: 'Central',
    description: 'Search clinic name, city, or phone',
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

export class CreateClinicDto {
  @ApiProperty({
    example: 'MedCare Central Hospital',
    description: 'Clinic branch name',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'Manhattan Medical District',
    description: 'Location / district',
  })
  @IsNotEmpty()
  @IsString()
  location!: string;

  @ApiPropertyOptional({ example: '450 Lexington Ave, Suite 1200' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '10017' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '+1 (212) 555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'central@medcare.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'usr-mgr-101',
    description: 'Manager user ID',
  })
  @IsOptional()
  @IsString()
  managerId?: string;
}

export class UpdateClinicDto {
  @ApiPropertyOptional({ example: 'MedCare Downtown Heart Center' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Downtown District' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '120 Broadway' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '10005' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '+1 (212) 555-0188' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'downtown@medcare.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'usr-mgr-102' })
  @IsOptional()
  @IsString()
  managerId?: string;
}

export class UpdateClinicStatusDto {
  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  @IsNotEmpty()
  @IsEnum(AccountStatus)
  status!: AccountStatus;

  @ApiPropertyOptional({ example: 'Annual inspection and licensing renewed.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
