import {
  Transport,
  MicroserviceOptions,
  ClientProviderOptions,
} from '@nestjs/microservices';

export interface BrokerConfig {
  transportType: 'REDIS' | 'KAFKA' | 'TCP';
  redisHost: string;
  redisPort: number;
  kafkaBrokers: string[];
  tcpHost: string;
  tcpPort: number;
}

export function getBrokerConfig(): BrokerConfig {
  const transportEnv = (
    process.env.MICROSERVICE_TRANSPORT || 'REDIS'
  ).toUpperCase();
  const transportType: 'REDIS' | 'KAFKA' | 'TCP' =
    transportEnv === 'KAFKA'
      ? 'KAFKA'
      : transportEnv === 'TCP'
        ? 'TCP'
        : 'REDIS';

  return {
    transportType,
    redisHost: process.env.REDIS_HOST || '127.0.0.1',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    kafkaBrokers: (process.env.KAFKA_BROKERS || '127.0.0.1:9092').split(','),
    tcpHost: process.env.MICROSERVICE_TCP_HOST || '127.0.0.1',
    tcpPort: parseInt(process.env.MICROSERVICE_TCP_PORT || '3001', 10),
  };
}

export const getTransportConfig = getBrokerConfig;

export function getMicroserviceServerOptions(
  serviceName?: string,
  customPort?: number,
): MicroserviceOptions {
  const config = getBrokerConfig();

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

  if (config.transportType === 'KAFKA') {
    return {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: serviceName || 'medcare-service',
          brokers: config.kafkaBrokers,
        },
        consumer: {
          groupId: `${serviceName || 'medcare'}-consumer-group`,
        },
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

export function getMicroserviceClientConfig(
  serviceName: string,
  customPort?: number,
): ClientProviderOptions {
  const config = getBrokerConfig();

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

  if (config.transportType === 'KAFKA') {
    return {
      name: serviceName,
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: `client-${serviceName.toLowerCase()}`,
          brokers: config.kafkaBrokers,
        },
        consumer: {
          groupId: `client-${serviceName.toLowerCase()}-group`,
        },
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
