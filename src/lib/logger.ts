/**
 * Centralized logger for the application.
 * Currently wraps console methods, but can be easily extended to use
 * external logging services (e.g., Sentry, Axiom, Datadog) in the future.
 */

type LogFn = (message: unknown, ...args: unknown[]) => void;

interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

export const logger: Logger = {
  info: (message, ...args) => {
    console.info(message, ...args);
  },
  warn: (message, ...args) => {
    console.warn(message, ...args);
  },
  error: (message, ...args) => {
    console.error(message, ...args);
  },
};
