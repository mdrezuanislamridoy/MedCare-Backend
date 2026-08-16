import { AppointmentStatus, AppointmentType, PaymentStatus, QueueStatus } from '../../../../generated/prisma/client';

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

export class BookAppointmentDto {
  doctorId!: string;
  clinicId?: string;
  date!: string;
  time!: string;
  type?: AppointmentType;
  notes?: string;
}

export class PatientAppointmentFilterDto {
  tab?: 'upcoming' | 'completed' | 'cancelled' | 'all';
  type?: AppointmentType;
  page?: number;
  limit?: number;
}

export class ReceptionistCheckInDto {
  appointmentId!: string;
  roomNumber?: string;
  notes?: string;
}

export class ReceptionistUpdateQueueDto {
  status!: QueueStatus;
}

export class ReceptionistWalkInBookingDto {
  patientId?: string;
  patientName?: string;
  phone?: string;
  doctorId!: string;
  clinicId?: string;
  time?: string;
  type?: AppointmentType;
  roomNumber?: string;
  notes?: string;
}
