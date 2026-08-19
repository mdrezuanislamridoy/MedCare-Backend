import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId =
      request.headers[CORRELATION_ID_HEADER] || randomUUID();

    // Attach to request for downstream use
    request.correlationId = correlationId;

    // Attach to response for client tracing
    const response = context.switchToHttp().getResponse();
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return next.handle().pipe(
      tap(() => {
        // Response already has the header set
      }),
    );
  }
}
