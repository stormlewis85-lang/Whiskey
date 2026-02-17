/**
 * Structured logger utility.
 * Provides a single point to swap in pino/winston later without touching every file.
 * Adds log level prefixes and timestamps for production debugging.
 */
function formatMessage(level: string, msg: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${msg}`;
}

const logger = {
  info(msg: string, ...args: unknown[]) {
    console.log(formatMessage("INFO", msg), ...args);
  },
  warn(msg: string, ...args: unknown[]) {
    console.warn(formatMessage("WARN", msg), ...args);
  },
  error(msg: string, ...args: unknown[]) {
    console.error(formatMessage("ERROR", msg), ...args);
  },
};

export default logger;
