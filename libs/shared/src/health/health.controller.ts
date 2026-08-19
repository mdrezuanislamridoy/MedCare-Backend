import { Controller, Get } from '@nestjs/common';
import { Public } from '@medcare/auth';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      service: process.env.APP_NAME || 'medcare-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    };
  }

  @Public()
  @Get('ready')
  readiness() {
    // Could be extended to check DB connectivity, Redis, etc.
    return {
      status: 'ready',
      service: process.env.APP_NAME || 'medcare-service',
      timestamp: new Date().toISOString(),
    };
  }
}
