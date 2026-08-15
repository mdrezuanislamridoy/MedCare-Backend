import { TransactionStatus } from '../../../../generated/prisma/client';

export class TransactionFilterDto {
  q?: string;
  provider?: string;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class ProcessRefundDto {
  amount?: number;
  reason!: string;
}

export class PatientPaymentDto {
  appointmentId!: string;
  amount!: number;
  provider!: string;
}
