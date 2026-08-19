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
    const request = context.switchToHttp().getRequest();
    const { method, url, correlationId } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now;
        const statusCode = context.switchToHttp().getResponse().statusCode;
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
