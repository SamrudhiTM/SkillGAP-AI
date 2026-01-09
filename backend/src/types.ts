export interface ResumeProfile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  projects: { name: string; description?: string; technologies?: string[] }[];
  experience: {
    title: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    skills?: string[];
  }[];
  isFreher?: boolean; // Flag for users with no skills (freshers)
}

export interface JobItem {
  id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  source: string;
  skillsRequired: string[];
  missingSkills?: string[]; // Skills required but not in resume
  relevanceScore?: number; // Relevance score 0-100
  matchedSkills?: string[]; // Skills that match resume
  matchCount?: number; // Number of matching skills
}

export type Priority = "high" | "medium" | "low";

export interface SkillGapItem {
  skill: string;
  priority: Priority;
  reason: string;
  learningPath?: import('./services/skillGapEngine').LearningPath;
}

export interface CourseItem {
  title: string;
  provider: string;
  url: string;
  isFree: boolean;
  isCertification: boolean;
  credibility?: 'high' | 'medium' | 'standard';
  resumeValue?: 'excellent' | 'good' | 'standard';
  duration?: string;
  cost?: string;
  skills?: string[];
}


