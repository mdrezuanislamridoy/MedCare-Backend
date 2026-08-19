import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { MICROSERVICES } from './microservices.constants';
import { getMicroserviceClientConfig } from './microservices.transport';

const clientProviders = Object.values(MICROSERVICES).map((serviceName) =>
  getMicroserviceClientConfig(serviceName),
);

@Global()
@Module({
  imports: [ClientsModule.register(clientProviders)],
  exports: [ClientsModule],
})
export class MicroservicesClientModule {}
