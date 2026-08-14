import { AppointmentStatus, AppointmentType, PaymentStatus } from '../../../../generated/prisma/client';

export class AppointmentFilterDto {
  q?: string;
  doctorId?: string;
  patientId?: string;
  clinicId?: string;
  status?: AppointmentStatus;
  paymentStatus?: PaymentStatus;
  type?: AppointmentType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class TransitionAppointmentStatusDto {
  status!: AppointmentStatus;
  cancellationReason?: string;
}

export class RescheduleAppointmentDto {
  date!: string;
  time!: string;
  doctorId?: string;
  clinicId?: string;
  reason?: string;
}
