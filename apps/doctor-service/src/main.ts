import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  getMicroserviceServerOptions,
  getBrokerConfig,
} from '../../../../libs/broker/src';

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    'DOCTOR_SERVICE',
    parseInt(process.env.DOCTOR_SERVICE_PORT || '3002', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );
  const config = getBrokerConfig();
  await app.listen();
  console.log(`🩺 MedCare Doctor Service is listening [Broker: ${config.transportType}]`);
}

bootstrap();
