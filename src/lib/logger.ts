/**
 * Enhanced logging utility with context information
 */

interface LogContext {
  endpoint?: string;
  userId?: string;
  playerId?: string;
  matchdayId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Formats an error object for logging
 */
function formatError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

/**
 * Logs an error with additional context
 */
export function logError(message: string, error: unknown, context?: LogContext): void {
  const errorInfo = formatError(error);
  const logData = {
    message,
    error: errorInfo.message,
    stack: errorInfo.stack,
    timestamp: new Date().toISOString(),
    ...context,
  };

  console.error(JSON.stringify(logData, null, 2));
}

/**
 * Logs an informational message with context
 */
export function logInfo(message: string, context?: LogContext): void {
  const logData = {
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  console.log(JSON.stringify(logData, null, 2));
}

/**
 * Logs a warning message with context
 */
export function logWarning(message: string, context?: LogContext): void {
  const logData = {
    level: 'warning',
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  console.warn(JSON.stringify(logData, null, 2));
}
