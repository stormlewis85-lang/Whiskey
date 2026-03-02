import logger from "./logger";

/**
 * Safe error handling utility.
 * Logs the real error server-side and returns a generic message to the client.
 * Prevents leaking stack traces, DB errors, or file paths to users.
 */
export function safeError(error: unknown, fallbackMessage = "An error occurred") {
  logger.error(fallbackMessage, error);
  return { message: fallbackMessage };
}

/**
 * Extract HTTP status from error objects that carry a .status property
 * (e.g., errors thrown by getUserId). Defaults to 500.
 */
export function errorStatus(error: unknown): number {
  if (error && typeof error === "object" && "status" in error && typeof (error as any).status === "number") {
    return (error as any).status;
  }
  return 500;
}
