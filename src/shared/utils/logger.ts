/**
 * Logging utility for consistent console output
 *
 * Log levels:
 * - debug: Development only, detailed debugging info
 * - info: Development only, general information
 * - warn: Always shown, potential issues
 * - error: Always shown, errors and exceptions
 *
 * Production builds suppress debug/info by default.
 * Set VITE_DEBUG_LOGS=true in .env to enable verbose logging in production.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_PREFIX = '[TW]';

/**
 * Determine if debug logging is enabled:
 * - Always enabled in development mode (import.meta.env.DEV)
 * - Can be explicitly enabled in production via VITE_DEBUG_LOGS=true
 */
const isDebugEnabled = (): boolean => {
  // Check for Vite's DEV mode (true during `npm run dev`, false in production builds)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.DEV) return true;
    if (import.meta.env.VITE_DEBUG_LOGS === 'true') return true;
  }
  return false;
};

const DEBUG_ENABLED = isDebugEnabled();

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, ...args: unknown[]): void {
    const prefix = `${LOG_PREFIX} [${this.context}]`;

    switch (level) {
      case 'debug':
        // Debug logs only in development or when explicitly enabled
        if (DEBUG_ENABLED) {
          console.log(prefix, ...args);
        }
        break;
      case 'info':
        // Info logs only in development or when explicitly enabled
        if (DEBUG_ENABLED) {
          console.log(prefix, ...args);
        }
        break;
      case 'warn':
        // Warnings always shown
        console.warn(prefix, ...args);
        break;
      case 'error':
        // Errors always shown
        console.error(prefix, ...args);
        break;
    }
  }

  debug(...args: unknown[]): void {
    this.log('debug', ...args);
  }

  info(...args: unknown[]): void {
    this.log('info', ...args);
  }

  warn(...args: unknown[]): void {
    this.log('warn', ...args);
  }

  error(...args: unknown[]): void {
    this.log('error', ...args);
  }
}

// Factory function
export const createLogger = (context: string): Logger => new Logger(context);

// Export debug state for testing
export const isLoggingEnabled = (): boolean => DEBUG_ENABLED;
