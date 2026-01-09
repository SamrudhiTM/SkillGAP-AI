import { Request, Response } from "express";
import { JobItem } from "../types";
import { computeSkillGaps } from "./skillGapEngine";

// Helper function to estimate learning time for a skill
function getEstimatedLearningTime(skill: string): number {
  const timeEstimates: Record<string, number> = {
    'javascript': 40,
    'typescript': 25,
    'react': 30,
    'angular': 35,
    'vue': 25,
    'python': 35,
    'java': 40,
    'c#': 35,
    'node.js': 25,
    'express': 15,
    'django': 30,
    'flask': 20,
    'sql': 20,
    'mongodb': 15,
    'postgresql': 20,
    'docker': 15,
    'kubernetes': 30,
    'aws': 25,
    'azure': 25,
    'gcp': 25,
    'machine learning': 60,
    'data analysis': 40,
    'git': 10,
    'testing': 20,
    'agile': 15,
    'scrum': 10
  };

  return timeEstimates[skill.toLowerCase()] || 25; // Default 25 hours
}

// Helper function to determine interview importance
function getInterviewImportance(skill: string): 'critical' | 'high' | 'medium' | 'low' {
  const criticalSkills = ['javascript', 'data structures', 'algorithms', 'system design'];
  const highSkills = ['react', 'typescript', 'python', 'sql', 'aws', 'docker'];
  const mediumSkills = ['angular', 'vue', 'node.js', 'mongodb', 'testing'];

  const lowerSkill = skill.toLowerCase();
  
  if (criticalSkills.some(s => lowerSkill.includes(s))) return 'critical';
  if (highSkills.some(s => lowerSkill.includes(s))) return 'high';
  if (mediumSkills.some(s => lowerSkill.includes(s))) return 'medium';
  
  return 'low';
}

export async function skillGapHandler(req: Request, res: Response) {
  const { resumeSkills, jobs, topN } = req.body || {};
  // Lazy import to avoid circular deps and heavy initialization when not needed
  const { KnowledgeGraph } = await import("./skillGapEngine");

  if (!Array.isArray(resumeSkills) || resumeSkills.length === 0) {
    return res.status(400).json({ error: "resumeSkills array is required" });
  }

  // Handle empty jobs array gracefully
  if (!Array.isArray(jobs)) {
    return res.status(400).json({ error: "jobs must be an array" });
  }

  if (jobs.length === 0) {
    // Return empty gaps if no jobs provided
    return res.json({ gaps: [] });
  }

  try {
    const typedJobs: JobItem[] = jobs;
    const gaps = await computeSkillGaps(resumeSkills, typedJobs, topN || 5);
    const knowledgeGraph = new KnowledgeGraph();

    // Generate skill gaps WITH learning paths (async)
    const prioritizedGaps = await Promise.all(
      gaps.map(async (gap, index) => {
        console.log(`📝 Generating learning path for skill gap: ${gap.skill}`);
        
        // Set priority levels based on position and importance
        let priority: "high" | "medium" | "low" = "medium";
        if (index < 2) {
          priority = "high";
        } else if (index < 5) {
          priority = "medium";
        } else {
          priority = "low";
        }

        // Generate learning path dynamically for each skill gap (now async)
        const learningPath = await knowledgeGraph.generateLearningPath(gap.skill, resumeSkills);

        // Return gap info with complete learning path
        return {
          ...gap,
          priority,
          estimatedLearningTime: learningPath.totalTime,
          interviewImportance: getInterviewImportance(gap.skill),
          // Add complete learning path data
          learningPath: {
            totalTime: learningPath.totalTime,
            difficulty: learningPath.difficulty,
            milestones: learningPath.milestones,
            roadmap: learningPath.roadmap,
            knowledgeGraph: learningPath.knowledgeGraph,
            parallelTracks: learningPath.parallelTracks.map(track => ({
              skill: track.skill,
              totalTime: track.totalTime,
              difficulty: track.difficulty
            }))
          }
        };
      })
    );

    res.json({ gaps: prioritizedGaps });
  } catch (err) {
    console.error("Skill gap computation error:", err);
    res.status(500).json({ error: "Failed to compute skill gaps" });
  }
}



