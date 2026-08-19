import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  getMicroserviceServerOptions,
  getBrokerConfig,
} from '../../../../libs/broker/src';

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    'CHAT_SERVICE',
    parseInt(process.env.CHAT_SERVICE_PORT || '3014', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );
  const config = getBrokerConfig();
  await app.listen();
  console.log(`💬 MedCare Chat Service is listening [Broker: ${config.transportType}]`);
}

bootstrap();
