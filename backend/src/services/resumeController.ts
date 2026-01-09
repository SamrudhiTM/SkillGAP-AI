import { Request, Response } from "express";
import { parseResumeWithLLM } from "./resumeParser";

export async function parseResumeHandler(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ error: "No resume file uploaded" });
  }

  try {
    const profile = await parseResumeWithLLM(file.buffer, file.mimetype);
    
    console.log("Resume parsed successfully:", {
      name: profile.name,
      email: profile.email,
      skillsCount: profile.skills?.length || 0,
      skills: profile.skills?.slice(0, 10), // Log first 10 skills
      projectsCount: profile.projects?.length || 0,
      experienceCount: profile.experience?.length || 0,
    });
    
    res.json({ profile });
  } catch (err) {
    console.error("Resume parsing error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to parse resume";
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? String(err) : undefined
    });
  }
}


