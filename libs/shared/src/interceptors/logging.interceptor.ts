import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    if (!request || !request.method) {
      return next.handle();
    }

    const { method, url, correlationId } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        const statusCode = response?.statusCode || 200;
        const logMessage = `${method} ${url} ${statusCode} ${elapsed}ms`;

        if (correlationId) {
          this.logger.log(`[${correlationId}] ${logMessage}`);
        } else {
          this.logger.log(logMessage);
        }
      }),
    );
  }
}
