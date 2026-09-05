import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';

@Injectable()
export class KeepAliveService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(KeepAliveService.name);
  private timer: NodeJS.Timeout | null = null;
  private pingCount = 0;
  private lastPingAt: Date | null = null;
  private lastStatus = 'pending';

  // 5 minutes default (300,000 ms)
  private readonly intervalMs =
    Number(process.env.PING_INTERVAL_MS) || 5 * 60 * 1000;

  private get targetUrl(): string {
    const rawUrl =
      process.env.PING_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      'https://medcare-backend-nzmq.onrender.com';
    return rawUrl.replace(/\/+$/, '');
  }

  onApplicationBootstrap() {
    // Only run if not disabled
    if (process.env.DISABLE_KEEP_ALIVE === 'true') {
      this.logger.log('Keep-alive cron is disabled via DISABLE_KEEP_ALIVE.');
      return;
    }

    this.logger.log(
      `⏰ Keep-alive cron initialized. Target: ${this.targetUrl}/health every ${
        this.intervalMs / 60000
      } mins.`,
    );

    // Initial ping after 30 seconds of startup
    setTimeout(() => this.performPing(), 30000);

    // Recurring ping every 5 minutes
    this.timer = setInterval(() => this.performPing(), this.intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async performPing(): Promise<{
    success: boolean;
    status: number | string;
    url: string;
    durationMs: number;
  }> {
    const url = `${this.targetUrl}/health`;
    const start = Date.now();
    this.pingCount++;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'MedCare-KeepAlive-Cron/1.0',
          'Cache-Control': 'no-cache',
        },
      });

      const durationMs = Date.now() - start;
      this.lastPingAt = new Date();
      this.lastStatus = `${response.status} ${response.statusText}`;

      this.logger.log(
        `⏱️ [Cron Ping #${this.pingCount}] ${url} -> ${response.status} (${durationMs}ms)`,
      );

      return {
        success: response.ok,
        status: response.status,
        url,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - start;
      this.lastPingAt = new Date();
      this.lastStatus = `Error: ${err.message}`;

      this.logger.warn(
        `⚠️ [Cron Ping #${this.pingCount}] Failed to ping ${url} (${durationMs}ms): ${err.message}`,
      );

      return {
        success: false,
        status: err.message,
        url,
        durationMs,
      };
    }
  }

  getStatus() {
    return {
      enabled: process.env.DISABLE_KEEP_ALIVE !== 'true',
      intervalMinutes: this.intervalMs / 60000,
      targetUrl: `${this.targetUrl}/health`,
      totalPings: this.pingCount,
      lastPingAt: this.lastPingAt,
      lastStatus: this.lastStatus,
    };
  }
}
