import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);

  onModuleInit() {
    this.logger.log('Kafka Producer initialized');
  }

  async emit(topic: string, message: any): Promise<void> {
    this.logger.log(
      `[Kafka Emit] Topic: ${topic}, Payload: ${JSON.stringify(message)}`,
    );
  }
}
