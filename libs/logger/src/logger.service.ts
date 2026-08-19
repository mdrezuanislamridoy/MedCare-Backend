import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  log(message: string, context?: string) {
    console.log(
      `[${new Date().toISOString()}] [INFO] [${context || 'App'}] ${message}`,
    );
  }

  error(message: string, trace?: string, context?: string) {
    console.error(
      `[${new Date().toISOString()}] [ERROR] [${context || 'App'}] ${message}`,
      trace,
    );
  }

  warn(message: string, context?: string) {
    console.warn(
      `[${new Date().toISOString()}] [WARN] [${context || 'App'}] ${message}`,
    );
  }

  debug(message: string, context?: string) {
    console.debug(
      `[${new Date().toISOString()}] [DEBUG] [${context || 'App'}] ${message}`,
    );
  }
}
