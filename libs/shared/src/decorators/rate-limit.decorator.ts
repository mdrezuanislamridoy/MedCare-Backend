import { SetMetadata } from '@nestjs/common';
import { ApiRateLimitTier } from '../guards/rate-limit.types';

export const RATE_LIMIT_TIER_KEY = 'rate_limit:tier';
export const RATE_LIMIT_CUSTOM_KEY = 'rate_limit:custom';
export const RATE_LIMIT_SKIP_KEY = 'rate_limit:skip';

export interface CustomRateLimitOptions {
  /** Time window in milliseconds */
  ttl?: number;
  /** Maximum number of requests within the time window */
  limit?: number;
  /** Optional tier fallback */
  tier?: ApiRateLimitTier;
  /** Skip throttling if true */
  skip?: boolean;
}

/**
 * Apply a specific rate limit tier to a controller or endpoint.
 *
 * @example
 * @RateLimitTier(ApiRateLimitTier.AUTH)
 * @Post('login')
 * login() { ... }
 */
export const RateLimitTier = (tier: ApiRateLimitTier) =>
  SetMetadata(RATE_LIMIT_TIER_KEY, tier);

/**
 * Configure custom rate limits for a controller or endpoint.
 *
 * @example
 * @ApiRateLimit({ limit: 5, ttl: 60000 })
 * @Post('sensitive-operation')
 * sensitiveOp() { ... }
 */
export const ApiRateLimit = (options: CustomRateLimitOptions) =>
  SetMetadata(RATE_LIMIT_CUSTOM_KEY, options);

/**
 * Skip rate limiting completely for a controller or endpoint.
 *
 * @example
 * @SkipRateLimit()
 * @Get('health')
 * health() { ... }
 */
export const SkipRateLimit = () => SetMetadata(RATE_LIMIT_SKIP_KEY, true);
