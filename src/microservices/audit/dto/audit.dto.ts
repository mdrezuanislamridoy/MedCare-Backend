import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditFilterDto {
  @ApiPropertyOptional({ description: 'Search action, actor, resource, or IP address' })
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by Actor User ID' })
  actorId?: string;

  @ApiPropertyOptional({ description: 'Filter by action name (e.g., Check-in, Status Update)' })
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by result (success, failure)' })
  result?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class CreateAuditLogDto {
  @ApiPropertyOptional({ description: 'User ID of actor' })
  actorId?: string;

  @ApiProperty({ example: 'Dr. Linda Cho', description: 'Name of actor' })
  actorName!: string;

  @ApiProperty({ example: 'Prescription Issued', description: 'Action performed' })
  action!: string;

  @ApiProperty({ example: 'Prescription #RX-1029', description: 'Resource affected' })
  resource!: string;

  @ApiPropertyOptional({ description: 'JSON string of action payload/metadata' })
  details?: string;

  @ApiPropertyOptional({ example: '192.168.1.1', description: 'IP address' })
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Browser / Client User Agent' })
  userAgent?: string;

  @ApiPropertyOptional({ example: 'success', default: 'success' })
  result?: string;
}
