import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import archiver from "archiver";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve attached_assets directory statically with proper options for binary files
// Use consistent path for all environments (serverless-safe)
const getAttachedAssetsPath = () => {
  return path.join(process.cwd(), 'attached_assets');
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

// Dedicated download endpoint for PDFs and DOCX files
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Security: Validate filename to prevent path traversal attacks
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  
  // Whitelist allowed file extensions
  const allowedExtensions = ['.pdf', '.docx'];
  const fileExtension = path.extname(filename).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(400).json({ message: 'Invalid file type. Only PDF and DOCX files are supported.' });
  }
  
  const assetsDir = getAttachedAssetsPath();
  const filePath = path.join(assetsDir, filename);
  
  // Security: Ensure the resolved path is within the assets directory
  const resolvedPath = path.resolve(filePath);
  const resolvedAssetsDir = path.resolve(assetsDir);
  if (!resolvedPath.startsWith(resolvedAssetsDir)) {
    return res.status(400).json({ message: 'Invalid file path' });
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  // Set appropriate headers and send file
  if (fileExtension === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } else if (fileExtension === '.docx') {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  }
});

// Download all technical specifications as ZIP
app.get('/download-all-specs', async (req, res) => {
  try {
    const assetsDir = getAttachedAssetsPath();
    const files = await fs.promises.readdir(assetsDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      return res.status(404).json({ message: 'No technical specifications found' });
    }

    // Set headers for ZIP download
    const zipName = 'Technical_Specifications_Complete.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error creating archive' });
      }
    });

    // Handle client disconnect
    res.on('close', () => {
      archive.abort();
    });

    // Pipe archive data to response
    archive.pipe(res);

    // Add all PDF files to the archive
    for (const pdfFile of pdfFiles) {
      const filePath = path.join(assetsDir, pdfFile);
      if (fs.existsSync(filePath)) {
        // Clean up filename for better organization in ZIP
        const cleanName = pdfFile.replace(/_\d{13}/g, ''); // Remove timestamps
        archive.file(filePath, { name: cleanName });
      }
    }

    // Finalize the archive
    await archive.finalize();
    
  } catch (error) {
    console.error('ZIP creation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error creating technical specifications package' });
    }
  }
});

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
