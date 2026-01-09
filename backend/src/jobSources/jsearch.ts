import axios from "axios";
import { JobItem } from "../types";

// Enhanced skill extraction from job descriptions using advanced pattern matching
function extractSkillsFromText(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  // Comprehensive skill patterns for real-time extraction
  const skillPatterns = [
    // Programming Languages
    /\b(javascript|typescript|python|java|c\+\+|c#|go|golang|rust|php|ruby|swift|kotlin|scala|r|perl|matlab)\b/gi,
    // Web Frameworks & Libraries
    /\b(react|vue|angular|nextjs|nuxt|svelte|nodejs?|express|nestjs|django|flask|fastapi|spring|spring boot|asp\.net|laravel|rails|symfony|express\.js|meteor)\b/gi,
    // Databases
    /\b(mysql|postgresql|postgres|mongodb|redis|sqlite|oracle|dynamodb|cassandra|elasticsearch|neo4j|couchdb|firebase|supabase)\b/gi,
    // Cloud & DevOps
    /\b(aws|azure|gcp|google cloud|docker|kubernetes|k8s|terraform|ansible|jenkins|gitlab|github actions|ci\/cd|travis|circleci|github|bitbucket)\b/gi,
    // Tools & Platforms
    /\b(git|jira|figma|postman|graphql|rest api|microservices|agile|scrum|kanban|trello|slack|discord|zoom|teams)\b/gi,
    // AI/ML/Data Science
    /\b(machine learning|ml|ai|artificial intelligence|data science|deep learning|neural networks|nlp|computer vision|tensorflow|pytorch|scikit-learn|pandas|numpy|jupyter)\b/gi,
  ];

  for (const pattern of skillPatterns) {
    const matches = lowerText.match(pattern);
    if (matches) {
      matches.forEach(m => {
        const cleaned = m.toLowerCase().trim();
        if (cleaned.length > 1 && cleaned.length < 30) {
          found.add(cleaned);
        }
      });
    }
  }

  return Array.from(found);
}

export interface JobQuery {
  skills: string[];
  location?: string;
  role?: string;
  limit?: number;
}

export async function fetchFromJSearch(query: JobQuery): Promise<JobItem[]> {
  const apiKey = process.env.JSEARCH_API_KEY;
  const host = "jsearch.p.rapidapi.com";

  if (!apiKey) {
    console.log("JSearch API key not set, skipping JSearch");
    return [];
  }

  // Build intelligent search terms - role + top 3 skills to avoid overly long queries
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`JSearch: Searching for "${searchTerms}" (using ${topSkills.length} top skills)`);

  try {
    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query: searchTerms,
        page: 1,
        num_pages: 1,
        date_posted: "week",
      },
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": host,
      },
      timeout: 8000,
    });

    const data = response.data?.data ?? [];
    console.log(`JSearch: Found ${data.length} jobs`);

    const jobs: JobItem[] = data.map((job: any) => {
      // Extract skills from job description since job_required_skills field doesn't exist
      const extractedSkills = extractSkillsFromText(job.job_description || "");

      return {
        id: String(job.job_id),
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city || job.job_country,
        description: job.job_description || "",
        url: job.job_apply_link || job.job_google_link,
        source: "jsearch",
        skillsRequired: extractedSkills,
      };
    });

    return jobs;
  } catch (err: any) {
    console.error("JSearch API error:", err?.response?.status, err?.message);
    return [];
  }
}


