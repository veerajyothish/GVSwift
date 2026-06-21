/**
 * lib/logger.ts — Application logger
 *
 * Thin wrapper over console that adds structured context. In production,
 * errors are also forwarded to Sentry (TICKET-903 wires up Sentry fully).
 *
 * Use logger.error() for errors that should be monitored.
 * Use logger.warn() for degraded-but-recoverable situations.
 * Use logger.info() sparingly — prefer Sentry breadcrumbs for tracing.
 *
 * NEVER log PII (email, phone, user IDs in clear text) — Sentry's beforeSend
 * hook (TICKET-903) strips it, but prevention at source is better.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else if (process.env.NODE_ENV !== "production") {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    log("debug", message, context),
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
};
