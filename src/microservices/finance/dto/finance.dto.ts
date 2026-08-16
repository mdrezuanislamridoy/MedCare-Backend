import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '../../../../generated/prisma/client';

export class TransactionFilterDto {
  @ApiPropertyOptional({ description: 'Search transaction reference or patient name' })
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by provider (e.g. STRIPE, SSLCOMMERZ, BKASH)' })
  provider?: string;

  @ApiPropertyOptional({ enum: TransactionStatus, description: 'Filter by transaction status' })
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class ProcessRefundDto {
  @ApiPropertyOptional({ example: 50.0, description: 'Partial refund amount (defaults to full transaction amount)' })
  amount?: number;

  @ApiProperty({ example: 'Patient requested cancellation prior to consultation', description: 'Reason for refund' })
  reason!: string;
}

export class PatientPaymentDto {
  @ApiProperty({ example: 'apt-cuid-123', description: 'Appointment ID to pay for' })
  appointmentId!: string;

  @ApiProperty({ example: 85.0, description: 'Payment amount' })
  amount!: number;

  @ApiProperty({ example: 'STRIPE', description: 'Payment provider (STRIPE, SSLCOMMERZ, BKASH, CASH)' })
  provider!: string;
}
