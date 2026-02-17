import { Request, Response } from 'express';
import { db } from '../db';
import { users, oauthProviders } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import logger from '../lib/logger';
import { encrypt } from '../lib/crypto';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Check if Google OAuth is configured
 */
export function isGoogleOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
  );
}

/**
 * Generate a secure state parameter for CSRF protection
 */
function generateState(): string {
  return nanoid(32);
}

/**
 * Generate a unique username from Google profile
 */
async function generateUniqueUsername(name: string): Promise<string> {
  // Create base username from name (lowercase, alphanumeric only)
  let baseUsername = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  if (!baseUsername) {
    baseUsername = 'user';
  }

  // Check if username exists and append number if needed
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));

    if (!existing) {
      return username;
    }

    username = `${baseUsername}${counter}`;
    counter++;

    // Safety limit
    if (counter > 1000) {
      return `${baseUsername}${Date.now()}`;
    }
  }
}

/**
 * Find user by OAuth provider
 */
async function findUserByOAuth(provider: string, providerUserId: string) {
  const [result] = await db
    .select({
      user: users,
      oauth: oauthProviders,
    })
    .from(oauthProviders)
    .innerJoin(users, eq(oauthProviders.userId, users.id))
    .where(
      and(
        eq(oauthProviders.provider, provider),
        eq(oauthProviders.providerUserId, providerUserId)
      )
    );

  return result?.user;
}

/**
 * Find user by email
 */
async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return user;
}

/**
 * Link OAuth provider to existing user
 */
async function linkOAuthProvider(
  userId: number,
  provider: string,
  providerUserId: string,
  providerEmail: string | undefined,
  accessToken: string,
  refreshToken?: string
) {
  await db.insert(oauthProviders).values({
    userId,
    provider,
    providerUserId,
    providerEmail,
    accessToken: encrypt(accessToken),
    refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
  });
}

/**
 * Create new user from OAuth
 */
async function createUserFromOAuth(
  googleUser: GoogleUserInfo,
  accessToken: string,
  refreshToken?: string
) {
  const username = await generateUniqueUsername(googleUser.name);

  // Create the user (no password for OAuth users)
  const [newUser] = await db
    .insert(users)
    .values({
      username,
      password: null, // OAuth users don't have passwords
      email: googleUser.email,
      displayName: googleUser.name,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      profileImage: googleUser.picture,
      emailVerified: googleUser.verified_email,
    })
    .returning();

  // Link the OAuth provider
  await linkOAuthProvider(
    newUser.id,
    'google',
    googleUser.id,
    googleUser.email,
    accessToken,
    refreshToken
  );

  return newUser;
}

/**
 * Initiate Google OAuth flow
 */
export async function initiateGoogleAuth(req: Request, res: Response) {
  if (!isGoogleOAuthConfigured()) {
    return res.status(503).json({ message: 'Google OAuth is not configured' });
  }

  const state = generateState();

  // Store state in session for verification
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'email profile',
    state,
    prompt: 'select_account', // Always show account selector
  });

  // Save session before redirect
  req.session.save((err) => {
    if (err) {
      logger.error('Failed to save session before OAuth redirect:', err);
      return res.status(500).json({ message: 'Failed to initiate OAuth' });
    }

    const authUrl = `${GOOGLE_AUTH_URL}?${params}`;
    res.redirect(authUrl);
  });
}

/**
 * Handle Google OAuth callback
 */
export async function handleGoogleCallback(req: Request, res: Response) {
  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    logger.error('Google OAuth error:', error);
    return res.redirect('/auth?error=oauth_denied');
  }

  // Verify state to prevent CSRF
  if (!state || state !== req.session.oauthState) {
    logger.error('OAuth state mismatch');
    return res.redirect('/auth?error=invalid_state');
  }

  // Clear the state
  delete req.session.oauthState;

  if (!code) {
    return res.redirect('/auth?error=no_code');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      logger.error('Failed to exchange code for tokens:', errorData);
      return res.redirect('/auth?error=token_exchange_failed');
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      logger.error('Failed to fetch user info from Google');
      return res.redirect('/auth?error=userinfo_failed');
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();
    logger.info(`Google OAuth: ${googleUser.email} (${googleUser.id})`);

    // Find or create user
    let user = await findUserByOAuth('google', googleUser.id);

    if (!user) {
      // Check if email exists (link to existing account)
      const existingUser = await findUserByEmail(googleUser.email);

      if (existingUser) {
        // Link Google to existing account
        await linkOAuthProvider(
          existingUser.id,
          'google',
          googleUser.id,
          googleUser.email,
          tokens.access_token,
          tokens.refresh_token
        );

        // Update email verification status if Google email is verified
        if (googleUser.verified_email) {
          await db
            .update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, existingUser.id));
        }

        user = existingUser;
        logger.info(`Linked Google account to existing user: ${user.username}`);
      } else {
        // Create new user
        user = await createUserFromOAuth(
          googleUser,
          tokens.access_token,
          tokens.refresh_token
        );
        logger.info(`Created new user from Google OAuth: ${user.username}`);
      }
    }

    // Establish session
    req.session.userId = user.id;

    // Save session and redirect
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session after OAuth:', err);
        return res.redirect('/auth?error=session_failed');
      }

      logger.info(`Google OAuth login successful: ${user!.username} (ID: ${user!.id})`);

      // Redirect to home or callback page
      res.redirect('/');
    });
  } catch (error) {
    logger.error('Google OAuth callback error:', error);
    res.redirect('/auth?error=oauth_failed');
  }
}

/**
 * Get OAuth status for current user (which providers are linked)
 */
export async function getOAuthStatus(userId: number): Promise<{ google: boolean }> {
  const linkedProviders = await db
    .select({ provider: oauthProviders.provider })
    .from(oauthProviders)
    .where(eq(oauthProviders.userId, userId));

  const providers = linkedProviders.map((p) => p.provider);

  return {
    google: providers.includes('google'),
  };
}

/**
 * Unlink OAuth provider from user account
 */
export async function unlinkOAuthProvider(
  userId: number,
  provider: string
): Promise<{ success: boolean; message: string }> {
  // Check if user has a password (can't unlink if no password)
  const [user] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.password) {
    // Check if this is the only OAuth provider
    const linkedProviders = await db
      .select({ provider: oauthProviders.provider })
      .from(oauthProviders)
      .where(eq(oauthProviders.userId, userId));

    if (linkedProviders.length <= 1) {
      return {
        success: false,
        message: 'Cannot unlink the only login method. Add a password first.',
      };
    }
  }

  // Delete the OAuth link
  await db
    .delete(oauthProviders)
    .where(
      and(
        eq(oauthProviders.userId, userId),
        eq(oauthProviders.provider, provider)
      )
    );

  return { success: true, message: 'Provider unlinked successfully' };
}
