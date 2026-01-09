import { Request, Response } from "express";
import { SkillGapItem } from "../types";
import { recommendCoursesForGaps } from "./courseRecommender";

export async function coursesHandler(req: Request, res: Response) {
  const { gaps } = req.body || {};

  if (!Array.isArray(gaps)) {
    return res.status(400).json({ error: "gaps must be an array" });
  }

  if (gaps.length === 0) {
    // Return empty courses if no gaps provided
    return res.json({ courses: [] });
  }

  try {
    const typedGaps: SkillGapItem[] = gaps;
    const courses = await recommendCoursesForGaps(typedGaps);
    res.json({ courses });
  } catch (err) {
    console.error("Course recommendation error:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
}



