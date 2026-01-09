import { Router } from "express";
import { coursesHandler } from "../services/courseController";

export const coursesRouter = Router();

// POST /courses/recommend
coursesRouter.post("/recommend", coursesHandler);


