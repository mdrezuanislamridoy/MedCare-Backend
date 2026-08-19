import { Module, Global, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { CircuitBreakerInterceptor } from './interceptors/circuit-breaker.interceptor';
import { AppThrottlerGuard } from './guards/throttle.guard';
import { HealthModule } from './health/health.module';

/**
 * @medcare/shared - Global shared module for all microservices.
 *
 * Automatically provides:
 * - Global exception filter (structured error responses)
 * - Correlation ID interceptor (distributed tracing)
 * - Logging interceptor (request/response timing)
 * - Timeout interceptor (30s default)
 * - Circuit breaker interceptor (fault tolerance)
 * - Rate limiting guard (role-based throttling)
 * - Health check endpoints (/health, /health/ready)
 *
 * Usage: Import SharedModule in any microservice's AppModule.
 */
@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CircuitBreakerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
  exports: [HealthModule],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply any middleware here if needed
  }
}
