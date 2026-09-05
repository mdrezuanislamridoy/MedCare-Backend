import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      const errorMsg =
        exception instanceof Error ? exception.message : String(exception);
      this.logger.error(
        `[RPC Exception] ${errorMsg}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!response || typeof response.status !== 'function') {
      throw exception;
    }
    const correlationId = request['correlationId'] || '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const respMsg = (exceptionResponse as any).message;
        if (Array.isArray(respMsg)) {
          errors = respMsg;
          message = respMsg.join(', ');
        } else if (typeof respMsg === 'string') {
          message = respMsg;
        } else {
          message = (exceptionResponse as any).error || message;
        }
        errors = errors || (exceptionResponse as any).errors;
      }
    } else if (typeof (exception as any)?.details === 'string') {
      message = (exception as any).details;
    } else if (typeof (exception as any)?.error === 'string') {
      message = (exception as any).error;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...(correlationId && { correlationId }),
    };

    // Log internal server errors with stack trace
    if (Number(status) >= 500) {
      this.logger.error(
        `[${correlationId || 'no-corr'}] ${request.method} ${request.url} ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${correlationId || 'no-corr'}] ${request.method} ${request.url} ${status} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
