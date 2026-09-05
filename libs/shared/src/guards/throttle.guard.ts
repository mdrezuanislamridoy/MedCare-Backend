import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerModuleOptions } from '@nestjs/throttler/dist/throttler-module-options.interface';
import {
  ApiRateLimitTier,
  DEFAULT_RATE_LIMIT_CONFIGS,
  RateLimitTierConfig,
} from './rate-limit.types';
import {
  RATE_LIMIT_TIER_KEY,
  RATE_LIMIT_CUSTOM_KEY,
  RATE_LIMIT_SKIP_KEY,
  CustomRateLimitOptions,
} from '../decorators/rate-limit.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Enterprise API-aware rate limiting guard for MedCare microservices platform.
 *
 * Features:
 * - Dynamic heuristic & tier-based rate limiting by API route and user role.
 * - Granular decorator support (@RateLimitTier, @ApiRateLimit, @SkipRateLimit).
 * - IP + Authenticated User ID composite tracking.
 * - Standard HTTP headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Tier).
 * - Structured 429 Too Many Requests response format with Retry-After.
 * - Automatic exemption for health checks, Swagger docs, static uploads, and webhooks.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly appLogger = new Logger(AppThrottlerGuard.name);

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
    this.headerPrefix = 'X-RateLimit';
  }

  /**
   * Determine if the current execution context should be completely exempt from throttling.
   */
  protected override shouldSkip(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    // Check custom skip decorator
    const isCustomSkipped = this.reflector.getAllAndOverride<boolean>(
      RATE_LIMIT_SKIP_KEY,
      [handler, classRef],
    );
    if (isCustomSkipped) {
      return Promise.resolve(true);
    }

    const { req } = this.getRequestResponse(context);
    if (!req) {
      return Promise.resolve(false);
    }

    const path = (req.url || req.path || '').toLowerCase().split('?')[0];

    // Excluded standard endpoints
    const isExemptRoute =
      path.startsWith('/health') ||
      path.startsWith('/docs') ||
      path.startsWith('/api/docs') ||
      path.startsWith('/uploads') ||
      path.includes('favicon.ico') ||
      path.includes('webhook') ||
      path.includes('sslcommerz/ipn');

    return Promise.resolve(isExemptRoute);
  }

  /**
   * Core request activation and rate limit enforcement.
   */
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }
    if (await this.shouldSkip(context)) {
      return true;
    }

    const handler = context.getHandler();
    const classRef = context.getClass();
    const { req, res } = this.getRequestResponse(context);

    // 1. Resolve effective tier & configuration
    const { tier, config } = this.resolveTierAndConfig(
      context,
      req,
      handler,
      classRef,
    );

    if (tier === ApiRateLimitTier.EXEMPT || config.limit <= 0) {
      return true;
    }

    // 2. Build unique client tracking key
    const tracker = await this.getTracker(req);
    const key = this.generateRateLimitKey(context, tracker, tier);

    const ttl = config.ttl;
    const limit = config.limit;
    const blockDuration = config.blockDuration || ttl;

    // 3. Storage increment & check
    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } =
      await this.storageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        tier.toLowerCase(),
      );

    const remaining = Math.max(0, limit - totalHits);
    const resetSeconds = Math.ceil(timeToExpire / 1000);

    // 4. Set standard rate limit headers
    if (res && typeof res.header === 'function') {
      res.header(`${this.headerPrefix}-Limit`, limit.toString());
      res.header(`${this.headerPrefix}-Remaining`, remaining.toString());
      res.header(`${this.headerPrefix}-Reset`, resetSeconds.toString());
      res.header(`${this.headerPrefix}-Tier`, tier);
    }

    // 5. Handle rate limit exceeded
    if (isBlocked) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(timeToBlockExpire / 1000),
      );
      if (res && typeof res.header === 'function') {
        res.header('Retry-After', retryAfterSeconds.toString());
      }

      this.appLogger.warn(
        `Rate limit exceeded: [${tier}] ${req.method} ${req.url} - Client: ${tracker} - Blocked for ${retryAfterSeconds}s`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `API rate limit exceeded for [${tier}] tier. Limit: ${limit} requests per ${Math.round(ttl / 1000)}s. Please retry in ${retryAfterSeconds} seconds.`,
          tier,
          limit,
          windowSeconds: Math.round(ttl / 1000),
          retryAfter: retryAfterSeconds,
          path: req.url,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Resolve client tracker based on Client IP and Authenticated User ID.
   */
  protected override getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'];
    let ip = '';

    if (forwarded) {
      ip =
        typeof forwarded === 'string'
          ? forwarded.split(',')[0].trim()
          : forwarded[0];
    }

    if (!ip) {
      ip =
        req.headers?.['x-real-ip'] ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1';
    }

    const userId = req.user?.id;
    return Promise.resolve(userId ? `${ip}#usr_${userId}` : `${ip}#anon`);
  }

  /**
   * Generate a namespaced cache key for the rate limiter.
   */
  private generateRateLimitKey(
    context: ExecutionContext,
    tracker: string,
    tier: string,
  ): string {
    const className = context.getClass()?.name || 'Global';
    const handlerName = context.getHandler()?.name || 'handler';
    return `rl:${tier}:${className}:${handlerName}:${tracker}`;
  }

  /**
   * Resolve the active rate limit tier and configuration based on metadata and route heuristics.
   */
  private resolveTierAndConfig(
    context: ExecutionContext,
    req: Record<string, any>,
    handler: any,
    classRef: any,
  ): { tier: ApiRateLimitTier; config: RateLimitTierConfig } {
    // Check custom options decorator (@ApiRateLimit)
    const customOptions =
      this.reflector.getAllAndOverride<CustomRateLimitOptions>(
        RATE_LIMIT_CUSTOM_KEY,
        [handler, classRef],
      );

    if (customOptions) {
      if (customOptions.skip) {
        return { tier: ApiRateLimitTier.EXEMPT, config: { ttl: 0, limit: 0 } };
      }
      const tier = customOptions.tier || ApiRateLimitTier.STANDARD;
      const baseConfig = DEFAULT_RATE_LIMIT_CONFIGS[tier];
      return {
        tier,
        config: {
          ttl: customOptions.ttl ?? baseConfig.ttl,
          limit: customOptions.limit ?? baseConfig.limit,
          blockDuration: customOptions.ttl ?? baseConfig.blockDuration,
        },
      };
    }

    // Check explicit tier decorator (@RateLimitTier)
    const explicitTier = this.reflector.getAllAndOverride<ApiRateLimitTier>(
      RATE_LIMIT_TIER_KEY,
      [handler, classRef],
    );

    if (explicitTier && DEFAULT_RATE_LIMIT_CONFIGS[explicitTier]) {
      return {
        tier: explicitTier,
        config: { ...DEFAULT_RATE_LIMIT_CONFIGS[explicitTier] },
      };
    }

    // Fallback: Dynamic heuristic matching based on route path & user role
    const dynamicTier = this.inferTierFromRouteAndUser(context, req);
    return {
      tier: dynamicTier,
      config: { ...DEFAULT_RATE_LIMIT_CONFIGS[dynamicTier] },
    };
  }

  /**
   * Heuristic analysis of request URL and authenticated session.
   */
  private inferTierFromRouteAndUser(
    context: ExecutionContext,
    req: Record<string, any>,
  ): ApiRateLimitTier {
    const rawUrl = (req.url || req.path || '').toLowerCase().split('?')[0];

    // 1. Auth routes (Strict protection against brute-force)
    if (
      rawUrl.includes('/auth/login') ||
      rawUrl.includes('/auth/register') ||
      rawUrl.includes('/auth/forgot-password') ||
      rawUrl.includes('/auth/reset-password') ||
      rawUrl.includes('/auth/refresh') ||
      rawUrl.includes('/auth/google')
    ) {
      return ApiRateLimitTier.AUTH;
    }

    // 2. Financial / Payment / Refund operations
    if (
      rawUrl.includes('/payments') ||
      rawUrl.includes('/refund') ||
      rawUrl.includes('/checkout') ||
      rawUrl.includes('/billing/transactions')
    ) {
      return ApiRateLimitTier.PAYMENT;
    }

    // 3. Real-time messaging & chat
    if (rawUrl.startsWith('/chat') || rawUrl.includes('/conversations')) {
      return ApiRateLimitTier.CHAT;
    }

    // 4. File uploads
    if (rawUrl.includes('/upload') || rawUrl.includes('/attachments')) {
      return ApiRateLimitTier.UPLOAD;
    }

    // 5. Search queries
    if (rawUrl.includes('/search') || rawUrl.includes('/filter')) {
      return ApiRateLimitTier.SEARCH;
    }

    // 6. User role-based differentiation
    const userRole = req.user?.role;
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      return ApiRateLimitTier.ADMIN;
    }

    // 7. Authenticated user operations
    if (req.user?.id) {
      return ApiRateLimitTier.STANDARD;
    }

    // 8. Public endpoint decorator check
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || rawUrl.startsWith('/public')) {
      return ApiRateLimitTier.PUBLIC;
    }

    return ApiRateLimitTier.STANDARD;
  }
}
