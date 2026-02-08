import express, { type Request, type Response, type NextFunction } from "express";
import { storage, hashPassword, comparePasswords } from "./storage";
import { loginUserSchema, insertUserSchema, updateUserSchema, registerUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import session from "express-session";
import { nanoid } from "nanoid";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { loginRateLimiter, passwordResetRateLimiter, recordLoginAttempt } from "./auth/rate-limiter";
import { isAccountLocked, handleFailedLogin, handleSuccessfulLogin, getLockoutRemainingSeconds } from "./auth/account-security";
import { requestPasswordReset, validateResetToken, completePasswordReset } from "./auth/password-reset";
import { forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { initiateGoogleAuth, handleGoogleCallback, isGoogleOAuthConfigured, getOAuthStatus, unlinkOAuthProvider } from "./auth/oauth-google";

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
      // Verify the user actually exists in the database
      const user = await storage.getUser(req.session.userId);
      
      if (user) {
        // User is authenticated and exists via session
        console.log(`User authenticated via session: ${user.username} (ID: ${user.id})`);
        return next();
      } else {
        // If user doesn't exist but session has userId, clear the invalid session
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying invalid session:", err);
          }
        });
        console.log("Session user not found, trying token auth as fallback");
        // Fall through to token auth
      }
    } catch (error) {
      console.error("Session authentication error:", error);
      // Fall through to token auth
    }
  }
  
  // Try token-based authentication as a fallback
  try {
    // Get the auth token from the Authorization header
    const authHeader = req.headers.authorization;
    console.log(`Auth header received: ${authHeader ? 'Present' : 'Missing'}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("No Bearer token in Authorization header");
      return res.status(401).json({ message: "Not authenticated - No token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    console.log(`Extracted token: ${token ? token.substring(0, 10) + '...' : 'None'}`);
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated - Invalid token format" });
    }
    
    // Validate the token
    console.log(`Looking up user by token...`);
    const user = await storage.getUserByToken(token);
    
    if (!user) {
      console.log(`No user found for token: ${token.substring(0, 10)}...`);
      return res.status(401).json({ message: "Not authenticated - Invalid token" });
    }
    
    console.log(`Found user: ${user.username} (ID: ${user.id}), checking expiry...`);
    if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
      console.log(`Token expired for user ${user.username}: ${user.tokenExpiry}`);
      return res.status(401).json({ message: "Not authenticated - Token expired" });
    }
    
    // Add user id to session and save it for later use
    req.session.userId = user.id;

    // User is authenticated via token - save session before proceeding
    console.log(`User authenticated via token: ${user.username} (ID: ${user.id})`);

    // Save the session to persist the userId
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session during token auth:", err);
        // Continue anyway since we have the userId set for this request
      }
      next();
    });
  } catch (error) {
    console.error("Token authentication error:", error);
    res.status(500).json({ message: "Authentication verification failed", error: String(error) });
  }
}

// Setup authentication and session
export function setupAuth(app: express.Express) {
  // Warn if SESSION_SECRET is not set
  if (!process.env.SESSION_SECRET) {
    console.warn("WARNING: SESSION_SECRET not set in .env - sessions will be lost on server restart!");
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Configure session middleware with PostgreSQL for persistence
  app.use(
    session({
      secret: process.env.SESSION_SECRET || nanoid(32),
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
        sameSite: isProduction ? "none" : "lax", // "lax" for dev, "none" for prod cross-site
        path: '/'
      }
    })
  );

  // Log environment info
  if (isProduction) {
    app.set('trust proxy', 1); // Trust first proxy
    console.log("Production environment detected, enabling secure cookies");
  } else {
    console.log("Development environment detected, using non-secure cookies with sameSite=lax");
  }

  // User Registration (with password strength validation)
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      console.log("Registration attempt:", req.body.username);

      // Use the stronger registration schema for validation
      const validatedData = registerUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        console.log(`Registration failed: username already exists: ${validatedData.username}`);
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists (if provided)
      if (validatedData.email) {
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          console.log(`Registration failed: email already exists: ${validatedData.email}`);
          return res.status(400).json({ message: "Email already in use" });
        }
      }

      // Prepare user data for creation
      const userData = {
        username: validatedData.username,
        password: validatedData.password || '', // Will be hashed in storage
        displayName: validatedData.displayName,
        email: validatedData.email,
      };

      // Create user
      const newUser = await storage.createUser(userData);
      console.log(`User created: ${newUser.username} (ID: ${newUser.id})`);

      // Establish session
      req.session.userId = newUser.id;

      // Generate auth token
      try {
        const token = await storage.generateAuthToken(newUser.id);

        // Save session explicitly
        req.session.save((err) => {
          if (err) {
            console.error("Session save error during registration:", err);
            return res.status(500).json({ message: "Session creation failed" });
          }

          console.log(`Registration successful: user ${newUser.username} (ID: ${newUser.id})`);

          // Return user without password but with token
          const { password, ...userWithoutPassword } = newUser;
          res.status(201).json({
            ...userWithoutPassword,
            token: token
          });
        });
      } catch (tokenError) {
        console.error("Token generation error:", tokenError);

        // Return user without password, fallback to session-only auth
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Registration failed", error: String(error) });
    }
  });

  // User Login (with rate limiting and account lockout)
  app.post("/api/login", loginRateLimiter, async (req: Request, res: Response) => {
    try {
      console.log("Login attempt:", req.body.username);
      const credentials = loginUserSchema.parse(req.body);

      // First, check if user exists to handle account lockout
      const existingUser = await storage.getUserByUsername(credentials.username);

      if (existingUser) {
        // Check if account is locked
        const locked = await isAccountLocked(existingUser.id);
        if (locked) {
          const remainingSeconds = await getLockoutRemainingSeconds(existingUser.id);
          const remainingMinutes = Math.ceil(remainingSeconds / 60);

          // Record the blocked attempt
          await recordLoginAttempt(credentials.username, false, req.ip);

          return res.status(423).json({
            message: `Account temporarily locked. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
            lockedUntil: remainingSeconds
          });
        }
      }

      // Validate credentials
      const user = await storage.validateUserCredentials(
        credentials.username,
        credentials.password
      );

      if (!user) {
        console.log(`Login failed: invalid credentials for ${credentials.username}`);

        // Record the failed attempt
        await recordLoginAttempt(credentials.username, false, req.ip);

        // If user exists, handle failed login (increment counter, maybe lock)
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

      // Successful login - reset failed attempts and record success
      await handleSuccessfulLogin(user.id);
      await recordLoginAttempt(credentials.username, true, req.ip);

      // Establish session
      req.session.userId = user.id;

      // Generate auth token
      try {
        const token = await storage.generateAuthToken(user.id);

        // Save session explicitly
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Session creation failed" });
          }

          console.log(`Login successful: user ${user.username} (ID: ${user.id})`);

          // Return user without password but with token
          const { password, ...userWithoutPassword } = user;
          res.json({
            ...userWithoutPassword,
            token: token
          });
        });
      } catch (tokenError) {
        console.error("Token generation error:", tokenError);

        // Return user without password, fallback to session-only auth
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Login failed", error: String(error) });
    }
  });

  // User Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    const sessionInfo = {
      id: req.sessionID,
      userId: req.session.userId,
      isActive: !!req.session.userId
    };
    
    console.log(`Logout attempt: Session info:`, sessionInfo);
    
    req.session.destroy(err => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed", error: String(err) });
      }
      console.log("Logout successful");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get Current User
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      console.log("User authentication check");
      
      // First try session-based auth
      if (req.session.userId) {
        const sessionUser = await storage.getUser(req.session.userId);
        if (sessionUser) {
          console.log(`Session auth: user ${sessionUser.username} (ID: ${sessionUser.id})`);
          
          // Return user without password
          const { password, ...userWithoutPassword } = sessionUser;
          return res.json(userWithoutPassword);
        } else {
          console.log(`User not found for session userId ${req.session.userId}`);
          // Clear invalid session
          req.session.destroy((err) => {
            if (err) {
              console.error("Error destroying invalid session:", err);
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
          console.log(`Token auth: user ${tokenUser.username} (ID: ${tokenUser.id})`);
          
          // Set session for future requests
          req.session.userId = tokenUser.id;
          
          // Return user without password
          const { password, ...userWithoutPassword } = tokenUser;
          return res.json(userWithoutPassword);
        }
      }
      
      // Neither session nor token authentication worked
      console.log("No valid session or token found, not authenticated");
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to get user", error: String(error) });
    }
  });

  // Update User Profile
  app.patch("/api/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userData = updateUserSchema.parse(req.body);

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
      res.status(500).json({ message: "Failed to update user", error: String(error) });
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
      console.error("Password reset request error:", error);
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
      console.error("Token validation error:", error);
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
      console.error("Password reset error:", error);
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
      console.error("OAuth status error:", error);
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

      const result = await unlinkOAuthProvider(req.session.userId!, provider);

      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("OAuth unlink error:", error);
      res.status(500).json({ message: "Failed to unlink provider" });
    }
  });
}