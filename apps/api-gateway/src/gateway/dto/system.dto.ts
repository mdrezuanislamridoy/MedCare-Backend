import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TriggerBackupDto {
  @ApiPropertyOptional({ example: 'FULL_SYSTEM' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePlatformSettingsDto {
  @ApiPropertyOptional({ example: 'MedCare Enterprise Platform' })
  @IsOptional()
  platformName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  maintenanceMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, any>;
}
