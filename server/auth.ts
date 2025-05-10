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

// Enhanced authentication middleware with user validation
export async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  try {
    // Verify the user actually exists in the database
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      // If user doesn't exist but session has userId, clear the invalid session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying invalid session:", err);
        }
      });
      return res.status(401).json({ message: "User not found" });
    }
    
    // User is authenticated and exists
    next();
  } catch (error) {
    console.error("Authentication error:", error);
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
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax"
      }
    })
  );

  // User Registration
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create user
      const newUser = await storage.createUser(userData);
      
      // Establish session
      req.session.userId = newUser.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
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
      const credentials = loginUserSchema.parse(req.body);
      
      // Validate credentials
      const user = await storage.validateUserCredentials(
        credentials.username, 
        credentials.password
      );
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Establish session
      req.session.userId = user.id;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: "Validation error", error: validationError.message });
      }
      res.status(500).json({ message: "Login failed", error: String(error) });
    }
  });

  // User Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Logout failed", error: String(err) });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get Current User
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        // Clear invalid session
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
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