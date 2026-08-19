import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import {
  getMicroserviceServerOptions,
  getBrokerConfig,
} from '@medcare/broker';

async function bootstrap() {
  const options = getMicroserviceServerOptions(
    'AUTH_SERVICE',
    parseInt(process.env.AUTH_SERVICE_PORT || '3015', 10),
  );
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    options,
  );
  const config = getBrokerConfig();
  await app.listen();
  console.log(`🔑 MedCare Auth Service is listening [Broker: ${config.transportType}]`);
}

bootstrap();
