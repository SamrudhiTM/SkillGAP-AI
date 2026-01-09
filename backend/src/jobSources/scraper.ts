import axios from "axios";
import * as cheerio from "cheerio";
import { JobItem } from "../types";
import { JobQuery } from "./jsearch";
import { fetchFromIndeed } from "./freeApis";

// Real-time job scraping from multiple sources
export async function fetchFromScraper(query: JobQuery): Promise<JobItem[]> {
  const topSkills = query.skills?.slice(0, 3) || [];
  const searchTerms = [query.role, ...topSkills].filter(Boolean).join(" ");
  console.log(`Scraper: Searching for "${searchTerms}" (using ${topSkills.length} top skills)`);

  const jobs: JobItem[] = [];

  // Method 1: Scrape from We Work Remotely (RSS feed) - Most reliable
  try {
    console.log("Trying We Work Remotely RSS...");
    const wwrJobs = await scrapeWeWorkRemotely(searchTerms);
    jobs.push(...wwrJobs);
    console.log(`We Work Remotely: Found ${wwrJobs.length} jobs`);
  } catch (err: any) {
    console.error("We Work Remotely scraping error:", err?.message || err);
  }

  // Method 2: Scrape from Reed.co.uk (UK jobs, free API alternative)
  if (jobs.length < 5) {
    try {
      console.log("Trying Reed.co.uk API...");
      const reedJobs = await scrapeReedUK(searchTerms);
      jobs.push(...reedJobs);
      console.log(`Reed.co.uk: Found ${reedJobs.length} jobs`);
  } catch (err: any) {
    console.error("Reed.co.uk scraping error:", err?.message || err);
  }
  }

  // Method 3: Scrape from Indeed
  if (jobs.length < 10) {
    try {
      console.log("Trying Indeed scraping...");
      const indeedJobs = await fetchFromIndeed(query);
      jobs.push(...indeedJobs);
      console.log(`Indeed: Found ${indeedJobs.length} jobs`);
    } catch (err: any) {
      console.error("Indeed scraping error:", err?.message || err);
    }
  }

  // Method 4: Scrape from Remote.co
  if (jobs.length < 15) {
    try {
      console.log("Trying Remote.co scraping...");
      const remoteCoJobs = await scrapeRemoteCo(searchTerms);
      jobs.push(...remoteCoJobs);
      console.log(`Remote.co: Found ${remoteCoJobs.length} jobs`);
    } catch (err: any) {
      console.error("Remote.co scraping error:", err?.message || err);
    }
  }

  // Method 5: Scrape from Remote OK
  if (jobs.length < 20) {
    try {
      console.log("Trying Remote OK scraping...");
      const remoteOkJobs = await scrapeRemoteOK(searchTerms);
      jobs.push(...remoteOkJobs);
      console.log(`Remote OK: Found ${remoteOkJobs.length} jobs`);
    } catch (err: any) {
      console.error("Remote OK scraping error:", err?.message || err);
    }
  }

  // Method 6: Scrape from FlexJobs
  if (jobs.length < 25) {
    try {
      console.log("Trying FlexJobs scraping...");
      const flexJobs = await scrapeFlexJobs(searchTerms);
      jobs.push(...flexJobs);
      console.log(`FlexJobs: Found ${flexJobs.length} jobs`);
    } catch (err: any) {
      console.error("FlexJobs scraping error:", err?.message || err);
    }
  }

  // Method 7: Scrape from Naukri.com (Indian jobs)
  if (jobs.length < 30) {
    try {
      console.log("Trying Naukri.com scraping...");
      const naukriJobs = await scrapeNaukri(searchTerms);
      jobs.push(...naukriJobs);
      console.log(`Naukri.com: Found ${naukriJobs.length} jobs`);
    } catch (err: any) {
      console.error("Naukri.com scraping error:", err?.message || err);
    }
  }

  // Method 8: Scrape from Monster.com
  if (jobs.length < 35) {
    try {
      console.log("Trying Monster.com scraping...");
      const monsterJobs = await scrapeMonster(searchTerms);
      jobs.push(...monsterJobs);
      console.log(`Monster.com: Found ${monsterJobs.length} jobs`);
    } catch (err: any) {
      console.error("Monster.com scraping error:", err?.message || err);
    }
  }

  // Method 9: Scrape from SimplyHired
  if (jobs.length < 40) {
    try {
      console.log("Trying SimplyHired scraping...");
      const simplyHiredJobs = await scrapeSimplyHired(searchTerms);
      jobs.push(...simplyHiredJobs);
      console.log(`SimplyHired: Found ${simplyHiredJobs.length} jobs`);
    } catch (err: any) {
      console.error("SimplyHired scraping error:", err?.message || err);
    }
  }

  // Method 10: Scrape from Google Jobs via search
  if (jobs.length < 25) {
    try {
      console.log("Trying Naukri.com scraping...");
      const naukriJobs = await scrapeNaukri(searchTerms);
      jobs.push(...naukriJobs);
      console.log(`Naukri.com: Found ${naukriJobs.length} jobs`);
    } catch (err: any) {
      console.error("Naukri.com scraping failed:", err?.message || err);
    }
  }

  if (jobs.length < 35) {
    try {
      console.log("Trying Unstop.com scraping...");
      const unstopJobs = await scrapeUnstop(searchTerms);
      jobs.push(...unstopJobs);
      console.log(`Unstop.com: Found ${unstopJobs.length} jobs`);
    } catch (err: any) {
      console.error("Unstop.com scraping failed:", err?.message || err);
    }
  }

  if (jobs.length < 45) {
    try {
      console.log("Trying PlacementIndia.com scraping...");
      const placementJobs = await scrapePlacementIndia(searchTerms);
      jobs.push(...placementJobs);
      console.log(`PlacementIndia.com: Found ${placementJobs.length} jobs`);
    } catch (err: any) {
      console.error("PlacementIndia.com scraping failed:", err?.message || err);
    }
  }

  if (jobs.length < 45) {
    try {
      console.log("Trying Google Jobs scraping...");
      const googleJobs = await scrapeGoogleJobs(searchTerms);
      jobs.push(...googleJobs);
      console.log(`Google Jobs: Found ${googleJobs.length} jobs`);
    } catch (err: any) {
      console.error("Google Jobs scraping error:", err?.message || err);
    }
  }

  console.log(`Total scraped jobs: ${jobs.length}`);
  return jobs.slice(0, query.limit || 20);
}

