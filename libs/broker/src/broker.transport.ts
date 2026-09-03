import { Injectable } from '@nestjs/common';
import {
  ClientProviderOptions,
  ClientProxy,
  CustomTransportStrategy,
  MicroserviceOptions,
  Server,
} from '@nestjs/microservices';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

const PROTO_PATH = join(process.cwd(), 'libs/broker/proto/medcare.proto');

type GrpcPackage = {
  medcare: {
    MedCareRpc: {
      service: grpc.ServiceDefinition;
      new (url: string, credentials: grpc.ChannelCredentials): grpc.Client;
    };
  };
};

function getGrpcPackage(): GrpcPackage {
  const definition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  return grpc.loadPackageDefinition(definition) as unknown as GrpcPackage;
}

function parsePayload(payload: string): unknown {
  if (!payload) {
    return undefined;
  }

  return JSON.parse(payload);
}

function serializePayload(payload: unknown): string {
  return JSON.stringify(payload === undefined ? null : payload);
}

export interface BrokerConfig {
  transportType: 'GRPC';
  grpcHost: string;
  grpcPort: number;
}

export function getBrokerConfig(): BrokerConfig {
  return {
    transportType: 'GRPC',
    grpcHost: process.env.GRPC_HOST || '0.0.0.0',
    grpcPort: parseInt(process.env.GRPC_PORT || '3001', 10),
  };
}

export const getTransportConfig = getBrokerConfig;

export function getMicroserviceServerOptions(
  serviceName?: string,
  customPort?: number,
): MicroserviceOptions {
  return {
    strategy: new GrpcServer(
      process.env.GRPC_HOST || '0.0.0.0',
      customPort || getBrokerConfig().grpcPort,
    ),
  };
}

export function getMicroserviceClientConfig(
  serviceName: string,
  customPort?: number,
): ClientProviderOptions {
  return {
    name: serviceName,
    customClass: GrpcClientProxy,
    options: {
      url: getServiceUrl(serviceName, customPort),
    },
  };
}

function getServiceUrl(serviceName: string, customPort?: number): string {
  const environmentKey = `GRPC_${serviceName}_URL`;
  const configuredUrl = process.env[environmentKey];
  if (configuredUrl) {
    return configuredUrl;
  }

  const port = customPort ||
    Number(process.env[`GRPC_${serviceName}_PORT`]) ||
    ({
      AUTH_SERVICE: 3015,
      DOCTOR_SERVICE: 3002,
      PATIENT_SERVICE: 3003,
      APPOINTMENT_SERVICE: 3004,
      CLINIC_SERVICE: 3005,
      BILLING_SERVICE: 3006,
      NOTIFICATION_SERVICE: 3007,
      AUDIT_SERVICE: 3008,
      ANALYTICS_SERVICE: 3010,
      CHAT_SERVICE: 3014,
    } as Record<string, number>)[serviceName] || 3001;

  return `${process.env.GRPC_HOST || '127.0.0.1'}:${port}`;
}

@Injectable()
export class GrpcClientProxy extends ClientProxy {
  private readonly client: grpc.Client;
  private readonly url: string;

  constructor(options: { url: string }) {
    super();
    this.url = options.url;
    const rpcClient = getGrpcPackage().medcare.MedCareRpc;
    this.client = new rpcClient(this.url, grpc.credentials.createInsecure());
  }

  connect(): Promise<void> {
    return Promise.resolve();
  }

  close(): void {
    this.client.close();
  }

  unwrap<T>(): T {
    return this.client as unknown as T;
  }

  protected publish(
    packet: { pattern: any; data: any },
    callback: (packet: { err?: unknown; response?: unknown; isDisposed?: boolean }) => void,
  ): () => void {
    const call = (this.client as any).Call(
      {
        pattern: this.normalizePattern(packet.pattern),
        payload_json: serializePayload(packet.data),
        event: false,
      },
      (error: grpc.ServiceError | null, response: { payload_json: string; error: string }) => {
        if (error || response?.error) {
          callback({ err: error || new Error(response.error) });
          return;
        }

        callback({
          response: parsePayload(response.payload_json),
          isDisposed: true,
        });
      },
    );

    return () => call.cancel();
  }

  protected dispatchEvent<T = any>(
    packet: { pattern: any; data: any },
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      (this.client as any).Call(
        {
          pattern: this.normalizePattern(packet.pattern),
          payload_json: serializePayload(packet.data),
          event: true,
        },
        (error: grpc.ServiceError | null, response: { error: string }) => {
          if (error || response?.error) {
            reject(error || new Error(response.error));
            return;
          }
          resolve(undefined as T);
        },
      );
    });
  }
}

export class GrpcServer extends Server implements CustomTransportStrategy {
  private readonly grpcServer = new grpc.Server();

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {
    super();
  }

  listen(callback: (...optionalParams: unknown[]) => any): void {
    const rpcService = getGrpcPackage().medcare.MedCareRpc.service;
    this.grpcServer.addService(rpcService, {
      Call: (
        call: grpc.ServerUnaryCall<any, any>,
        callback: grpc.sendUnaryData<any>,
      ) => {
        void this.handleCall(call, callback);
      },
    });

    this.grpcServer.bindAsync(
      `${this.host}:${this.port}`,
      grpc.ServerCredentials.createInsecure(),
      (error) => {
        if (error) {
          throw error;
        }
        callback();
      },
    );
  }

  close(): void {
    this.grpcServer.forceShutdown();
  }

  unwrap<T>(): T {
    return this.grpcServer as unknown as T;
  }

  on(): void {
    // The generic RPC transport does not expose broker lifecycle events.
  }

  private async handleCall(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): Promise<void> {
    const request = call.request as {
      pattern: string;
      payload_json: string;
      event: boolean;
    };
    const pattern = request.pattern;
    const handler = this.getHandlerByPattern(pattern);

    if (!handler) {
      callback(null, { error: `No handler registered for pattern: ${pattern}` });
      return;
    }

    try {
      const result = await handler(parsePayload(request.payload_json), call);
      const observable = this.transformToObservable(result);
      observable.subscribe({
        next: (response) => {
          if (!request.event) {
            callback(null, { payload_json: serializePayload(response) });
          }
        },
        error: (error) => callback(null, { error: error?.message || String(error) }),
        complete: () => {
          if (request.event) {
            callback(null, {});
          }
        },
      });
    } catch (error) {
      callback(null, { error: error instanceof Error ? error.message : String(error) });
    }
  }
}
