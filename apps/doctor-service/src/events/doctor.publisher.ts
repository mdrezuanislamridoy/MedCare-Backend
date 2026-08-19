import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '../../../../libs/kafka/src';
import { EVENTS } from '../../../../libs/contracts/src';

@Injectable()
export class DoctorEventPublisher {
  private readonly logger = new Logger(DoctorEventPublisher.name);

  constructor(private readonly kafka: KafkaProducerService) {}

  async publishVerificationSubmitted(doctorId: string, payload: any) {
    this.logger.log(`Publishing event ${EVENTS.DOCTOR.VERIFICATION_SUBMITTED} for doctor ${doctorId}`);
    await this.kafka.emit(EVENTS.DOCTOR.VERIFICATION_SUBMITTED, { doctorId, ...payload });
  }

  async publishPayoutRequested(doctorId: string, amount: number) {
    this.logger.log(`Publishing event ${EVENTS.DOCTOR.PAYOUT_REQUESTED} for doctor ${doctorId}`);
    await this.kafka.emit(EVENTS.DOCTOR.PAYOUT_REQUESTED, { doctorId, amount });
  }
}
