import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Check if an account is currently locked
 */
export async function isAccountLocked(userId: number): Promise<boolean> {
  const [user] = await db
    .select({
      accountLockedUntil: users.accountLockedUntil,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return false;

  if (user.accountLockedUntil) {
    if (user.accountLockedUntil > new Date()) {
      return true; // Still locked
    }
    // Lockout expired, unlock the account
    await unlockAccount(userId);
  }

  return false;
}

/**
 * Get remaining lockout time in seconds
 */
export async function getLockoutRemainingSeconds(userId: number): Promise<number> {
  const [user] = await db
    .select({
      accountLockedUntil: users.accountLockedUntil,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.accountLockedUntil) return 0;

  const remaining = user.accountLockedUntil.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Handle a failed login attempt - increment counter and maybe lock account
 */
export async function handleFailedLogin(userId: number): Promise<{ locked: boolean; remainingAttempts: number }> {
  const [user] = await db
    .select({
      failedLoginAttempts: users.failedLoginAttempts,
    })
    .from(users)
    .where(eq(users.id, userId));

  const currentAttempts = (user?.failedLoginAttempts || 0) + 1;

  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    // Lock the account
    const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    await db
      .update(users)
      .set({
        failedLoginAttempts: currentAttempts,
        accountLockedUntil: lockUntil,
      })
      .where(eq(users.id, userId));

    return { locked: true, remainingAttempts: 0 };
  }

  // Increment failed attempts
  await db
    .update(users)
    .set({
      failedLoginAttempts: currentAttempts,
    })
    .where(eq(users.id, userId));

  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - currentAttempts };
}

/**
 * Handle a successful login - reset failed attempts counter
 */
export async function handleSuccessfulLogin(userId: number): Promise<void> {
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Unlock an account (admin function or after lockout expires)
 */
export async function unlockAccount(userId: number): Promise<void> {
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    })
    .where(eq(users.id, userId));
}

/**
 * Get account security status
 */
export async function getAccountSecurityStatus(userId: number): Promise<{
  failedAttempts: number;
  isLocked: boolean;
  lockedUntil: Date | null;
}> {
  const [user] = await db
    .select({
      failedLoginAttempts: users.failedLoginAttempts,
      accountLockedUntil: users.accountLockedUntil,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    return { failedAttempts: 0, isLocked: false, lockedUntil: null };
  }

  const isLocked = user.accountLockedUntil ? user.accountLockedUntil > new Date() : false;

  return {
    failedAttempts: user.failedLoginAttempts || 0,
    isLocked,
    lockedUntil: isLocked ? user.accountLockedUntil : null,
  };
}
