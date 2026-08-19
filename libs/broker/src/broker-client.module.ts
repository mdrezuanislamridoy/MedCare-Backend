import { Global, Module, DynamicModule } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { MICROSERVICES } from '@medcare/contracts';
import { getMicroserviceClientConfig } from './broker.transport';

/**
 * BrokerClientModule - Configurable microservice client module.
 *
 * Usage:
 *   // Register ALL clients (for API Gateway)
 *   @Module({ imports: [BrokerClientModule] })
 *
 *   // Register only specific clients (for individual services)
 *   @Module({ imports: [BrokerClientModule.forServices([MICROSERVICES.DOCTOR, MICROSERVICES.APPOINTMENT])] })
 *
 *   // Dynamic registration
 *   BrokerClientModule.forServices([MICROSERVICES.AUTH])
 */
@Global()
@Module({})
export class BrokerClientModule {
  /**
   * Register clients for specific services only.
   * Recommended for individual microservices that call other services.
   */
  static forServices(serviceNames: string[]): DynamicModule {
    const clientProviders = serviceNames.map((serviceName) =>
      getMicroserviceClientConfig(serviceName),
    );

    return {
      module: BrokerClientModule,
      imports: [ClientsModule.register(clientProviders)],
      exports: [ClientsModule],
    };
  }

  /**
   * Register ALL service clients.
   * Used by the API Gateway which routes to every microservice.
   */
  static forAll(): DynamicModule {
    const clientProviders = Object.values(MICROSERVICES).map((serviceName) =>
      getMicroserviceClientConfig(serviceName),
    );

    return {
      module: BrokerClientModule,
      imports: [ClientsModule.register(clientProviders)],
      exports: [ClientsModule],
    };
  }

  /**
   * Default: register ALL clients (backward compatible).
   * @deprecated Use forAll() or forServices() instead.
   */
  static forRoot(): DynamicModule {
    return BrokerClientModule.forAll();
  }
}
