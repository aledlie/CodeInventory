/**
 * Dashboard Logger Utility
 *
 * Provides structured logging for the dashboard feature with consistent formatting.
 * Designed to be easily extended with Sentry integration when needed.
 *
 * Usage:
 *   import { logger } from '@/features/dashboard/helpers/logger';
 *   logger.info('dashboardApi', 'Loaded quality report', { issues: 10 });
 *   logger.error('dashboardApi', 'Failed to load report', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Set minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = import.meta.env.DEV ? 'debug' : 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatMessage(context: string, message: string): string {
  return `[${context}] ${message}`;
}

/**
 * Structured logger for dashboard feature
 */
export const logger = {
  /**
   * Log debug message (only in development)
   */
  debug(context: string, message: string, metadata?: LogMetadata): void {
    if (shouldLog('debug')) {
      if (metadata) {
        console.debug(formatMessage(context, message), metadata);
      } else {
        console.debug(formatMessage(context, message));
      }
    }
  },

  /**
   * Log info message
   */
  info(context: string, message: string, metadata?: LogMetadata): void {
    if (shouldLog('info')) {
      if (metadata) {
        console.info(formatMessage(context, message), metadata);
      } else {
        console.info(formatMessage(context, message));
      }
    }
  },

  /**
   * Log warning message
   */
  warn(context: string, message: string, metadata?: LogMetadata): void {
    if (shouldLog('warn')) {
      if (metadata) {
        console.warn(formatMessage(context, message), metadata);
      } else {
        console.warn(formatMessage(context, message));
      }
    }
  },

  /**
   * Log error message
   * In production, this would also send to Sentry
   */
  error(context: string, message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    if (shouldLog('error')) {
      const formattedMessage = formatMessage(context, message);
      if (error && metadata) {
        console.error(formattedMessage, error, metadata);
      } else if (error) {
        console.error(formattedMessage, error);
      } else if (metadata) {
        console.error(formattedMessage, metadata);
      } else {
        console.error(formattedMessage);
      }

      // TODO: Add Sentry integration when @sentry/react is installed
      // if (import.meta.env.PROD && error instanceof Error) {
      //   Sentry.captureException(error, {
      //     tags: { context },
      //     extra: metadata,
      //   });
      // }
    }
  },
};

export default logger;
