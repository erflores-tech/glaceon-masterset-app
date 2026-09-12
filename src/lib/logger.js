/**
 * Severity levels supported by the application logger.
 *
 * @typedef {'debug' | 'info' | 'warn' | 'error'} LogLevel
 */

/**
 * Logger entry payload.
 *
 * @typedef {Object} LogPayload
 * @property {LogLevel} level
 * @property {string} message
 * @property {Error} [error]
 * @property {object} [context]
 * @property {string} timestamp
 */

const LOG_LEVELS = /** @type {const} */ (['debug', 'info', 'warn', 'error'])
const LEVEL_RANK = Object.fromEntries(LOG_LEVELS.map((level, index) => [level, index]))

const DEFAULT_LEVEL = import.meta.env.PROD ? 'warn' : 'debug'
const configuredLevel = (typeof import.meta.env.VITE_LOG_LEVEL === 'string'
  ? import.meta.env.VITE_LOG_LEVEL
  : DEFAULT_LEVEL)

/** @type {LogLevel} */
const currentLevel = LOG_LEVELS.includes(/** @type {any} */ (configuredLevel))
  ? /** @type {LogLevel} */ (configuredLevel)
  : 'info'

/** @type {Array<(entry: LogPayload) => void>} */
const remoteTransports = []

/**
 * Register a remote log transport. Callers may forward structured entries to
 * an analytics or error-tracking service.
 *
 * @param {(entry: LogPayload) => void} transport
 */
export function addRemoteTransport(transport) {
  if (typeof transport !== 'function') return
  remoteTransports.push(transport)
}

/**
 * Forward the log entry to any registered remote transports.
 *
 * @param {LogPayload} entry
 */
function forward(entry) {
  for (const transport of remoteTransports) {
    try {
      transport(entry)
    } catch {
      // Never let a transport failure crash the app.
    }
  }
}

/**
 * Determine whether a message at the given level should be emitted.
 *
 * @param {LogLevel} level
 * @returns {boolean}
 */
function shouldLog(level) {
  return LEVEL_RANK[level] >= LEVEL_RANK[currentLevel]
}

/**
 * Build a consistent log payload.
 *
 * @param {LogLevel} level
 * @param {string} message
 * @param {object} [context]
 * @param {Error} [error]
 * @returns {LogPayload}
 */
function buildPayload(level, message, context, error) {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context !== undefined && Object.keys(context).length > 0 ? { context } : {}),
    ...(error instanceof Error ? { error } : {}),
  }
}

/**
 * Emit a log entry to the console and any registered remote transports.
 *
 * @param {LogPayload} payload
 */
function emit(payload) {
  const { level, message, error, ...rest } = payload
  const args = [message]
  if (Object.keys(rest).length > 0) {
    args.push(rest)
  }
  if (error) {
    args.push(error)
  }

  switch (level) {
    case 'debug':
      console.debug(...args)
      break
    case 'info':
      console.info(...args)
      break
    case 'warn':
      console.warn(...args)
      break
    case 'error':
      console.error(...args)
      break
  }

  forward(payload)
}

/**
 * Application logger. Provides structured logging with level filtering and
 * optional remote forwarding. In production only warnings and errors are
 * emitted by default.
 */
export const logger = {
  /**
   * @param {string} message
   * @param {object} [context]
   */
  debug(message, context) {
    if (!shouldLog('debug')) return
    emit(buildPayload('debug', message, context))
  },

  /**
   * @param {string} message
   * @param {object} [context]
   */
  info(message, context) {
    if (!shouldLog('info')) return
    emit(buildPayload('info', message, context))
  },

  /**
   * @param {string} message
   * @param {object} [context]
   */
  warn(message, context) {
    if (!shouldLog('warn')) return
    emit(buildPayload('warn', message, context))
  },

  /**
   * @param {string} message
   * @param {Error} [error]
   * @param {object} [context]
   */
  error(message, error, context) {
    if (!shouldLog('error')) return
    emit(buildPayload('error', message, context, error))
  },
}
