import { Router } from "express";
import { recommendJobsHandler } from "../services/jobController";

export const jobsRouter = Router();

// POST /jobs/recommend
jobsRouter.post("/recommend", recommendJobsHandler);

