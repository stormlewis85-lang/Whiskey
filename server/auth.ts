import express, { type Request, type Response, type NextFunction } from "express";
import { storage, hashPassword, comparePasswords } from "./storage";
import { loginUserSchema, insertUserSchema, updateUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import session from "express-session";
import { nanoid } from "nanoid";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

// Fix TypeScript declaration for SessionData
declare module "express-session" {
  interface SessionData {
    userId?: number;
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Not authenticated - No token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "Not authenticated - Invalid token format" });
    }
    
    // Validate the token
    const user = await storage.getUserByToken(token);
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated - Invalid token" });
    }
    
    if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
      return res.status(401).json({ message: "Not authenticated - Token expired" });
    }
    
    // Add user id to request for later use
    req.session.userId = user.id;
    
    // User is authenticated via token
    console.log(`User authenticated via token: ${user.username} (ID: ${user.id})`);
    next();
  } catch (error) {
    console.error("Token authentication error:", error);
    res.status(500).json({ message: "Authentication verification failed", error: String(error) });
  }
}

// Setup authentication and session
export function setupAuth(app: express.Express) {
  // Configure session middleware with PostgreSQL for persistence
  app.use(
    session({
      secret: process.env.SESSION_SECRET || nanoid(32),
      resave: false,
      saveUninitialized: false,
      store: new PgStore({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true
      }),
      name: 'whiskeypedia.sid', // Name the cookie for better identification
      proxy: true, // Trust the reverse proxy when setting secure cookies
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
        httpOnly: true,
        secure: false, // Set to false for both HTTP and HTTPS (will enable in production)
        sameSite: "none", // Needed for cross-site access in deployed environments
        path: '/'
      }
    })
  );
  
  // Update secure flag based on environment
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Trust first proxy
    console.log("Production environment detected, enabling secure cookies");
  } else {
    console.log("Development environment detected, using non-secure cookies");
  }

  // User Registration
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      console.log("Registration attempt:", req.body.username);
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        console.log(`Registration failed: username already exists: ${userData.username}`);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create user
      const newUser = await storage.createUser(userData);
      console.log(`User created: ${newUser.username} (ID: ${newUser.id})`);
      
      // Establish session
      req.session.userId = newUser.id;
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Session save error during registration:", err);
          return res.status(500).json({ message: "Session creation failed" });
        }
        
        console.log(`Registration successful: user ${newUser.username} (ID: ${newUser.id})`);
        console.log("Session data:", {
          id: req.sessionID,
          cookie: req.session.cookie,
          userId: req.session.userId
        });
        
        // Return user without password
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Registration failed", error: String(error) });
    }
  });

  // User Login
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      console.log("Login attempt:", req.body.username);
      const credentials = loginUserSchema.parse(req.body);
      
      // Validate credentials
      const user = await storage.validateUserCredentials(
        credentials.username, 
        credentials.password
      );
      
      if (!user) {
        console.log(`Login failed: invalid credentials for ${credentials.username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Establish session
      req.session.userId = user.id;
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session creation failed" });
        }
        
        console.log(`Login successful: user ${user.username} (ID: ${user.id})`);
        console.log("Session data:", {
          id: req.sessionID,
          cookie: req.session.cookie,
          userId: req.session.userId
        });
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
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
      console.log("Session check:", {
        id: req.sessionID,
        userId: req.session.userId,
        cookie: req.session.cookie
      });
      
      if (!req.session.userId) {
        console.log("No userId in session, not authenticated");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log(`User not found for session ID ${req.sessionID}, userId ${req.session.userId}`);
        // Clear invalid session
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying invalid session:", err);
          }
        });
        return res.status(401).json({ message: "User not found" });
      }
      
      console.log(`User found: ${user.username} (ID: ${user.id})`);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
}