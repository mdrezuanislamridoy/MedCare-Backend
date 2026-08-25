import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface QueueEventPayload {
  type:
    'CHECKED_IN' | 'CALLED' | 'IN_ROOM' | 'COMPLETED' | 'NO_SHOW' | 'WALK_IN';
  queueNumber: number;
  roomNumber?: string;
  patientName: string;
  doctorName: string;
  clinicId?: string;
  timestamp: string;
  data?: any;
}

@Injectable()
export class LiveQueueEventService {
  private readonly queueEvent$ = new Subject<QueueEventPayload>();

  emit(event: QueueEventPayload) {
    this.queueEvent$.next({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
  }

  getStream(): Observable<QueueEventPayload> {
    return this.queueEvent$.asObservable();
  }
}
