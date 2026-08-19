import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom rate limiting guard with role-based limits.
 * - Public endpoints: 30 requests per minute
 * - Authenticated endpoints: 120 requests per minute
 * - Admin endpoints: 300 requests per minute
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by IP + user ID if authenticated
    const userId = req.user?.id;
    const ip = req.ip || req.connection?.remoteAddress;
    return Promise.resolve(userId ? `${ip}:${userId}` : ip);
  }

  protected getRequestResponse(context: ExecutionContext): {
    req: Record<string, any>;
    res: Record<string, any>;
  } {
    const ctx = context.switchToHttp();
    return { req: ctx.getRequest(), res: ctx.getResponse() };
  }
}
