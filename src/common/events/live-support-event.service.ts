import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface SupportEventPayload {
  type:
    | 'NEW_TICKET_CREATED'
    | 'TICKET_ASSIGNED'
    | 'TICKET_REPLIED'
    | 'TICKET_RESOLVED'
    | 'COMPLAINT_CREATED'
    | 'COMPLAINT_ESCALATED'
    | 'APPOINTMENT_FLAGGED'
    | 'HEARTBEAT';
  targetId?: string;
  referenceNumber?: string; // e.g. "TICK-8021" or "CMP-4019"
  title: string;
  patientName?: string | null;
  priority?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  timestamp: string;
  data?: any;
}

@Injectable()
export class LiveSupportEventService {
  private readonly supportEvent$ = new Subject<SupportEventPayload>();

  emit(event: Omit<SupportEventPayload, 'timestamp'> & { timestamp?: string }) {
    this.supportEvent$.next({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
  }

  getStream(): Observable<SupportEventPayload> {
    return this.supportEvent$.asObservable();
  }
}