// Scrape Remote.co (popular remote job board)
async function scrapeRemoteCo(searchTerms: string): Promise<JobItem[]> {
  try {
    // Try the main jobs page instead of search
    const searchUrl = `https://remote.co/remote-jobs/`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://remote.co/",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    const lowerSearchTerms = searchTerms.toLowerCase().split(' ');

    // Updated selectors for Remote.co 2024
    $('.job-item, .card, [data-job-id], .job-listing').each((_, el) => {
      if (jobs.length >= 6) return false;

      const title = $(el).find('h2, h3, .job-title, .title').first().text().trim();
      const company = $(el).find('.company, .company-name, .employer').first().text().trim();
      const location = $(el).find('.location, .job-location, .remote').first().text().trim() || "Remote";
      const link = $(el).find('a').first().attr('href');
      const description = $(el).find('.description, .job-description, .excerpt').first().text().trim() || title;

      // Filter jobs that match search terms
      const jobText = (title + " " + company + " " + description).toLowerCase();
      const matches = lowerSearchTerms.some(term =>
        term.length > 2 && jobText.includes(term)
      );

      if (title && company && title.length > 3 && (matches || jobs.length < 2)) {
        jobs.push({
          id: `remote-co-${Date.now()}-${jobs.length}`,
          title,
          company,
          location,
          description: description.substring(0, 300),
          url: link ? (link.startsWith('http') ? link : `https://remote.co${link}`) : undefined,
          source: "remote.co",
          skillsRequired: [],
        });
      }
    });

    console.log(`Remote.co: Parsed ${jobs.length} potential jobs from HTML`);

    return jobs.slice(0, 5);
  } catch (err: any) {
    console.error("Remote.co scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape Remote OK (remote job board)
async function scrapeRemoteOK(searchTerms: string): Promise<JobItem[]> {
  try {
    // Try the main remote jobs page first, then filter by search terms
    const searchUrl = `https://remoteok.com`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];
    const lowerSearchTerms = searchTerms.toLowerCase().split(' ');


    // Updated selectors for Remote OK - try table-based approach since it has table rows
    $('tbody tr').each((_, el) => {
      if (jobs.length >= 8) return false;

      // Remote OK uses table structure - try to extract from table cells
      const cells = $(el).find('td');
      if (cells.length >= 3) {
        const title = $(cells[0]).find('a, h2, .position').text().trim() ||
                     $(cells[0]).text().trim();

        const company = $(cells[1]).find('a, span, .company').text().trim() ||
                       $(cells[1]).text().trim();

        const location = $(cells[3]).text().trim() || "Remote";

        const link = $(cells[0]).find('a').attr('href') ||
                    $(el).find('a[href*="/remote-jobs/"]').attr('href');

        const description = $(cells[0]).text().trim() || title;

        // Only include if we have meaningful data
        if (title && title.length > 5 && company && company.length > 2) {
          jobs.push({
            id: `remote-ok-${Date.now()}-${jobs.length}`,
            title,
            company,
            location,
            description: description.substring(0, 400),
            url: link ? (link.startsWith('http') ? link : `https://remoteok.com${link}`) : undefined,
            source: "remoteok",
            skillsRequired: [],
          });
        }
      }
    });

    console.log(`Remote OK: Parsed ${jobs.length} potential jobs from HTML`);
    console.log(`Remote OK: Page title: ${$('title').text()}`);
    console.log(`Remote OK: Found ${$('tr').length} table rows, ${$('.job').length} job elements`);

    return jobs;
  } catch (err: any) {
    console.error("Remote OK scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape FlexJobs (premium remote jobs)
async function scrapeFlexJobs(searchTerms: string): Promise<JobItem[]> {
  try {
    // FlexJobs often blocks scraping, try main page instead
    const searchUrl = `https://www.flexjobs.com/`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.flexjobs.com/",
      },
      timeout: 8000, // Reduced timeout
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];
    const lowerSearchTerms = searchTerms.toLowerCase().split(' ');

    // Look for any job listings on the page
    $('.job-item, .card, [data-job-id], .job-listing').each((_, el) => {
      if (jobs.length >= 4) return false;

      const title = $(el).find('h3, .job-title, .title').first().text().trim();
      const company = $(el).find('.company, .company-name, .employer').first().text().trim();
      const location = $(el).find('.location, .job-location, .remote').first().text().trim() || "Remote";
      const link = $(el).find('a').first().attr('href');
      const description = $(el).find('.description, .job-description, .excerpt').first().text().trim() || title;

      // Filter jobs that match search terms
      const jobText = (title + " " + company + " " + description).toLowerCase();
      const matches = lowerSearchTerms.some(term =>
        term.length > 2 && jobText.includes(term)
      );

      if (title && company && title.length > 3 && (matches || jobs.length < 2)) {
        jobs.push({
          id: `flexjobs-${Date.now()}-${jobs.length}`,
          title,
          company,
          location,
          description: description.substring(0, 300),
          url: link ? (link.startsWith('http') ? link : `https://www.flexjobs.com${link}`) : undefined,
          source: "flexjobs",
          skillsRequired: [],
        });
      }
    });

    console.log(`FlexJobs: Parsed ${jobs.length} potential jobs from HTML`);
    return jobs.slice(0, 3); // Limit due to premium nature
  } catch (err: any) {
    console.error("FlexJobs scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape Naukri.com (Indian job board)
async function scrapeNaukri(searchTerms: string): Promise<JobItem[]> {
  try {
    // Use proper Naukri search URL format
    const searchUrl = `https://www.naukri.com/${encodeURIComponent(searchTerms)}-jobs-in-india`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9,en-US;q=0.8",
        "Referer": "https://www.naukri.com/",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    // Naukri uses different class names, try multiple selectors
    $('.jobTuple, .srp-jobtuple-wrapper, .jobTupleBG').each((_, el) => {
      const title = $(el).find('a.title, .jobtitle, .title').text().trim();
      const company = $(el).find('.companyName, .comp-name, .company').text().trim() ||
                     $(el).find('.subTitle').text().trim();
      const location = $(el).find('.location, .loc, .locationSpan').text().trim();
      const salary = $(el).find('.salary, .sal').text().trim();
      const link = $(el).find('a.title, .jobtitle').attr('href') ||
                  $(el).find('.title a').attr('href');
      const experience = $(el).find('.experience, .exp').text().trim();
      const description = $(el).find('.job-description, .ellipsis, .job-description-text').text().trim() ||
                         `${title} at ${company}`;

      if (title && company) {
        jobs.push({
          id: `naukri-${Date.now()}-${jobs.length}`,
          title,
          company,
          location: location || "India",
          description: `${description}${experience ? ` Experience: ${experience}` : ""}${salary ? ` Salary: ${salary}` : ""}`.trim(),
          url: link ? (link.startsWith('http') ? link : `https://www.naukri.com${link}`) : undefined,
          source: "naukri.com",
          skillsRequired: [],
        });
      }
    });

    return jobs.slice(0, 5);
  } catch (err: any) {
    console.error("Naukri.com scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape Monster.com (major job board)
async function scrapeMonster(searchTerms: string): Promise<JobItem[]> {
  try {
    const searchUrl = `https://www.monster.com/jobs/search?q=${encodeURIComponent(searchTerms)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    // Updated selectors for Monster.com 2024
    $('.card-content, .job-card, [data-jobid], .job-search-result').each((_, el) => {
      if (jobs.length >= 6) return false;

      const title = $(el).find('h2, h3, .job-title, .title, a').first().text().trim();
      const company = $(el).find('.company, .company-name, .employer, .company-location').first().text().trim();
      const location = $(el).find('.location, .job-location, .location-text').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      const description = $(el).find('.job-description, .summary, .preview, .job-snippet').first().text().trim() || title;

      if (title && company && title.length > 3) {
        jobs.push({
          id: `monster-${Date.now()}-${jobs.length}`,
          title,
          company,
          location: location || "Various",
          description: description.substring(0, 300),
          url: link ? (link.startsWith('http') ? link : `https://www.monster.com${link}`) : undefined,
          source: "monster.com",
          skillsRequired: [],
        });
      }
    });

    console.log(`Monster.com: Parsed ${jobs.length} potential jobs from HTML`);
    return jobs;
  } catch (err: any) {
    console.error("Monster.com scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape SimplyHired (job aggregator)
async function scrapeSimplyHired(searchTerms: string): Promise<JobItem[]> {
  try {
    const searchUrl = `https://www.simplyhired.com/search?q=${encodeURIComponent(searchTerms)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    $('.card, .job-card, [data-job-id]').each((_, el) => {
      const title = $(el).find('h3, .job-title, .title').text().trim();
      const company = $(el).find('.company, .job-company, .company-name').text().trim();
      const location = $(el).find('.location, .job-location, .location-text').text().trim();
      const salary = $(el).find('.salary, .job-salary').text().trim();
      const link = $(el).find('a').attr('href');
      const description = $(el).find('.job-description, .summary').text().trim() || title;

      if (title && company) {
        jobs.push({
          id: `simplyhired-${Date.now()}-${jobs.length}`,
          title,
          company,
          location: location || "Various",
          description: `${description}${salary ? ` Salary: ${salary}` : ""}`.trim(),
          url: link ? (link.startsWith('http') ? link : `https://www.simplyhired.com${link}`) : undefined,
          source: "simplyhired",
          skillsRequired: [],
        });
      }
    });

    return jobs.slice(0, 5);
  } catch (err: any) {
    console.error("SimplyHired scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape Reed.co.uk (free job board)
async function scrapeReedUK(searchTerms: string): Promise<JobItem[]> {
  try {
    // Reed.co.uk search URL
    const searchUrl = `https://www.reed.co.uk/jobs/${encodeURIComponent(searchTerms)}-jobs`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    // Parse Reed.co.uk job listings
    $('article[data-gtm="job-card"]').each((_, el) => {
      const title = $(el).find('h2 a, h3 a').text().trim();
      const company = $(el).find('.gtmJobListingPostedBy, .posted-by').text().trim();
      const location = $(el).find('.location, .gtmJobListingLocation').text().trim();
      const salary = $(el).find('.salary').text().trim();
      const link = $(el).find('h2 a, h3 a').attr('href');
      const description = $(el).find('.job-description').text().trim() || title;

      if (title && company) {
        jobs.push({
          id: `reed-${Date.now()}-${jobs.length}`,
          title,
          company,
          location: location || "UK",
          description: `${description} ${salary ? `Salary: ${salary}` : ""}`.trim(),
          url: link ? (link.startsWith('http') ? link : `https://www.reed.co.uk${link}`) : undefined,
          source: "reed.co.uk",
          skillsRequired: [], // Will be extracted from description later
        });
      }
    });

    return jobs;
  } catch (err: any) {
    console.error("Reed.co.uk scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape We Work Remotely (RSS feed) - Most reliable source
async function scrapeWeWorkRemotely(searchTerms: string): Promise<JobItem[]> {
  try {
    // We Work Remotely RSS feed - this should always work
    const rssUrl = "https://weworkremotely.com/remote-jobs.rss";

    const response = await axios.get(rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const jobs: JobItem[] = [];
    const lowerSearchTerms = searchTerms.toLowerCase().split(' ');

    // Parse RSS items
    $('item').each((_, el) => {
      if (jobs.length >= 15) return false; // Limit jobs

      const title = $(el).find('title').text().trim();
      const link = $(el).find('link').text().trim();
      const description = $(el).find('description').text().trim();
      const pubDate = $(el).find('pubDate').text().trim();

      // Extract company from title (format: "Company: Job Title")
      const titleMatch = title.match(/^(.+?):\s*(.+)$/);
      const company = titleMatch ? titleMatch[1] : "Remote Company";
      const jobTitle = titleMatch ? titleMatch[2] : title;

      // Always include jobs that match search terms, or include some jobs if no terms match
      const lowerTitle = jobTitle.toLowerCase();
      const lowerDesc = description.toLowerCase();

      const matches = lowerSearchTerms.some(term =>
        term.length > 2 && (lowerTitle.includes(term) || lowerDesc.includes(term))
      );

      // Include job if it matches search terms OR if we have few jobs and it's a recent posting
      if (matches || (jobs.length < 3 && jobTitle)) {
        jobs.push({
          id: `wwr-${Date.now()}-${jobs.length}`,
          title: jobTitle,
          company,
          location: "Remote",
          description: description.replace(/<[^>]*>/g, '').substring(0, 500),
          url: link,
          source: "weworkremotely",
          skillsRequired: [], // Will be extracted from description later
        });
      }
    });

    console.log(`We Work Remotely: Returning ${jobs.length} jobs`);
    return jobs;
  } catch (err: any) {
    console.error("We Work Remotely RSS failed:", err?.message || err);
    // Return some sample remote jobs as fallback
    return [
      {
        id: `fallback-wwr-1`,
        title: "Remote Software Developer",
        company: "Tech Startup",
        location: "Remote",
        description: "Looking for a skilled developer with experience in web technologies.",
        url: "https://weworkremotely.com",
        source: "weworkremotely-fallback",
        skillsRequired: ["javascript", "react", "nodejs"],
      },
      {
        id: `fallback-wwr-2`,
        title: "Full Stack Developer",
        company: "Remote Company",
        location: "Remote",
        description: "Remote position for full stack development with modern technologies.",
        url: "https://weworkremotely.com",
        source: "weworkremotely-fallback",
        skillsRequired: ["python", "django", "react"],
      }
    ];
  }
}

// Scrape Google Jobs search results
async function scrapeGoogleJobs(searchTerms: string): Promise<JobItem[]> {
  try {
    // Google Jobs search URL with better parameters
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerms)}+jobs&ibp=htl;jobs&start=0`;

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Cache-Control": "max-age=0",
      },
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    // Try multiple selectors for Google Jobs (Google changes these frequently)
    const selectors = [
      'div[data-ved]',
      '.jobsearch-JobInfoHeader',
      '.g .job',
      '[data-job-id]',
      '.job-result',
      '.jobsearch-SerpJobCard'
    ];

    selectors.forEach(selector => {
      if (jobs.length >= 6) return;

      $(selector).each((_, el) => {
        if (jobs.length >= 6) return false;

        // Try multiple approaches to find job data
        const title = $(el).find('h3, .jobtitle, .job-title').first().text().trim() ||
                     $(el).find('a').first().text().trim();

        const company = $(el).find('.company, .job-company, .employer').first().text().trim() ||
                       $(el).find('.jobsearch-JobMetadataHeader-item').first().text().trim();

        const location = $(el).find('.location, .job-location').first().text().trim() ||
                        $(el).find('.jobsearch-JobMetadataHeader-item').last().text().trim();

        const link = $(el).find('a').first().attr('href');

        if (title && company && title.length > 3) {
          jobs.push({
            id: `google-${Date.now()}-${jobs.length}`,
            title,
            company,
            location: location || "Various",
            description: `${title} at ${company}${location ? ` in ${location}` : ""}`,
            url: link ? (link.startsWith('http') ? link : `https://www.google.com${link}`) : undefined,
            source: "google-jobs",
            skillsRequired: [],
          });
        }
      });
    });

    console.log(`Google Jobs: Parsed ${jobs.length} potential jobs from HTML`);
    return jobs.slice(0, 5);
  } catch (err: any) {
    console.error("Google Jobs scraping failed:", err?.message || err);
    return [];
  }
}


