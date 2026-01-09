import axios from "axios";
import { JobItem } from "../types";
import { JobQuery } from "./jsearch";

// Wellfound (formerly AngelList) API
export async function fetchFromWellfound(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`Wellfound: Searching for "${searchTerms}" (using ${topSkills.length} top skills)`);

  try {
    // Wellfound API - requires authentication
    const response = await axios.get("https://api.wellfound.com/v1/jobs", {
      params: {
        query: searchTerms,
        limit: 10,
        remote: true,
      },
      headers: {
        "Authorization": `Bearer ${process.env.WELLFOUND_API_KEY || ""}`,
        "User-Agent": "resume-intel-app@example.com",
      },
      timeout: 10000,
    });

    const jobs = response.data?.jobs || [];

    return jobs.map((job: any) => ({
      id: job.id || `${job.company}-${job.title}`,
      title: job.title || "",
      company: job.company_name || job.company || "",
      location: job.location || "Remote",
      description: job.description || "",
      salary: job.salary || "",
      url: job.url || "",
      skillsRequired: job.tags || [],
      source: "wellfound",
      postedDate: job.created_at || new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error("Wellfound API error:", error.message);
    return [];
  }
}

// The Muse API (free job board API)
export async function fetchFromTheMuse(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`The Muse: Searching for "${searchTerms}"`);

  try {
    const response = await axios.get("https://www.themuse.com/api/public/jobs", {
      params: {
        category: query.role || "",
        location: query.location || "",
        page: 1,
        desc: true,
        api_key: process.env.THE_MUSE_API_KEY || "", // Optional
      },
      headers: {
        "User-Agent": "resume-intel-app@example.com",
      },
      timeout: 8000,
    });

    const jobs: JobItem[] = [];
    const results = response.data?.results || [];

    for (const job of results) {
      // Check if job matches search terms
      const jobText = `${job.name} ${job.contents}`.toLowerCase();
      const matches = searchTerms.toLowerCase().split(' ').some(term =>
        term.length > 2 && jobText.includes(term)
      );

      if (matches || jobs.length < 3) { // Include some jobs even if no perfect match
        jobs.push({
          id: String(job.id),
          title: job.name || "",
          company: job.company?.name || "Company",
          location: job.locations?.[0]?.name || "Remote/Various",
          description: job.contents || "",
          url: job.refs?.landing_page || "",
          source: "themuse",
          skillsRequired: [], // API doesn't provide skills
        });
      }
    }

    console.log(`The Muse: Found ${jobs.length} jobs`);
    return jobs;
  } catch (err: any) {
    console.error("The Muse API error:", err?.response?.status, err?.message);
    return [];
  }
}

// Jooble API (free job search API)
export async function fetchFromJooble(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`Jooble: Searching for "${searchTerms}"`);

  try {
    const response = await axios.post("https://jooble.org/api/v0.1/search", {
      keywords: searchTerms,
      location: query.location || "",
      radius: "50",
      salary: "",
      page: "1",
    }, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "resume-intel-app@example.com",
      },
      timeout: 8000,
    });

    const jobs: JobItem[] = [];
    const results = response.data?.jobs || [];

    for (const job of results) {
      if (jobs.length >= (query.limit || 10)) break; // Limit results

      jobs.push({
        id: String(job.id || `jooble-${Date.now()}-${jobs.length}`),
        title: job.title || "",
        company: job.company || "Company",
        location: job.location || "Various",
        description: job.snippet || job.description || "",
        url: job.link || "",
        source: "jooble",
        skillsRequired: [], // API doesn't provide skills
      });
    }

    console.log(`Jooble: Found ${jobs.length} jobs`);
    return jobs;
  } catch (err: any) {
    console.error("Jooble API error:", err?.response?.status, err?.message);
    return [];
  }
}


