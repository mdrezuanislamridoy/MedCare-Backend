import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeepAliveService } from './keep-alive.service';

@ApiTags('Keep-Alive & System Health')
@Controller()
export class KeepAliveController {
  constructor(private readonly keepAliveService: KeepAliveService) {}

  @ApiOperation({ summary: 'Platform root status and entrypoint' })
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'MedCare Healthcare Enterprise Platform',
      version: '1.0.0',
      docs: '/api/docs',
      health: '/health',
      keepAlive: '/keep-alive/status',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: 'Ultra-fast lightweight ping' })
  @Get('ping')
  ping() {
    return { status: 'pong', timestamp: Date.now() };
  }

  @ApiOperation({ summary: 'Get automated 5-minute keep-alive cron status' })
  @Get('keep-alive/status')
  getStatus() {
    return this.keepAliveService.getStatus();
  }

  @ApiOperation({ summary: 'Manually trigger keep-alive ping now' })
  @Post('keep-alive/trigger')
  async triggerPing() {
    return this.keepAliveService.performPing();
  }
}
