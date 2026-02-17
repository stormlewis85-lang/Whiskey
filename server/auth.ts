import express, { type Request, type Response, type NextFunction } from "express";
import { storage, hashPassword, comparePasswords } from "./storage";
import { loginUserSchema, insertUserSchema, updateUserSchema, registerUserSchema, changePasswordSchema, users } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import { safeError } from "./lib/errors";
import session from "express-session";
import { nanoid } from "nanoid";
import connectPgSimple from "connect-pg-simple";
import { pool, db } from "./db";
import { eq } from "drizzle-orm";
import { loginRateLimiter, passwordResetRateLimiter, registerRateLimiter, recordLoginAttempt } from "./auth/rate-limiter";
import { isAccountLocked, handleFailedLogin, handleSuccessfulLogin, getLockoutRemainingSeconds } from "./auth/account-security";
import { requestPasswordReset, validateResetToken, completePasswordReset } from "./auth/password-reset";
import { forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { initiateGoogleAuth, handleGoogleCallback, isGoogleOAuthConfigured, getOAuthStatus, unlinkOAuthProvider } from "./auth/oauth-google";
import { deleteFromSpaces, getKeyFromUrl, isSpacesConfigured } from "./spaces";
import logger from "./lib/logger";

// Fix TypeScript declaration for SessionData
declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    oauthState?: string; // For OAuth CSRF protection
  }
}

// Create PostgreSQL session store for persistence across deployments
const PgStore = connectPgSimple(session);

