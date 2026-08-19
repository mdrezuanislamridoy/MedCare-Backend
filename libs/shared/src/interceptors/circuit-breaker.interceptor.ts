import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';

/**
 * Simple circuit breaker interceptor for microservice calls.
 *
 * States:
 * - CLOSED (normal): requests pass through normally
 * - OPEN (tripped): requests fail fast with 503
 * - HALF_OPEN: one probe request is allowed through to test recovery
 *
 * Configure via static state map keyed by service name.
 */
@Injectable()
export class CircuitBreakerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('CircuitBreaker');
  private readonly circuits = new Map<
    string,
    {
      state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
      failureCount: number;
      lastFailureTime: number;
      successCount: number;
    }
  >();

  private readonly failureThreshold = 5;
  private readonly recoveryTimeoutMs = 30000; // 30s before trying half-open

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const circuitName = this.getServiceName(context);
    const circuit = this.getOrCreateCircuit(circuitName);

    // If OPEN, check if recovery timeout has elapsed
    if (circuit.state === 'OPEN') {
      const elapsed = Date.now() - circuit.lastFailureTime;
      if (elapsed > this.recoveryTimeoutMs) {
        circuit.state = 'HALF_OPEN';
        this.logger.warn(
          `Circuit ${circuitName} transitioning to HALF_OPEN after ${elapsed}ms`,
        );
      } else {
        this.logger.warn(
          `Circuit ${circuitName} is OPEN. Failing fast. (${elapsed}ms / ${this.recoveryTimeoutMs}ms)`,
        );
        return throwError(
          () =>
            new ServiceUnavailableException(
              `Service ${circuitName} is temporarily unavailable`,
            ),
        );
      }
    }

    return next.handle().pipe(
      tap(() => {
        // Success - reset circuit
        if (circuit.state === 'HALF_OPEN') {
          circuit.successCount++;
          if (circuit.successCount >= 2) {
            circuit.state = 'CLOSED';
            circuit.failureCount = 0;
            circuit.successCount = 0;
            this.logger.log(
              `Circuit ${circuitName} recovered. State: CLOSED`,
            );
          }
        } else {
          circuit.failureCount = 0;
        }
      }),
      catchError((error) => {
        circuit.failureCount++;
        circuit.lastFailureTime = Date.now();
        circuit.successCount = 0;

        if (circuit.failureCount >= this.failureThreshold) {
          circuit.state = 'OPEN';
          this.logger.error(
            `Circuit ${circuitName} tripped OPEN after ${circuit.failureCount} failures`,
          );
        }

        return throwError(() => error);
      }),
    );
  }

  private getServiceName(context: ExecutionContext): string {
    const handler = context.getHandler();
    const className = context.getClass().name;
    return `${className}.${handler.name}`;
  }

  private getOrCreateCircuit(name: string) {
    if (!this.circuits.has(name)) {
      this.circuits.set(name, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        successCount: 0,
      });
    }
    return this.circuits.get(name)!;
  }
}
