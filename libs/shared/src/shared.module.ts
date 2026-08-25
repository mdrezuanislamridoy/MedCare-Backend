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
import {
  ApiRateLimitTier,
  DEFAULT_RATE_LIMIT_CONFIGS,
} from './guards/rate-limit.types';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.STANDARD].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.STANDARD].limit,
      },
      {
        name: 'auth',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.AUTH].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.AUTH].limit,
      },
      {
        name: 'payment',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.PAYMENT].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.PAYMENT].limit,
      },
      {
        name: 'chat',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.CHAT].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.CHAT].limit,
      },
      {
        name: 'upload',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.UPLOAD].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.UPLOAD].limit,
      },
      {
        name: 'search',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.SEARCH].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.SEARCH].limit,
      },
      {
        name: 'public',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.PUBLIC].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.PUBLIC].limit,
      },
      {
        name: 'standard',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.STANDARD].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.STANDARD].limit,
      },
      {
        name: 'admin',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.ADMIN].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.ADMIN].limit,
      },
      {
        name: 'high_frequency',
        ttl: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.HIGH_FREQUENCY].ttl,
        limit: DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.HIGH_FREQUENCY].limit,
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
    AppThrottlerGuard,
  ],
  exports: [HealthModule, ThrottlerModule, AppThrottlerGuard],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply any middleware here if needed
  }
}
