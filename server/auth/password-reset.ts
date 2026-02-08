import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, passwordResetTokens } from '@shared/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { hashPassword } from '../storage';
import { sendPasswordResetEmail } from '../email/sender';

const TOKEN_EXPIRY_HOURS = 1; // Token valid for 1 hour

/**
 * Request a password reset - generates token and sends email
 * Always returns success to prevent email enumeration attacks
 */
export async function requestPasswordReset(email: string): Promise<void> {
  // Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  // Always return success to prevent email enumeration
  if (!user) {
    console.log(`Password reset requested for unknown email: ${email}`);
    return;
  }

  // Generate secure token
  const token = nanoid(64);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Store the token
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  // Build reset URL
  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  // Send email
  await sendPasswordResetEmail(email, {
    username: user.username,
    resetUrl,
  });

  console.log(`Password reset token created for user: ${user.username}`);
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  userId?: number;
  username?: string;
}> {
  const [resetToken] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
      username: users.username,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(eq(passwordResetTokens.token, token));

  if (!resetToken) {
    return { valid: false };
  }

  // Check if token is already used
  if (resetToken.usedAt) {
    return { valid: false };
  }

  // Check if token is expired
  if (resetToken.expiresAt < new Date()) {
    return { valid: false };
  }

  return {
    valid: true,
    userId: resetToken.userId,
    username: resetToken.username,
  };
}

/**
 * Complete the password reset - set new password and invalidate token
 */
export async function completePasswordReset(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // Validate the token first
  const validation = await validateResetToken(token);

  if (!validation.valid || !validation.userId) {
    return { success: false, message: 'Invalid or expired reset token' };
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  // Update the user's password
  await db
    .update(users)
    .set({
      password: hashedPassword,
      updatedAt: new Date(),
      // Reset failed login attempts when password is reset
      failedLoginAttempts: 0,
      accountLockedUntil: null,
    })
    .where(eq(users.id, validation.userId));

  // Mark the token as used
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token));

  // Invalidate all existing auth tokens for this user (security measure)
  await db
    .update(users)
    .set({
      authToken: null,
      tokenExpiry: null,
    })
    .where(eq(users.id, validation.userId));

  console.log(`Password reset completed for user ID: ${validation.userId}`);

  return { success: true, message: 'Password reset successfully' };
}

/**
 * Cleanup expired and used tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    // Delete tokens that are expired or have been used
    const cutoff = new Date();
    await db
      .delete(passwordResetTokens)
      .where(
        gt(cutoff, passwordResetTokens.expiresAt)
      );

    console.log('Cleaned up expired password reset tokens');
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
}
