import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  getMicroserviceServerOptions,
  getBrokerConfig,
} from '../../../libs/broker/src';

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    'BILLING_SERVICE',
    parseInt(process.env.BILLING_SERVICE_PORT || '3006', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );
  const config = getBrokerConfig();
  await app.listen();
  console.log(`💳 MedCare Billing Service is listening [Broker: ${config.transportType}]`);
}

bootstrap();
