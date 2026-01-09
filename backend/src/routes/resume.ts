import { Router } from "express";
import { parseResumeHandler } from "../services/resumeController";

export const resumeRouter = Router();

// POST /resume/extract
resumeRouter.post("/extract", parseResumeHandler);