// Indeed API (free job search - using their public endpoints)
export async function fetchFromIndeed(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`Indeed: Searching for "${searchTerms}"`);

  try {
    // Indeed's public API endpoint (no authentication required)
    const response = await axios.get("https://api.indeed.com/ads/apisearch", {
      params: {
        publisher: process.env.INDEED_PUBLISHER_ID || "1234567890123456", // Default demo key
        q: searchTerms,
        l: query.location || "",
        sort: "date",
        radius: 50,
        st: "employer",
        jt: "all",
        start: 0,
        limit: query.limit || 10,
        fromage: 7, // Last 7 days
        filter: 1,
        latlong: 1,
        co: "in", // Country code
        chnl: "",
        userip: "1.2.3.4",
        useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        v: 2
      },
      headers: {
        "User-Agent": "resume-intel-app@example.com",
        "Accept": "application/json",
      },
      timeout: 10000,
    });

    const jobs: JobItem[] = [];
    const results = response.data?.results || [];

    for (const job of results) {
      if (jobs.length >= (query.limit || 10)) break;

      jobs.push({
        id: String(job.jobkey),
        title: job.jobtitle || "",
        company: job.company || "Company",
        location: job.formattedLocationFull || job.city || "",
        description: job.snippet || "",
        url: job.url || "",
        source: "indeed",
        skillsRequired: [], // API doesn't provide detailed skills
      });
    }

    console.log(`Indeed: Found ${jobs.length} jobs`);
    return jobs;
  } catch (err: any) {
    console.error("Indeed API error:", err?.response?.status, err?.message);
    return [];
  }
}

// LinkedIn Jobs API (free public job search)
export async function fetchFromLinkedIn(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`LinkedIn: Searching for "${searchTerms}"`);

  try {
    // LinkedIn job search API (limited but free)
    const response = await axios.get("https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search", {
      params: {
        keywords: searchTerms,
        location: query.location || "",
        geoId: "", // Will be determined by location
        start: 0,
        f_TPR: "r604800", // Last 7 days
        position: 1,
        pageNum: 0,
        sortBy: "DD", // Date posted descending
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "csrf-token": "", // Not required for guest access
      },
      timeout: 10000,
    });

    const jobs: JobItem[] = [];
    const results = response.data || [];

    // Parse LinkedIn job data
    for (const job of results) {
      if (jobs.length >= (query.limit || 10)) break;

      jobs.push({
        id: String(job.entityUrn?.split(':').pop() || job.jobId),
        title: job.title || "",
        company: job.companyDetails?.companyName || job.companyName || "Company",
        location: job.formattedLocation || job.location || "",
        description: job.description || job.snippet || "",
        url: job.jobPostingUrl || `https://www.linkedin.com/jobs/view/${job.entityUrn?.split(':').pop()}`,
        source: "linkedin",
        skillsRequired: job.skills || [],
      });
    }

    console.log(`LinkedIn: Found ${jobs.length} jobs`);
    return jobs;
  } catch (err: any) {
    console.error("LinkedIn API error:", err?.response?.status, err?.message);
    return [];
  }
}

// Free Jobs API (generic job search API - multiple providers)
export async function fetchFromFreeJobs(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`Free Jobs API: Searching for "${searchTerms}"`);

  try {
    // Using a free job search API that aggregates multiple sources
    const response = await axios.get("https://api.freejobsapi.com/search", {
      params: {
        query: searchTerms,
        location: query.location || "",
        limit: query.limit || 10,
        country: "in", // Focus on India for the user
        language: "en",
      },
      headers: {
        "User-Agent": "resume-intel-app@example.com",
        "Accept": "application/json",
        "Authorization": `Bearer ${process.env.FREE_JOBS_API_KEY || ""}`, // Optional
      },
      timeout: 10000,
    });

    const jobs: JobItem[] = [];
    const results = response.data?.jobs || response.data?.results || [];

    for (const job of results) {
      if (jobs.length >= (query.limit || 10)) break;

      jobs.push({
        id: String(job.id || job.job_id),
        title: job.title || job.position || "",
        company: job.company || job.employer || "Company",
        location: job.location || job.city || "",
        description: job.description || job.summary || "",
        url: job.url || job.apply_url || "",
        source: "freejobs",
        skillsRequired: job.skills || job.required_skills || [],
      });
    }

    console.log(`Free Jobs API: Found ${jobs.length} jobs`);
    return jobs;
  } catch (err: any) {
    console.error("Free Jobs API error:", err?.response?.status, err?.message);
    return [];
  }
}

// Adzuna API (already exists but adding as free alternative)
// This is already implemented in adzuna.ts, but including here for completeness
