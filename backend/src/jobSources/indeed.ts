import axios from "axios";
import * as cheerio from "cheerio";
import { JobItem } from "../types";
import { JobQuery } from "./jsearch";

// Indeed.com job scraping (alternative approach)
export async function fetchFromIndeed(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`Indeed: Searching for "${searchTerms}" (using ${topSkills.length} top skills)`);

  try {
    // Indeed search URL
    const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(searchTerms)}&l=${encodeURIComponent(query.location || "")}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    // Parse Indeed job cards
    $('.jobsearch-ResultsList li, .job_seen_beacon').each((_: any, el: any) => {
      const title = $(el).find('h2 a span[title], .jobTitle span[title]').attr('title') ||
                   $(el).find('h2 a, .jobTitle a').text().trim();
      const company = $(el).find('.companyName, .company_location .companyName').text().trim();
      const location = $(el).find('.companyLocation, .company_location .companyLocation').text().trim();
      const salary = $(el).find('.salary-snippet, .salaryText').text().trim();
      const link = $(el).find('h2 a, .jobTitle a').attr('href');
      const description = $(el).find('.job-snippet, .summary').text().trim() || title;

      if (title && company) {
        jobs.push({
          id: `indeed-${Date.now()}-${jobs.length}`,
          title,
          company,
          location: location || "Various",
          description: `${description}${salary ? ` Salary: ${salary}` : ""}`.trim(),
          url: link ? (link.startsWith('http') ? link : `https://www.indeed.com${link}`) : undefined,
          source: "indeed",
          skillsRequired: [], // Will be extracted from description later
        });
      }
    });

    console.log(`Indeed: Found ${jobs.length} jobs`);
    return jobs;
  } catch (err: any) {
    console.error("Indeed scraping error:", err?.message);
    return [];
  }
}
