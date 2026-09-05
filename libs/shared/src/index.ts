// ==========================================
// @medcare/shared - Enterprise Shared Library
// Guards, Interceptors, Filters, Health, DTOs
// ==========================================

// Guards & Rate Limiting
export * from './guards/throttle.guard';
export * from './guards/rate-limit.types';
export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';

// Decorators
export * from './decorators';

// Types
export * from './types';

// Interceptors
export * from './interceptors/correlation-id.interceptor';
export * from './interceptors/logging.interceptor';
export * from './interceptors/timeout.interceptor';
export * from './interceptors/circuit-breaker.interceptor';

// Filters
export * from './filters/http-exception.filter';

// Health
export * from './health/health.controller';
export * from './health/health.module';

// Database / Prisma Adapter
export * from './prisma/prisma-adapter';

// Module
export * from './shared.module';
