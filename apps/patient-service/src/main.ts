import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  getMicroserviceServerOptions,
  getBrokerConfig,
} from '../../../libs/broker/src';

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    'PATIENT_SERVICE',
    parseInt(process.env.PATIENT_SERVICE_PORT || '3003', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );
  const config = getBrokerConfig();
  await app.listen();
  console.log(
    `🏥 MedCare Patient Service is listening [Broker: ${config.transportType}]`,
  );
}

bootstrap();
