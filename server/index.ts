import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve attached_assets directory statically with proper options for binary files
// Use consistent path for all environments (serverless-safe)
const getAttachedAssetsPath = () => {
  return path.join(__dirname, '..', 'attached_assets');
};

const attachedAssetsPath = getAttachedAssetsPath();

app.use('/attached_assets', express.static(attachedAssetsPath, {
  setHeaders: (res, filePath) => {
    // Set proper headers for PDF files - allow viewing in browser
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Set proper headers for DOCX files - force download since browsers can't view inline
    else if (filePath.endsWith('.docx')) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// Note: Download endpoints removed - files are now served statically via Vercel CDN
// Individual files: /attached_assets/:filename
// ZIP package: /Technical_Specifications_Complete.zip

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

// Initialize the app once
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      if (!res.headersSent) {
        res.status(status).json({ message });
      } else {
        res.end();
      }
      
      // Log error in development only, don't throw in serverless
      if (!process.env.VERCEL && app.get('env') === 'development') {
        console.error(err);
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Only start the server if not in Vercel serverless environment
    if (!process.env.VERCEL) {
      // ALWAYS serve the app on the port specified in the environment variable PORT
      // Other ports are firewalled. Default to 5000 if not specified.
      // this serves both the API and the client.
      // It is the only port that is not firewalled.
      const port = parseInt(process.env.PORT || '5000', 10);
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`serving on port ${port}`);
      });
    }
  })();
  
  return initPromise;
}

// Initialize in development immediately
if (!process.env.VERCEL) {
  initializeApp();
}

// Export for Vercel serverless functions with proper async handler
export default async function handler(req: Request, res: Response) {
  await initializeApp();
  return app(req, res);
}
