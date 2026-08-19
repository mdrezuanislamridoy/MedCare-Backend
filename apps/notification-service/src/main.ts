import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  getMicroserviceServerOptions,
  getBrokerConfig,
} from '../../../libs/broker/src';

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    'NOTIFICATION_SERVICE',
    parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3007', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );
  const config = getBrokerConfig();
  await app.listen();
  console.log(
    `🔔 MedCare Notification Service is listening [Broker: ${config.transportType}]`,
  );
}

bootstrap();
