import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AuditFilterDto {
  @ApiPropertyOptional({
    example: 'Prescription',
    description: 'Search action, actor, resource, or IP address',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'user-doc-1',
    description: 'Filter by Actor User ID',
  })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({
    example: 'DOCTOR_ISSUE_PRESCRIPTION',
    description: 'Filter by action name',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    example: 'success',
    description: 'Filter by result (success, failure)',
  })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'End date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

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

export class CreateAuditLogDto {
  @ApiPropertyOptional({ example: 'user-101', description: 'User ID of actor' })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiProperty({ example: 'Dr. Linda Cho', description: 'Name of actor' })
  @IsNotEmpty()
  @IsString()
  actorName!: string;

  @ApiProperty({
    example: 'DOCTOR_ISSUE_PRESCRIPTION',
    description: 'Action performed',
  })
  @IsNotEmpty()
  @IsString()
  action!: string;

  @ApiProperty({
    example: 'Prescription #RX-1029',
    description: 'Resource affected',
  })
  @IsNotEmpty()
  @IsString()
  resource!: string;

  @ApiPropertyOptional({
    example: 'Issued 3 medicines to patient',
    description: 'JSON string or explanation of action payload',
  })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({ example: '192.168.1.1', description: 'IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    description: 'Browser / Client User Agent',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: 'success', default: 'success' })
  @IsOptional()
  @IsString()
  result?: string;
}