// Enhanced authentication middleware with token validation
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // First try session authentication
  if (req.session.userId) {
    try {
      const user = await storage.getUser(req.session.userId);

      if (user) {
        return next();
      } else {
        req.session.destroy(() => {});
        // Fall through to token auth
      }
    } catch {
      // Fall through to token auth
    }
  }

  // Try token-based authentication as a fallback
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Not authenticated - No token provided" });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Not authenticated - Invalid token format" });
    }

    const user = await storage.getUserByToken(token);

    if (!user) {
      return res.status(401).json({ message: "Not authenticated - Invalid token" });
    }

    if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
      return res.status(401).json({ message: "Not authenticated - Token expired" });
    }

    req.session.userId = user.id;

    req.session.save((err) => {
      if (err) {
        // Continue anyway since we have the userId set for this request
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Authentication verification failed" });
  }
}

// Setup authentication and session
export function setupAuth(app: express.Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionSecret = process.env.SESSION_SECRET;

  // In production, SESSION_SECRET is required — refuse to start without it
  if (!sessionSecret && isProduction) {
    throw new Error("SESSION_SECRET environment variable is required in production. Set it in your .env file.");
  }

  if (!sessionSecret) {
    logger.warn("SESSION_SECRET not set - using random secret (sessions lost on restart)");
  }

  // Configure session middleware with PostgreSQL for persistence
  app.use(
    session({
      secret: sessionSecret || nanoid(32),
      resave: false,
      saveUninitialized: false,
      rolling: true, // Extend session expiry on each request
      store: new PgStore({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
      }),
      name: 'whiskeypedia.sid', // Name the cookie for better identification
      proxy: isProduction, // Only trust proxy in production
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
        httpOnly: true,
        secure: isProduction, // Only use secure cookies in production (HTTPS)
        sameSite: "lax",
        path: '/'
      }
    })
  );

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  // User Registration (with password strength validation)
  app.post("/api/register", registerRateLimiter, async (req: Request, res: Response) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (validatedData.email) {
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      const userData = {
        username: validatedData.username,
        password: validatedData.password || '',
        displayName: validatedData.displayName,
        email: validatedData.email,
      };

      const newUser = await storage.createUser(userData);

      req.session.userId = newUser.id;

      try {
        const token = await storage.generateAuthToken(newUser.id);

        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ message: "Session creation failed" });
          }

          const { password, ...userWithoutPassword } = newUser;
          res.status(201).json({
            ...userWithoutPassword,
            token: token
          });
        });
      } catch {
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // User Login (with rate limiting and account lockout)
  app.post("/api/login", loginRateLimiter, async (req: Request, res: Response) => {
    try {
      const credentials = loginUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(credentials.username);

      if (existingUser) {
        const locked = await isAccountLocked(existingUser.id);
        if (locked) {
          const remainingSeconds = await getLockoutRemainingSeconds(existingUser.id);
          const remainingMinutes = Math.ceil(remainingSeconds / 60);

          await recordLoginAttempt(credentials.username, false, req.ip);

          return res.status(423).json({
            message: `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
            lockedUntil: remainingSeconds
          });
        }
      }

      const user = await storage.validateUserCredentials(
        credentials.username,
        credentials.password
      );

      if (!user) {
        await recordLoginAttempt(credentials.username, false, req.ip);

        if (existingUser) {
          const result = await handleFailedLogin(existingUser.id);
          if (result.locked) {
            return res.status(423).json({
              message: "Too many failed attempts. Account temporarily locked for 30 minutes.",
              lockedUntil: 30 * 60
            });
          } else if (result.remainingAttempts <= 2) {
            return res.status(401).json({
              message: `Invalid username or password. ${result.remainingAttempts} attempt${result.remainingAttempts !== 1 ? 's' : ''} remaining before lockout.`
            });
          }
        }

        return res.status(401).json({ message: "Invalid username or password" });
      }

      await handleSuccessfulLogin(user.id);
      await recordLoginAttempt(credentials.username, true, req.ip);

      req.session.userId = user.id;

      try {
        const token = await storage.generateAuthToken(user.id);

        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ message: "Session creation failed" });
          }

          const { password, ...userWithoutPassword } = user;
          res.json({
            ...userWithoutPassword,
            token: token
          });
        });
      } catch {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get Current User
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      logger.info("User authentication check");
      
      // First try session-based auth
      if (req.session.userId) {
        const sessionUser = await storage.getUser(req.session.userId);
        if (sessionUser) {
          logger.info(`Session auth: user ${sessionUser.username} (ID: ${sessionUser.id})`);
          
          // Return user without password
          const { password, ...userWithoutPassword } = sessionUser;
          return res.json(userWithoutPassword);
        } else {
          logger.info(`User not found for session userId ${req.session.userId}`);
          // Clear invalid session
          req.session.destroy((err) => {
            if (err) {
              logger.error("Error destroying invalid session:", err);
            }
          });
          // Continue to try token auth
        }
      }
      
      // Then try token-based auth
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        const tokenUser = await storage.getUserByToken(token);
        if (tokenUser) {
          logger.info(`Token auth: user ${tokenUser.username} (ID: ${tokenUser.id})`);
          
          // Set session for future requests
          req.session.userId = tokenUser.id;
          
          // Return user without password
          const { password, ...userWithoutPassword } = tokenUser;
          return res.json(userWithoutPassword);
        }
      }
      
      // Neither session nor token authentication worked
      logger.info("No valid session or token found, not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      res.status(500).json(safeError(error, "Failed to get user"));
    }
  });

  // Update User Profile
  app.patch("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userData = updateUserSchema.parse(req.body);

      // If email is being changed, require password confirmation
      if (userData.email !== undefined) {
        const { password } = req.body;
        const user = await storage.getUser(req.session.userId!);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (!user.password) {
          return res.status(400).json({
            message: "Cannot verify identity. Please set a password first."
          });
        }

        if (!password) {
          return res.status(400).json({
            message: "Password confirmation required to change email"
          });
        }

        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return res.status(401).json({ message: "Incorrect password" });
        }
      }

      const updatedUser = await storage.updateUser(req.session.userId!, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json(safeError(error, "Failed to update user"));
    }
  });

  // Change password (authenticated users with existing password)
  app.post("/api/user/change-password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.session.userId!;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.password) {
        return res.status(400).json({
          message: "This account uses OAuth login and has no password set."
        });
      }

      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await db.update(users).set({
        password: hashedPassword,
        updatedAt: new Date(),
        authToken: null,
        tokenExpiry: null,
      }).where(eq(users.id, userId));

      logger.info(`Password changed for user ID: ${userId}`);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json(safeError(error, "Failed to change password"));
    }
  });

  // ==================== Password Reset Routes ====================

  // Request password reset (sends email with token)
  app.post("/api/auth/forgot-password", passwordResetRateLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);

      // Process the request (always returns success to prevent email enumeration)
      await requestPasswordReset(email);

      // Always return success message
      res.json({
        message: "If an account exists with that email, a password reset link has been sent."
      });
    } catch (error) {
      logger.error("Password reset request error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Validate password reset token (for frontend to check before showing form)
  app.get("/api/auth/reset-password/validate", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.status(400).json({ valid: false, message: "Token is required" });
      }

      const result = await validateResetToken(token);

      if (result.valid) {
        res.json({ valid: true, username: result.username });
      } else {
        res.json({ valid: false, message: "Invalid or expired token" });
      }
    } catch (error) {
      logger.error("Token validation error:", error);
      res.status(500).json({ valid: false, message: "Failed to validate token" });
    }
  });

  // Complete password reset (set new password)
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);

      const result = await completePasswordReset(token, password);

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      logger.error("Password reset error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ==================== Google OAuth Routes ====================

  // Check if Google OAuth is configured
  app.get("/api/auth/google/status", (req: Request, res: Response) => {
    res.json({ configured: isGoogleOAuthConfigured() });
  });

  // Initiate Google OAuth flow
  app.get("/api/auth/google", initiateGoogleAuth);

  // Handle Google OAuth callback
  app.get("/api/auth/google/callback", handleGoogleCallback);

  // Get OAuth status for current user (which providers are linked)
  app.get("/api/auth/oauth-status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const status = await getOAuthStatus(req.session.userId!);
      res.json(status);
    } catch (error) {
      logger.error("OAuth status error:", error);
      res.status(500).json({ message: "Failed to get OAuth status" });
    }
  });

  // Unlink OAuth provider from account
  app.delete("/api/auth/oauth/:provider", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;

      if (provider !== 'google') {
        return res.status(400).json({ message: "Invalid provider" });
      }

      // Require password confirmation if user has a password
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.password) {
        const { password } = req.body;
        if (!password) {
          return res.status(400).json({
            message: "Password confirmation required to unlink OAuth provider"
          });
        }
        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return res.status(401).json({ message: "Incorrect password" });
        }
      }

      const result = await unlinkOAuthProvider(req.session.userId!, provider);

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      logger.error("OAuth unlink error:", error);
      res.status(500).json({ message: "Failed to unlink provider" });
    }
  });

  // ==================== Account Deletion ====================

  // Delete user account and all associated data
  app.delete("/api/account", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { password } = req.body;

      // Get the user to check auth method
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Require password confirmation for users with a password
      if (user.password) {
        if (!password) {
          return res.status(400).json({ message: "Password confirmation required" });
        }

        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return res.status(401).json({ message: "Incorrect password" });
        }
      }

      // Clean up user's images from Spaces before deleting
      if (isSpacesConfigured()) {
        try {
          const imageUrls = await storage.getUserWhiskeyImages(userId);
          for (const url of imageUrls) {
            const key = getKeyFromUrl(url);
            if (key) {
              await deleteFromSpaces(key).catch(() => {});
            }
          }
        } catch {
          // Continue with deletion even if image cleanup fails
        }
      }

      // Delete the user (CASCADE handles all related data)
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete account" });
      }

      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          logger.error("Error destroying session after account deletion:", err);
        }
      });

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      res.status(500).json(safeError(error, "Failed to delete account"));
    }
  });
}