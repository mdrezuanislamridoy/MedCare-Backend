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
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSED = 'PROCESSED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum AppointmentType {
  IN_PERSON = 'IN_PERSON',
  VIDEO_CONSULTATION = 'VIDEO_CONSULTATION',
  VIDEO = 'VIDEO',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
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
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  CLOSED = 'CLOSED',
}

export enum RoomType {
  CONSULTATION = 'CONSULTATION',
  PROCEDURE = 'PROCEDURE',
  LAB = 'LAB',
  EMERGENCY = 'EMERGENCY',
  WAITING = 'WAITING',
}

export enum StaffRole {
  RECEPTIONIST = 'RECEPTIONIST',
  NURSE = 'NURSE',
  PHARMACIST = 'PHARMACIST',
  LAB_TECHNICIAN = 'LAB_TECHNICIAN',
  ADMIN = 'ADMIN',
  OTHER = 'OTHER',
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

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  SUPPORT = 'SUPPORT',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationAudience {
  ALL = 'ALL',
  DOCTORS = 'DOCTORS',
  PATIENTS = 'PATIENTS',
  STAFF = 'STAFF',
  CLINIC_MANAGERS = 'CLINIC_MANAGERS',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
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
