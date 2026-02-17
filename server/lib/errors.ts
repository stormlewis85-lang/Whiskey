/**
 * Safe error handling utility.
 * Logs the real error server-side and returns a generic message to the client.
 * Prevents leaking stack traces, DB errors, or file paths to users.
 */
export function safeError(error: unknown, fallbackMessage = "An error occurred") {
  console.error(fallbackMessage, error);
  return { message: fallbackMessage };
}
