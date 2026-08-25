import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupportTicketDto {
  @ApiProperty({
    example: 'usr-patient-101',
    description: 'Patient or User ID ticket is opened for',
  })
  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @ApiProperty({
    example: 'Prescription download error',
    description: 'Ticket subject line',
  })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiProperty({
    example: 'HIGH',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    default: 'NORMAL',
  })
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiProperty({
    example:
      'Patient is unable to download PDF prescription for appointment #apt-1001.',
    description: 'Issue description',
  })
  @IsNotEmpty()
  @IsString()
  description!: string;
}

export class CreateComplaintDto {
  @ApiProperty({
    example: 'usr-patient-101',
    description: 'Patient ID filing dispute',
  })
  @IsNotEmpty()
  @IsString()
  patientId!: string;

  @ApiProperty({
    example: 'Billing Overcharge',
    description: 'Category or subject of complaint',
  })
  @IsNotEmpty()
  @IsString()
  subject!: string;

  @ApiProperty({
    example: 'Patient was double billed for video consultation on Aug 15th.',
    description: 'Detailed statement',
  })
  @IsNotEmpty()
  @IsString()
  details!: string;
}

export class SupportFilterDto {
  @ApiPropertyOptional({
    example: 'Prescription',
    description: 'Search keywords',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] })
  @IsOptional()
  @IsString()
  status?: string;

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
