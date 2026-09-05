import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    if (!request || !request.headers) {
      return next.handle();
    }

    const correlationId =
      request.headers[CORRELATION_ID_HEADER] || randomUUID();

    // Attach to request for downstream use
    request.correlationId = correlationId;

    // Attach to response for client tracing
    if (response && typeof response.setHeader === 'function') {
      response.setHeader(CORRELATION_ID_HEADER, correlationId);
    }

    return next.handle();
  }
}
