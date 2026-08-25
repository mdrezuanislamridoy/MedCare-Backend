import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorage } from '@nestjs/throttler';
import { AppThrottlerGuard } from './throttle.guard';
import { ApiRateLimitTier, DEFAULT_RATE_LIMIT_CONFIGS } from './rate-limit.types';
import {
  RATE_LIMIT_CUSTOM_KEY,
  RATE_LIMIT_SKIP_KEY,
  RATE_LIMIT_TIER_KEY,
} from '../decorators/rate-limit.decorator';

describe('AppThrottlerGuard', () => {
  let guard: AppThrottlerGuard;
  let reflector: Reflector;
  let mockStorage: jest.Mocked<ThrottlerStorage>;

  const createMockExecutionContext = (
    reqOptions: {
      url?: string;
      method?: string;
      ip?: string;
      headers?: Record<string, string>;
      user?: any;
    } = {},
  ) => {
    const headers: Record<string, string> = {};
    const req = {
      url: reqOptions.url || '/api/test',
      method: reqOptions.method || 'GET',
      ip: reqOptions.ip || '192.168.1.1',
      headers: reqOptions.headers || {},
      user: reqOptions.user,
    };

    const res = {
      header: jest.fn((name: string, value: any) => {
        headers[name] = value;
      }),
      headers,
    };

    const handler = function testHandler() {};
    class TestController {}

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
      getHandler: () => handler,
      getClass: () => TestController,
    } as unknown as ExecutionContext;

    return { context, req, res, handler, controller: TestController };
  };

  beforeEach(() => {
    reflector = new Reflector();
    mockStorage = {
      increment: jest.fn().mockResolvedValue({
        totalHits: 1,
        timeToExpire: 60000,
        isBlocked: false,
        timeToBlockExpire: 0,
      }),
    } as unknown as jest.Mocked<ThrottlerStorage>;

    guard = new AppThrottlerGuard(
      { throttlers: [{ ttl: 60000, limit: 100 }] },
      mockStorage,
      reflector,
    );
  });

  describe('Exemptions & Skip', () => {
    it('should skip health endpoints without hitting storage', async () => {
      const { context } = createMockExecutionContext({ url: '/health' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockStorage.increment).not.toHaveBeenCalled();
    });

    it('should skip swagger doc endpoints', async () => {
      const { context } = createMockExecutionContext({ url: '/api/docs' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockStorage.increment).not.toHaveBeenCalled();
    });

    it('should skip when @SkipRateLimit is applied', async () => {
      const { context } = createMockExecutionContext({ url: '/auth/login' });
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === RATE_LIMIT_SKIP_KEY) return true;
        return undefined;
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(mockStorage.increment).not.toHaveBeenCalled();
    });
  });

  describe('Tier Determination & Rate Limiting Enforcement', () => {
    it('should dynamically infer AUTH tier for /auth/login with limit 10', async () => {
      const { context, res } = createMockExecutionContext({ url: '/auth/login' });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockStorage.increment).toHaveBeenCalledWith(
        expect.stringContaining('AUTH'),
        60000,
        10,
        60000,
        'auth',
      );
      expect(res.header).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(res.header).toHaveBeenCalledWith('X-RateLimit-Tier', 'AUTH');
    });

    it('should dynamically infer PAYMENT tier for /patients/payments/initiate with limit 15', async () => {
      const { context, res } = createMockExecutionContext({
        url: '/patients/payments/initiate',
      });
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockStorage.increment).toHaveBeenCalledWith(
        expect.stringContaining('PAYMENT'),
        60000,
        15,
        60000,
        'payment',
      );
      expect(res.header).toHaveBeenCalledWith('X-RateLimit-Limit', '15');
      expect(res.header).toHaveBeenCalledWith('X-RateLimit-Tier', 'PAYMENT');
    });

    it('should respect explicit @RateLimitTier decorator', async () => {
      const { context, res } = createMockExecutionContext({ url: '/custom/route' });
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === RATE_LIMIT_TIER_KEY) return ApiRateLimitTier.ADMIN;
        return undefined;
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(mockStorage.increment).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN'),
        DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.ADMIN].ttl,
        DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.ADMIN].limit,
        DEFAULT_RATE_LIMIT_CONFIGS[ApiRateLimitTier.ADMIN].blockDuration,
        'admin',
      );
      expect(res.header).toHaveBeenCalledWith('X-RateLimit-Tier', 'ADMIN');
    });

    it('should respect custom @ApiRateLimit options', async () => {
      const { context, res } = createMockExecutionContext({ url: '/custom-limit' });
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === RATE_LIMIT_CUSTOM_KEY) return { limit: 5, ttl: 30000 };
        return undefined;
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(mockStorage.increment).toHaveBeenCalledWith(
        expect.any(String),
        30000,
        5,
        30000,
        expect.any(String),
      );
      expect(res.header).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    });
  });

  describe('Rate Limit Exceeded (429)', () => {
    it('should throw HttpException 429 and set Retry-After when rate limit is exceeded', async () => {
      mockStorage.increment.mockResolvedValueOnce({
        totalHits: 11,
        timeToExpire: 45000,
        isBlocked: true,
        timeToBlockExpire: 45000,
      });

      const { context, res } = createMockExecutionContext({ url: '/auth/login' });

      try {
        await guard.canActivate(context);
        fail('Expected guard to throw HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);

        const body: any = httpError.getResponse();
        expect(body.statusCode).toBe(429);
        expect(body.tier).toBe('AUTH');
        expect(body.limit).toBe(10);
        expect(body.retryAfter).toBe(45);
        expect(res.header).toHaveBeenCalledWith('Retry-After', '45');
      }
    });
  });

  describe('Tracker & IP Resolution', () => {
    it('should build composite tracker using forwarded IP and User ID when authenticated', async () => {
      const { context } = createMockExecutionContext({
        url: '/patients/appointments',
        headers: { 'x-forwarded-for': '203.0.113.195, 10.0.0.1' },
        user: { id: 'usr_pat_99', role: 'PATIENT' },
      });

      await guard.canActivate(context);
      expect(mockStorage.increment).toHaveBeenCalledWith(
        expect.stringContaining('203.0.113.195#usr_usr_pat_99'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Number),
        expect.any(String),
      );
    });
  });
});
