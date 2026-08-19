export * from './constants';

export interface BaseEventPayload<T = any> {
  eventId: string;
  timestamp: string;
  data: T;
  actorId?: string;
}

export interface AppointmentBookedEvent {
  appointmentId: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  clinicId?: string;
  date: string;
  timeSlot?: string;
  fee?: number;
}

export interface PaymentSuccessEvent {
  paymentId: string;
  invoiceId?: string;
  appointmentId?: string;
  patientId: string;
  amount: number;
  provider: string;
  transactionRef: string;
}

export interface QueueUpdatedEvent {
  queueId: string;
  clinicId: string;
  doctorId?: string;
  patientId: string;
  tokenNumber: number;
  status: string;
  roomNumber?: string;
}
