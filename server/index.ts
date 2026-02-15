import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateRickConfig } from "./rick-config";
import path from "path";
import fs from "fs";

const app = express();

// Security headers
const isProduction = process.env.NODE_ENV === 'production';
// Build CSP entries for DO Spaces that handle multi-level subdomain URLs
// e.g. https://whiskeypedia-uploads.sfo3.cdn.digitaloceanspaces.com/...
const spacesRegion = process.env.SPACES_REGION || 'sfo3';
const spacesCspSources = [
  "https://*.digitaloceanspaces.com",
  "https://*.cdn.digitaloceanspaces.com",
  `https://*.${spacesRegion}.digitaloceanspaces.com`,
  `https://*.${spacesRegion}.cdn.digitaloceanspaces.com`,
];
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        ...spacesCspSources,
      ],
      connectSrc: [
        "'self'",
        ...spacesCspSources,
      ],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS with origin whitelist
const ALLOWED_ORIGINS = new Set([
  'https://mywhiskeypedia.com',
  'https://www.mywhiskeypedia.com',
]);
if (!isProduction) {
  ALLOWED_ORIGINS.add('http://localhost:5000');
  ALLOWED_ORIGINS.add('http://localhost:5173');
  ALLOWED_ORIGINS.add('http://localhost:3000');
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Increase JSON body limit for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
console.log("Serving uploads from:", uploadDir);
if (!fs.existsSync(uploadDir)) {
  console.log("Creating uploads directory...");
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads directory for image access
app.use('/uploads', express.static(uploadDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Validate Rick House configuration on startup
  validateRickConfig();

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