// Scrape Unstop.com (Indian internships/jobs platform)
async function scrapeUnstop(searchTerms: string): Promise<JobItem[]> {
  try {
    // Unstop job search URL
    const searchUrl = `https://unstop.com/api/public/opportunity/search?page=1&limit=10&opportunity=talent&search=${encodeURIComponent(searchTerms)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://unstop.com/',
      },
      timeout: 10000,
    });

    const jobs: JobItem[] = [];
    const data = response.data?.data || [];

    data.forEach((job: any) => {
      if (jobs.length >= 5) return;

      const title = job.title || job.opportunityName || '';
      const company = job.organisationName || job.companyName || 'Unstop';
      const location = job.location || job.city || 'Remote/India';
      const description = job.description || job.opportunityDescription || '';
      const url = job.registration_link || `https://unstop.com/o/${job.id || job.opportunityId}`;

      if (title && company) {
        jobs.push({
          id: `unstop-${job.id || job.opportunityId || title}`.replace(/\s+/g, '-').toLowerCase(),
          title,
          company,
          location,
          description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
          url,
          skillsRequired: [], // Will be extracted later
          source: 'unstop',
        });
      }
    });

    console.log(`Unstop: Parsed ${jobs.length} opportunities from search: ${searchTerms}`);
    return jobs.slice(0, 5);
  } catch (err: any) {
    console.error("Unstop scraping failed:", err?.message || err);
    return [];
  }
}

