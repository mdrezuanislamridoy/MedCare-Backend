import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '../../../../libs/kafka/src';
import { EVENTS } from '../../../../libs/contracts/src';

@Injectable()
export class AppointmentEventPublisher {
  private readonly logger = new Logger(AppointmentEventPublisher.name);

  constructor(private readonly kafka: KafkaProducerService) {}

  async publishAppointmentBooked(payload: any) {
    this.logger.log(
      `Publishing event ${EVENTS.APPOINTMENT.BOOKED} for appointment ${payload.appointmentId}`,
    );
    await this.kafka.emit(EVENTS.APPOINTMENT.BOOKED, payload);
  }

  async publishQueueStateChanged(payload: any) {
    this.logger.log(
      `Publishing event ${EVENTS.QUEUE.STATE_CHANGED} for queue ${payload.queueId}`,
    );
    await this.kafka.emit(EVENTS.QUEUE.STATE_CHANGED, payload);
  }
}
