/**
 * Structured logging utility
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private serviceName: string;
  private environment: string;

  constructor() {
    this.serviceName = 'iqr-shipstation-connector';
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      environment: this.environment,
      message,
      ...context,
    };

    return JSON.stringify(logEntry);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      : context;

    console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (this.environment === 'development') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  // Specialized logging methods for common scenarios
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info('API Request', {
      method,
      url,
      ...context,
    });
  }

  apiResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info('API Response', {
      method,
      url,
      statusCode,
      duration,
      ...context,
    });
  }

  syncStart(syncType: string, context?: LogContext): void {
    this.info(`${syncType} sync started`, context);
  }

  syncComplete(syncType: string, stats: { processed: number; failed: number; duration: number }): void {
    this.info(`${syncType} sync completed`, stats);
  }

  syncError(syncType: string, error: Error, context?: LogContext): void {
    this.error(`${syncType} sync failed`, error, context);
  }
}

export const logger = new Logger();

