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

    // Clean and sanitize raw database or Prisma error strings
    if (typeof message === 'string') {
      if (message.includes('does not exist in the current database')) {
        const tableMatch = message.match(/The table `([^`]+)` does not exist/);
        const tableName = tableMatch ? tableMatch[1] : 'Database table';
        message = `${tableName} is not yet initialized in the database. Please ensure migrations/push have run.`;
      } else if (message.includes('Unique constraint failed')) {
        const fieldMatch = message.match(/fields: \(`?([^`)]+)`?\)/);
        const field = fieldMatch ? fieldMatch[1] : 'value';
        status = HttpStatus.CONFLICT;
        message = `A record with this ${field} already exists.`;
      } else if (message.includes('Record to update not found') || message.includes('Record to delete does not exist')) {
        status = HttpStatus.NOT_FOUND;
        message = 'The requested record was not found.';
      } else if (message.includes("Can't reach database server")) {
        message = 'Database service is currently unreachable. Please check database configuration.';
      } else if (message.includes('ECONNREFUSED')) {
        message = 'The requested microservice is currently starting up or temporarily unavailable.';
      } else if (message.includes('Invalid `prisma.')) {
        // Strip out Prisma stack trace lines and only keep clean text
        const cleanMsg = message.split('\n').filter((l) => l.trim() && !l.includes('-->') && !l.includes('prisma.')).pop();
        if (cleanMsg) {
          message = cleanMsg.trim();
        }
      }
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
