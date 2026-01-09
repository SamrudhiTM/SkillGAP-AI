import axios from "axios";
import { JobItem } from "../types";
import { JobQuery } from "./jsearch";

export async function fetchFromAdzuna(query: JobQuery): Promise<JobItem[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY || "gb";

  if (!appId || !appKey) {
    console.log("Adzuna API keys not set, skipping Adzuna");
    return [];
  }

  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`Adzuna: Searching for "${searchTerms}" (using ${topSkills.length} top skills)`);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1`;

  try {
    const response = await axios.get(url, {
      params: {
        app_id: appId,
        app_key: appKey,
        what: searchTerms,
        where: query.location || "",
        results_per_page: query.limit || 20,
      },
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 8000,
    });

    const results = response.data?.results ?? [];
    console.log(`Adzuna: Found ${results.length} jobs`);

    const jobs: JobItem[] = results.map((job: any) => ({
      id: String(job.id),
      title: job.title,
      company: job.company?.display_name,
      location: job.location?.display_name,
      description: job.description || "",
      url: job.redirect_url,
      source: "adzuna",
      skillsRequired: [], // Adzuna doesn't expose explicit skills; will be inferred later
    }));

    return jobs;
  } catch (err: any) {
    console.error("Adzuna API error:", err?.response?.status, err?.message);
    return [];
  }
}


