import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { MICROSERVICES } from '../../contracts/src/constants';
import { getMicroserviceClientConfig } from './broker.transport';

const clientProviders = Object.values(MICROSERVICES).map((serviceName) =>
  getMicroserviceClientConfig(serviceName),
);

@Global()
@Module({
  imports: [ClientsModule.register(clientProviders)],
  exports: [ClientsModule],
})
export class BrokerClientModule {}
