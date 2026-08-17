import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdatePlatformSettingsDto {
  @ApiProperty({
    example: {
      ALLOW_SELF_REGISTRATION: 'true',
      MAINTENANCE_MODE: 'false',
      DEFAULT_CURRENCY: 'USD',
      CONSULTATION_CANCELLATION_HOURS: '24',
    },
    description: 'Key-value map of platform settings',
  })
  @IsNotEmpty()
  @IsObject()
  settings!: Record<string, string>;
}

export class TriggerBackupDto {
  @ApiPropertyOptional({ example: 'S3_BACKUP_STORAGE', description: 'Target backup destination storage bucket or location' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ example: 'Nightly automated system & database snapshot.', description: 'Audit backup notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
