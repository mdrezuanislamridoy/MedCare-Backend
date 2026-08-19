import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '@medcare/contracts';

export class TransactionFilterDto {
  @ApiPropertyOptional({
    example: 'TXN-948123',
    description: 'Search transaction reference or patient name',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'STRIPE',
    description:
      'Filter by provider (e.g. STRIPE, SSLCOMMERZ, BKASH, CASH, IN_CLINIC)',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    description: 'Filter by transaction status',
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Start date filter (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'End date filter (YYYY-MM-DD)',
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

export class ProcessRefundDto {
  @ApiPropertyOptional({
    example: 150.0,
    description: 'Partial refund amount (defaults to full transaction amount)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({
    example: 'Patient requested cancellation prior to consultation window',
    description: 'Reason for refund',
  })
  @IsNotEmpty()
  @IsString()
  reason!: string;
}

export class PatientPaymentDto {
  @ApiProperty({
    example: 'apt-1001',
    description: 'Appointment ID to pay for',
  })
  @IsNotEmpty()
  @IsString()
  appointmentId!: string;

  @ApiProperty({ example: 150.0, description: 'Payment amount' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    example: 'STRIPE',
    description: 'Payment provider (STRIPE, SSLCOMMERZ, BKASH, CASH)',
  })
  @IsNotEmpty()
  @IsString()
  provider!: string;
}
