export * from './constants';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  RECEPTIONIST = 'RECEPTIONIST',
  CLINIC_MANAGER = 'CLINIC_MANAGER',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum QueueStatus {
  WAITING = 'WAITING',
  CALLED = 'CALLED',
  IN_ROOM = 'IN_ROOM',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export enum RecordCategory {
  LAB_REPORT = 'LAB_REPORT',
  IMAGING = 'IMAGING',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  VACCINATION = 'VACCINATION',
  OTHER = 'OTHER',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  CLOSED = 'CLOSED',
}

export enum StaffShiftStatus {
  ON_DUTY = 'ON_DUTY',
  OFF_DUTY = 'OFF_DUTY',
  ON_LEAVE = 'ON_LEAVE',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  RESOLVED = 'RESOLVED',
}

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
