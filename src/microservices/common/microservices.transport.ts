import { Transport, MicroserviceOptions, ClientProviderOptions } from '@nestjs/microservices';

export interface TransportEnvironmentConfig {
  transportType: 'TCP' | 'REDIS';
  tcpHost?: string;
  tcpPort?: number;
  redisHost?: string;
  redisPort?: number;
}

export function getTransportConfig(): TransportEnvironmentConfig {
  const isRedis = (process.env.MICROSERVICE_TRANSPORT || 'TCP').toUpperCase() === 'REDIS';
  return {
    transportType: isRedis ? 'REDIS' : 'TCP',
    tcpHost: process.env.MICROSERVICE_TCP_HOST || '127.0.0.1',
    tcpPort: parseInt(process.env.MICROSERVICE_TCP_PORT || '3001', 10),
    redisHost: process.env.REDIS_HOST || '127.0.0.1',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  };
}

/**
 * Generates MicroserviceOptions for NestJS server listeners
 */
export function getMicroserviceServerOptions(customPort?: number): MicroserviceOptions {
  const config = getTransportConfig();

  if (config.transportType === 'REDIS') {
    return {
      transport: Transport.REDIS,
      options: {
        host: config.redisHost,
        port: config.redisPort,
        retryAttempts: 5,
        retryDelay: 2000,
      },
    };
  }

  return {
    transport: Transport.TCP,
    options: {
      host: config.tcpHost,
      port: customPort || config.tcpPort,
    },
  };
}

/**
 * Generates ClientProviderOptions for NestJS ClientsModule registration
 */
export function getMicroserviceClientConfig(
  serviceName: string,
  customPort?: number,
): ClientProviderOptions {
  const config = getTransportConfig();

  if (config.transportType === 'REDIS') {
    return {
      name: serviceName,
      transport: Transport.REDIS,
      options: {
        host: config.redisHost,
        port: config.redisPort,
        retryAttempts: 5,
        retryDelay: 2000,
      },
    };
  }

  return {
    name: serviceName,
    transport: Transport.TCP,
    options: {
      host: config.tcpHost,
      port: customPort || config.tcpPort,
    },
  };
}
