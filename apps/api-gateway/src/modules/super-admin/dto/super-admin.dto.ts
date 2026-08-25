import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AccessRequestDecisionDto {
  @ApiProperty({
    enum: ['APPROVED', 'REJECTED'],
    example: 'APPROVED',
    description: 'Decision on privileged access elevation',
  })
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({
    example: 'Granted temporary emergency admin role for audit inspection.',
    description: 'Reasoning or justification for decision',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({ example: 'MedCare Enterprise Platform' })
  @IsOptional()
  @IsString()
  platformName?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
