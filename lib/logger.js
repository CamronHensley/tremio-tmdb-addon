/**
 * Structured logging utility for better debugging and monitoring
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];

class Logger {
  constructor(context = 'app') {
    this.context = context;
  }

  /**
   * Format log message with timestamp and context
   */
  format(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      context: this.context,
      message,
      ...data
    };

    // In production, output structured JSON for log aggregation
    // In development, output human-readable format
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logData);
    } else {
      const dataStr = Object.keys(data).length > 0
        ? ' ' + JSON.stringify(data, null, 2)
        : '';
      return `[${timestamp}] [${level}] [${this.context}] ${message}${dataStr}`;
    }
  }

  /**
   * Log error message
   */
  error(message, error = null, data = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
      const logData = { ...data };
      if (error) {
        logData.error = {
          message: error.message,
          stack: error.stack,
          name: error.name
        };
      }
      console.error(this.format('ERROR', message, logData));
    }
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(this.format('WARN', message, data));
    }
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      console.log(this.format('INFO', message, data));
    }
  }

  /**
   * Log debug message
   */
  debug(message, data = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(this.format('DEBUG', message, data));
    }
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    return new Logger(`${this.context}:${additionalContext}`);
  }

  /**
   * Time a function execution
   */
  async time(label, fn) {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, error, { duration_ms: duration });
      throw error;
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(method, url, statusCode, duration, data = {}) {
    this.info('HTTP request', {
      method,
      url,
      statusCode,
      duration_ms: duration,
      ...data
    });
  }

  /**
   * Log TMDB API call
   */
  logTMDBCall(endpoint, params, statusCode, duration, data = {}) {
    this.debug('TMDB API call', {
      endpoint,
      params,
      statusCode,
      duration_ms: duration,
      ...data
    });
  }
}

/**
 * Create a logger instance
 */
function createLogger(context = 'app') {
  return new Logger(context);
}

module.exports = { Logger, createLogger, LOG_LEVELS };
