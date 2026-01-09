import { Request, Response } from "express";
import { recommendJobsForSkills } from "./jobRecommender";

export async function recommendJobsHandler(req: Request, res: Response) {
  const { skills, location, role, limit } = req.body || {};

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ error: "skills array is required" });
  }

  console.log("Job recommendation request:", {
    skillsCount: skills.length,
    skills: skills.slice(0, 10), // Log first 10 skills
    location,
    role,
    limit,
  });

  try {
    const jobs = await recommendJobsForSkills({
      skills,
      location,
      role,
      limit,
    });

    console.log(`Job recommendation result: ${jobs?.length || 0} jobs found`);
    if (jobs && jobs.length > 0) {
      console.log("Top job:", {
        title: jobs[0].title,
        company: jobs[0].company,
        source: jobs[0].source,
        relevanceScore: jobs[0].relevanceScore,
        matchCount: jobs[0].matchCount,
        skillsCount: jobs[0].skillsRequired?.length || 0,
      });
    } else {
      console.warn("No jobs found. Possible reasons: missing API keys, no matching jobs, or API rate limits.");
    }

    // Always return an array, even if empty
    res.json({ jobs: jobs || [] });
  } catch (err) {
    console.error("Job recommendation error:", err);
    // Return empty array instead of error so frontend can continue
    res.json({ jobs: [] });
  }
}

