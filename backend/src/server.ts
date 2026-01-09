import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "path";

import { logger } from "./utils/logger";
import { resumeRouter } from "./routes/resume";
import { jobsRouter } from "./routes/jobs";
import { skillsRouter } from "./routes/skills";
import { coursesRouter } from "./routes/courses";
import domainsRouter from "./routes/domains";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || true
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'public')));
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
});

app.use(limiter);

// Enhanced health check
app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: "1.0.0"
  });
});

// API Routes
app.use("/resume", upload.single("file"), resumeRouter);
app.use("/jobs", jobsRouter);
app.use("/skills", skillsRouter);
app.use("/courses", coursesRouter);
app.use("/domains", domainsRouter);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });
}

// Error handling middleware
app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Unhandled error", { error: err });
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  }
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  logger.info(`🚀 SkillGap AI Backend listening on port ${port}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🏥 Health check: http://localhost:${port}/health`);
  if (process.env.NODE_ENV === 'production') {
    logger.info(`🌐 Frontend served from: http://localhost:${port}`);
  }
});


