import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import multer from "multer";

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

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
});

app.use(limiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/resume", upload.single("file"), resumeRouter);
app.use("/jobs", jobsRouter);
app.use("/skills", skillsRouter);
app.use("/courses", coursesRouter);
app.use("/domains", domainsRouter);

app.use(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Unhandled error", { error: err });
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(port, () => {
  logger.info(`Backend listening on port ${port}`);
});