// Scrape PlacementIndia.com (Indian job portal)
async function scrapePlacementIndia(searchTerms: string): Promise<JobItem[]> {
  try {
    // PlacementIndia search URL
    const searchUrl = `https://placementindia.com/job-search/${encodeURIComponent(searchTerms)}/`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const jobs: JobItem[] = [];

    // PlacementIndia job card selectors
    const selectors = [
      '.job-listing',
      '.job-item',
      '.job-card',
      '.vacancy-item'
    ];

    selectors.forEach(selector => {
      if (jobs.length >= 5) return;

      $(selector).each((_, el) => {
        if (jobs.length >= 5) return false;

        const $el = $(el);

        // Extract job details
        const title = $el.find('.job-title, h3, .title').first().text().trim() ||
                     $el.find('a').first().attr('title') ||
                     $el.find('a').first().text().trim();

        const company = $el.find('.company, .employer, .company-name').first().text().trim() ||
                       $el.find('.job-company').first().text().trim();

        const location = $el.find('.location, .job-location, .city').first().text().trim() ||
                        $el.find('.address').first().text().trim();

        const salary = $el.find('.salary, .pay, .compensation').first().text().trim();

        const description = $el.find('.description, .job-description, .summary').first().text().trim() ||
                           $el.find('.excerpt').first().text().trim();

        const link = $el.find('a').first().attr('href');
        const fullLink = link ? (link.startsWith('http') ? link : `https://placementindia.com${link}`) : '';

        // Skip if essential fields are missing
        if (!title) return;

        jobs.push({
          id: `placementindia-${title}-${company || 'company'}`.replace(/\s+/g, '-').toLowerCase(),
          title,
          company: company || 'PlacementIndia',
          location: location || 'India',
          description: description || `${title} opportunity`,
          url: fullLink,
          skillsRequired: [], // Will be extracted later
          source: 'placementindia',
        });
      });
    });

    console.log(`PlacementIndia: Parsed ${jobs.length} jobs from search: ${searchTerms}`);
    return jobs.slice(0, 5);
  } catch (err: any) {
    console.error("PlacementIndia scraping failed:", err?.message || err);
    return [];
  }
}


