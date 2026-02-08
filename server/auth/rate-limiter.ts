import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { loginAttempts } from '@shared/schema';
import { and, gte, eq, sql } from 'drizzle-orm';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxAttempts: number;   // Max attempts allowed in window
  identifier: (req: Request) => string;  // How to identify the requester
}

/**
 * Creates a rate limiting middleware that tracks attempts in the database
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = config.identifier(req);
      const windowStart = new Date(Date.now() - config.windowMs);

      // Count recent attempts for this identifier
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(loginAttempts)
        .where(
          and(
            eq(loginAttempts.identifier, identifier),
            gte(loginAttempts.createdAt, windowStart)
          )
        );

      const attemptCount = result[0]?.count || 0;

      if (attemptCount >= config.maxAttempts) {
        const retryAfterSeconds = Math.ceil(config.windowMs / 1000);
        res.set('Retry-After', retryAfterSeconds.toString());
        return res.status(429).json({
          message: 'Too many attempts. Please try again later.',
          retryAfter: retryAfterSeconds
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block the request if rate limiting fails
      next();
    }
  };
}

/**
 * Record a login attempt (successful or failed)
 */
export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
  ipAddress?: string
): Promise<void> {
  try {
    await db.insert(loginAttempts).values({
      identifier,
      success,
      ipAddress,
    });
  } catch (error) {
    console.error('Failed to record login attempt:', error);
  }
}

/**
 * Clean up old login attempts (call periodically to keep table small)
 */
export async function cleanupOldAttempts(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - maxAgeMs);
    await db.delete(loginAttempts).where(
      sql`${loginAttempts.createdAt} < ${cutoff}`
    );
  } catch (error) {
    console.error('Failed to cleanup old login attempts:', error);
  }
}

// Pre-configured rate limiters
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  identifier: (req) => req.body.username || req.ip || 'unknown'
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3,
  identifier: (req) => req.body.email || req.ip || 'unknown'
});
