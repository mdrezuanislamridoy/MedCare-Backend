/**
 * Supported API rate limit tiers.
 */
export enum ApiRateLimitTier {
  /** Strict limit for authentication & credential endpoints (login, register, forgot/reset password) */
  AUTH = 'AUTH',
  /** Strict limit for checkout, payments, transfers, and refunds */
  PAYMENT = 'PAYMENT',
  /** Moderate limit for real-time messaging & chat */
  CHAT = 'CHAT',
  /** File & image upload protection */
  UPLOAD = 'UPLOAD',
  /** Heavy aggregation & text search queries */
  SEARCH = 'SEARCH',
  /** Public read-heavy endpoints for unauthenticated visitors */
  PUBLIC = 'PUBLIC',
  /** Standard limit for authenticated user operations */
  STANDARD = 'STANDARD',
  /** Elevated operational limit for Admin and Super Admin users */
  ADMIN = 'ADMIN',
  /** Rapid telemetry / polling */
  HIGH_FREQUENCY = 'HIGH_FREQUENCY',
  /** Completely bypass throttling (Health checks, docs, webhooks) */
  EXEMPT = 'EXEMPT',
}

/**
 * Options for a single rate limit tier.
 */
export interface RateLimitTierConfig {
  /** Time window in milliseconds (e.g. 60000 for 1 minute) */
  ttl: number;
  /** Maximum number of requests allowed within the TTL window */
  limit: number;
  /** Duration in milliseconds to block requests once limit is exceeded (defaults to TTL) */
  blockDuration?: number;
}

/**
 * Default tier rate limit configurations.
 */
export const DEFAULT_RATE_LIMIT_CONFIGS: Record<ApiRateLimitTier, RateLimitTierConfig> = {
  [ApiRateLimitTier.AUTH]: {
    ttl: 60000, // 1 minute
    limit: 10,  // 10 req/min
    blockDuration: 60000,
  },
  [ApiRateLimitTier.PAYMENT]: {
    ttl: 60000, // 1 minute
    limit: 15,  // 15 req/min
    blockDuration: 60000,
  },
  [ApiRateLimitTier.CHAT]: {
    ttl: 60000, // 1 minute
    limit: 60,  // 60 req/min
    blockDuration: 30000,
  },
  [ApiRateLimitTier.UPLOAD]: {
    ttl: 60000, // 1 minute
    limit: 20,  // 20 req/min
    blockDuration: 60000,
  },
  [ApiRateLimitTier.SEARCH]: {
    ttl: 60000, // 1 minute
    limit: 60,  // 60 req/min
    blockDuration: 30000,
  },
  [ApiRateLimitTier.PUBLIC]: {
    ttl: 60000, // 1 minute
    limit: 100, // 100 req/min
    blockDuration: 60000,
  },
  [ApiRateLimitTier.STANDARD]: {
    ttl: 60000, // 1 minute
    limit: 120, // 120 req/min
    blockDuration: 60000,
  },
  [ApiRateLimitTier.ADMIN]: {
    ttl: 60000, // 1 minute
    limit: 300, // 300 req/min
    blockDuration: 30000,
  },
  [ApiRateLimitTier.HIGH_FREQUENCY]: {
    ttl: 10000, // 10 seconds
    limit: 50,  // 50 req/10s
    blockDuration: 10000,
  },
  [ApiRateLimitTier.EXEMPT]: {
    ttl: 0,
    limit: 0,
  },
};
