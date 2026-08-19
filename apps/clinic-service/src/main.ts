import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  getMicroserviceServerOptions,
  getBrokerConfig,
} from '../../../../libs/broker/src';

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    'CLINIC_SERVICE',
    parseInt(process.env.CLINIC_SERVICE_PORT || '3005', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );
  const config = getBrokerConfig();
  await app.listen();
  console.log(`🏢 MedCare Clinic Service is listening [Broker: ${config.transportType}]`);
}

bootstrap();
