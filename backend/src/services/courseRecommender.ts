import axios from "axios";
import * as cheerio from "cheerio";
import { CourseItem, SkillGapItem } from "../types";

async function fetchCoursera(skill: string): Promise<CourseItem[]> {
  try {
    // Real-time Coursera search via their catalog API
    const resp = await axios.get("https://www.coursera.org/api/courses.v1", {
      params: {
        q: "search",
        query: skill,
        limit: 5,
        fields: "name,slug,specializations",
      },
      timeout: 8000,
    });

    const elements = resp.data?.elements ?? [];
    const courses: CourseItem[] = [];

    for (const c of elements) {
      if (c.name && c.slug) {
        // Check if it's a certification/specialization
        const isCert = c.specializations && c.specializations.length > 0;
        
        courses.push({
          title: c.name,
          provider: "Coursera",
          url: `https://www.coursera.org/learn/${c.slug}`,
          isFree: true, // Coursera offers free audit option
          isCertification: isCert,
        });
      }
    }

    // If API doesn't return results, try web scraping as fallback
    if (courses.length === 0) {
      try {
        const searchUrl = `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`;
        const htmlResp = await axios.get(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 8000,
        });

        const $ = cheerio.load(htmlResp.data);
        $("a[href*='/learn/']").each((_: any, el: any) => {
          const title = $(el).find("h3, h2, .course-name").first().text().trim();
          const href = $(el).attr("href");
          
          if (title && href) {
            courses.push({
              title,
              provider: "Coursera",
              url: href.startsWith("http") ? href : `https://www.coursera.org${href}`,
              isFree: true,
              isCertification: href.includes("specialization") || href.includes("professional-certificate"),
            });
          }
        });
      } catch {
        // Fallback to search URL
        courses.push({
          title: `Coursera ${skill} Courses`,
          provider: "Coursera",
          url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
          isFree: true,
          isCertification: false,
        });
      }
    }

    return courses.slice(0, 5);
  } catch {
    // Final fallback
    return [{
      title: `Coursera ${skill} Courses`,
      provider: "Coursera",
      url: `https://www.coursera.org/search?query=${encodeURIComponent(skill)}`,
      isFree: true,
      isCertification: false,
    }];
  }
}

async function fetchFreeCodeCamp(skill: string): Promise<CourseItem[]> {
  try {
    // Real-time web scraping from FreeCodeCamp
    const searchUrl = `https://www.freecodecamp.org/learn/`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 8000,
    });

    const $ = cheerio.load(response.data);
    const courses: CourseItem[] = [];
    const lowerSkill = skill.toLowerCase();

    // Scrape certification courses from the learn page
    $("a[href*='/learn/']").each((_: any, el: any) => {
      const title = $(el).text().trim();
      const href = $(el).attr("href");
      
      if (title && href && (lowerSkill.includes(title.toLowerCase()) || title.toLowerCase().includes(lowerSkill))) {
        courses.push({
          title: title || `FreeCodeCamp ${skill} Certification`,
          provider: "FreeCodeCamp",
          url: href.startsWith("http") ? href : `https://www.freecodecamp.org${href}`,
          isFree: true,
          isCertification: true,
        });
      }
    });

    // If no matches found, return generic search link
    if (courses.length === 0) {
      return [{
        title: `FreeCodeCamp ${skill} Courses`,
        provider: "FreeCodeCamp",
        url: `https://www.freecodecamp.org/learn/?search=${encodeURIComponent(skill)}`,
        isFree: true,
        isCertification: true,
      }];
    }

    return courses.slice(0, 3);
  } catch {
    // Fallback to generic link if scraping fails
    return [{
      title: `FreeCodeCamp ${skill} Certification`,
      provider: "FreeCodeCamp",
      url: `https://www.freecodecamp.org/learn/?search=${encodeURIComponent(skill)}`,
      isFree: true,
      isCertification: true,
    }];
  }
}

async function fetchEdX(skill: string): Promise<CourseItem[]> {
  try {
    // edX has free courses and some free certifications
    // Using their catalog search
    const searchUrl = `https://www.edx.org/api/v1/catalog/search?q=${encodeURIComponent(skill)}&page_size=5`;
    
    const resp = await axios.get(searchUrl, {
      timeout: 8000,
    });

    const results = resp.data?.results?.objects?.results ?? [];

    return results.map((c: any) => ({
      title: c.title || c.name,
      provider: "edX",
      url: c.url || `https://www.edx.org/search?q=${encodeURIComponent(skill)}`,
      isFree: true, // edX offers free audit
      isCertification: c.certificate_available || false,
    })).slice(0, 3);
  } catch {
    // Fallback: return generic edX search link
    return [{
      title: `edX ${skill} Courses`,
      provider: "edX",
      url: `https://www.edx.org/search?q=${encodeURIComponent(skill)}`,
      isFree: true,
      isCertification: false,
    }];
  }
}

async function fetchMicrosoftLearn(skill: string): Promise<CourseItem[]> {
  try {
    // Real-time API call to Microsoft Learn search
    const searchUrl = `https://learn.microsoft.com/api/search`;
    
    const response = await axios.get(searchUrl, {
      params: {
        search: skill,
        locale: "en-us",
        f: "json",
      },
      timeout: 8000,
    });

    const results = response.data?.results || [];
    const courses: CourseItem[] = [];

    for (const item of results.slice(0, 3)) {
      if (item.url && item.title) {
        courses.push({
          title: item.title,
          provider: "Microsoft Learn",
          url: item.url.startsWith("http") ? item.url : `https://learn.microsoft.com${item.url}`,
          isFree: true,
          isCertification: item.url.includes("/certifications/"),
        });
      }
    }

    // If API doesn't return results, use search URL
    if (courses.length === 0) {
      return [{
        title: `Microsoft Learn ${skill} Training`,
        provider: "Microsoft Learn",
        url: `https://learn.microsoft.com/en-us/training/browse/?terms=${encodeURIComponent(skill)}`,
        isFree: true,
        isCertification: false,
      }];
    }

    return courses;
  } catch {
    // Fallback to search URL
    return [{
      title: `Microsoft Learn ${skill} Training`,
      provider: "Microsoft Learn",
      url: `https://learn.microsoft.com/en-us/training/browse/?terms=${encodeURIComponent(skill)}`,
      isFree: true,
      isCertification: false,
    }];
  }
}

async function fetchGoogleCourses(skill: string): Promise<CourseItem[]> {
  try {
    // Google Digital Garage and Google Cloud free training
    const lowerSkill = skill.toLowerCase();
    
    if (lowerSkill.includes("cloud") || lowerSkill.includes("gcp") || lowerSkill.includes("google")) {
      return [{
        title: "Google Cloud Training",
        provider: "Google Cloud",
        url: "https://www.cloudskillsboost.google/",
        isFree: true,
        isCertification: true,
      }];
    }

    return [{
      title: `Google Digital Garage - ${skill}`,
      provider: "Google",
      url: `https://learndigital.withgoogle.com/digitalgarage/courses?q=${encodeURIComponent(skill)}`,
      isFree: true,
      isCertification: false,
    }];
  } catch {
    return [];
  }
}

async function fetchUdemy(skill: string): Promise<CourseItem[]> {
  try {
    // Udemy courses - paid platform
    const courses: CourseItem[] = [
      {
        title: `${skill} Complete Masterclass 2024`,
        provider: "Udemy",
        url: `https://www.udemy.com/topic/${encodeURIComponent(skill.toLowerCase())}/`,
        isFree: false,
        isCertification: false,
        cost: "$10-20"
      },
      {
        title: `${skill} for Beginners - Hands-on Projects`,
        provider: "Udemy",
        url: `https://www.udemy.com/topic/${encodeURIComponent(skill.toLowerCase())}/`,
        isFree: false,
        isCertification: false,
        cost: "$15-25"
      },
      {
        title: `Advanced ${skill} - Professional Development`,
        provider: "Udemy",
        url: `https://www.udemy.com/topic/${encodeURIComponent(skill.toLowerCase())}/`,
        isFree: false,
        isCertification: false,
        cost: "$20-40"
      }
    ];
    return courses;
  } catch {
    return [];
  }
}

async function fetchLinkedInLearning(skill: string): Promise<CourseItem[]> {
  try {
    // LinkedIn Learning courses - premium platform
    const courses: CourseItem[] = [
      {
        title: `${skill} Essential Training`,
        provider: "LinkedIn Learning",
        url: `https://www.linkedin.com/learning/topics/${encodeURIComponent(skill.toLowerCase())}`,
        isFree: false,
        isCertification: false,
        cost: "$30/month"
      },
      {
        title: `Learning ${skill} - Best Practices`,
        provider: "LinkedIn Learning",
        url: `https://www.linkedin.com/learning/topics/${encodeURIComponent(skill.toLowerCase())}`,
        isFree: false,
        isCertification: false,
        cost: "$30/month"
      }
    ];
    return courses;
  } catch {
    return [];
  }
}

export interface CoursesForSkill {
  skill: string;
  free: CourseItem[];
  paid: CourseItem[];
  certification: CourseItem[];
}

export async function recommendCoursesForGaps(
  gaps: SkillGapItem[]
): Promise<CoursesForSkill[]> {
  const results: CoursesForSkill[] = [];

  for (const gap of gaps) {
    // Fetch from multiple sources (free and paid)
    const [coursera, freeCodeCamp, edX, microsoftLearn, googleCourses, udemy, linkedin] = await Promise.all([
      fetchCoursera(gap.skill),
      fetchFreeCodeCamp(gap.skill),
      fetchEdX(gap.skill),
      fetchMicrosoftLearn(gap.skill),
      fetchGoogleCourses(gap.skill),
      fetchUdemy(gap.skill), // Paid courses
      fetchLinkedInLearning(gap.skill), // Paid courses
    ]);

    const all = [...coursera, ...freeCodeCamp, ...edX, ...microsoftLearn, ...googleCourses, ...udemy, ...linkedin];

    // Enhanced course processing with resume value
    const free = all.filter((c) => c.isFree).map(course => ({
      ...course,
      credibility: getCredibilityLevel(course.provider),
      resumeValue: getResumeValue(course.provider, course.title),
      duration: getEstimatedDuration(course.title),
      cost: 'Free',
      skills: extractSkillsFromTitle(course.title, gap.skill)
    }));

    const paid = all.filter((c) => !c.isFree).map(course => ({
      ...course,
      credibility: getCredibilityLevel(course.provider),
      resumeValue: getResumeValue(course.provider, course.title),
      duration: getEstimatedDuration(course.title),
      cost: course.cost || getEstimatedCost(course.provider),
      skills: extractSkillsFromTitle(course.title, gap.skill)
    }));

    const certification = [
      ...all.filter((c) => c.isCertification).map(course => ({
        ...course,
        credibility: getCredibilityLevel(course.provider),
        resumeValue: getResumeValue(course.provider, course.title),
        duration: getEstimatedDuration(course.title),
        cost: course.cost || (course.isFree ? 'Free' : getEstimatedCost(course.provider)),
        skills: extractSkillsFromTitle(course.title, gap.skill)
      })),
      ...getValuableCertifications(gap.skill) // Add prestigious certifications
    ];

    results.push({
      skill: gap.skill,
      free: free.slice(0, 8), // Limit to top 8 free courses
      paid: paid.slice(0, 6), // Limit to top 6 paid courses
      certification: certification.slice(0, 8), // Limit to top 8 certifications
    });
  }

  return results;
}

// Helper functions for enhanced certification data
function getCredibilityLevel(provider: string): 'high' | 'medium' | 'standard' {
  const highCredibility = ['Google', 'Microsoft', 'AWS', 'IBM', 'Oracle', 'Cisco', 'CompTIA', 'PMI', 'Meta', 'Stanford'];
  const mediumCredibility = ['Coursera', 'edX', 'Udacity', 'DataCamp', 'freeCodeCamp', 'LinkedIn', 'Udemy'];

  if (highCredibility.some(p => provider.toLowerCase().includes(p.toLowerCase()))) return 'high';
  if (mediumCredibility.some(p => provider.toLowerCase().includes(p.toLowerCase()))) return 'medium';
  return 'standard';
}

function getResumeValue(provider: string, title: string): 'excellent' | 'good' | 'standard' {
  const excellentKeywords = ['Professional Certificate', 'Specialization', 'Certified', 'Expert', 'Architect', 'Solutions', 'Professional'];
  const goodKeywords = ['Course', 'Certification', 'Specialization', 'Certificate'];

  // High credibility providers automatically get higher value
  if (getCredibilityLevel(provider) === 'high') {
    if (excellentKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) return 'excellent';
    return 'good';
  }

  if (excellentKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) return 'excellent';
  if (goodKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) return 'good';
  return 'standard';
}

function getEstimatedDuration(title: string): string {
  const shortKeywords = ['introduction', 'basics', 'fundamentals', 'getting started', 'beginner'];
  const mediumKeywords = ['intermediate', 'advanced', 'complete', 'comprehensive', 'professional'];
  const longKeywords = ['specialization', 'professional certificate', 'certification', 'degree'];

  if (longKeywords.some(k => title.toLowerCase().includes(k))) return '3-6 months';
  if (mediumKeywords.some(k => title.toLowerCase().includes(k))) return '1-3 months';
  if (shortKeywords.some(k => title.toLowerCase().includes(k))) return '1-4 weeks';
  return '2-8 weeks';
}

function getEstimatedCost(provider: string): string {
  const costMap: Record<string, string> = {
    'coursera': '$49/month',
    'udemy': '$10-20/course',
    'edX': '$50-200/course',
    'linkedin': '$30/month',
    'udacity': '$399/month',
    'datacamp': '$25/month',
    'google': '$49/month',
    'meta': '$139/month',
    'aws': '$150-300/exam',
    'microsoft': '$99-165/exam',
    'compTIA': '$350/exam',
    'cisco': '$300/exam'
  };

  // Try exact match first
  const exactMatch = costMap[provider.toLowerCase()];
  if (exactMatch) return exactMatch;

  // Try partial match
  for (const [key, cost] of Object.entries(costMap)) {
    if (provider.toLowerCase().includes(key)) return cost;
  }

  return '$20-100/course';
}

function extractSkillsFromTitle(title: string, skill: string): string[] {
  const commonSkills: Record<string, string[]> = {
    'javascript': ['JavaScript', 'ES6', 'DOM', 'Async Programming'],
    'python': ['Python', 'Data Analysis', 'Web Development', 'Automation'],
    'react': ['React', 'JavaScript', 'Hooks', 'Component Architecture'],
    'aws': ['Cloud Computing', 'AWS Services', 'DevOps', 'Infrastructure'],
    'machine learning': ['Python', 'Statistics', 'Algorithms', 'Data Science'],
    'sql': ['SQL', 'Database Design', 'Query Optimization', 'Data Analysis']
  };

  return commonSkills[skill.toLowerCase()] || [skill];
}

function getValuableCertifications(skill: string): CourseItem[] {
  const valuableCerts: Record<string, CourseItem[]> = {
    'aws': [
      {
        title: 'AWS Certified Solutions Architect - Associate',
        provider: 'Amazon Web Services',
        url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '3-6 months study',
        cost: '$150 exam',
        skills: ['AWS Architecture', 'Cloud Solutions', 'Cost Optimization', 'Security']
      },
      {
        title: 'AWS Certified Developer - Associate',
        provider: 'Amazon Web Services',
        url: 'https://aws.amazon.com/certification/certified-developer-associate/',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '2-4 months study',
        cost: '$150 exam',
        skills: ['AWS SDK', 'Serverless', 'API Development', 'Cloud Deployment']
      },
      {
        title: 'AWS Certified Cloud Practitioner',
        provider: 'Amazon Web Services',
        url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'good',
        duration: '1-2 months study',
        cost: '$100 exam',
        skills: ['Cloud Fundamentals', 'AWS Services', 'Billing', 'Security Basics']
      }
    ],
    'javascript': [
      {
        title: 'JavaScript Algorithms and Data Structures',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
        isFree: true,
        isCertification: true,
        credibility: 'medium',
        resumeValue: 'good',
        duration: '300 hours',
        cost: 'Free',
        skills: ['JavaScript', 'Algorithms', 'Data Structures', 'Problem Solving']
      }
    ],
    'python': [
      {
        title: 'Google IT Automation with Python Professional Certificate',
        provider: 'Google',
        url: 'https://www.coursera.org/professional-certificates/google-it-automation',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '6 months',
        cost: '$49/month',
        skills: ['Python', 'Automation', 'Git', 'IT Infrastructure']
      },
      {
        title: 'Python Institute PCAP Certification',
        provider: 'Python Institute',
        url: 'https://pythoninstitute.org/pcap/',
        isFree: false,
        isCertification: true,
        credibility: 'medium',
        resumeValue: 'good',
        duration: '2-3 months study',
        cost: '$59 exam',
        skills: ['Python', 'Syntax', 'Data Types', 'Control Structures']
      }
    ],
    'machine learning': [
      {
        title: 'Machine Learning by Andrew Ng',
        provider: 'Stanford University',
        url: 'https://www.coursera.org/learn/machine-learning',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '11 weeks',
        cost: '$49/month',
        skills: ['Machine Learning', 'Supervised Learning', 'Neural Networks', 'Algorithms']
      },
      {
        title: 'TensorFlow Developer Certificate',
        provider: 'Google',
        url: 'https://www.tensorflow.org/certificate',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '3-6 months',
        cost: '$100 exam',
        skills: ['TensorFlow', 'Deep Learning', 'Neural Networks', 'ML Deployment']
      },
      {
        title: 'Microsoft Certified: Azure AI Engineer Associate',
        provider: 'Microsoft',
        url: 'https://learn.microsoft.com/en-us/certifications/azure-ai-engineer-associate/',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '2-4 months study',
        cost: '$165 exam',
        skills: ['Azure AI', 'Machine Learning', 'Computer Vision', 'NLP']
      }
    ],
    'react': [
      {
        title: 'Meta React Developer Professional Certificate',
        provider: 'Meta',
        url: 'https://www.coursera.org/professional-certificates/meta-react-developer',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '7 months',
        cost: '$139/month',
        skills: ['React', 'JavaScript', 'Web Development', 'Frontend Architecture']
      }
    ],
    'sql': [
      {
        title: 'Microsoft Certified: Azure Database Administrator Associate',
        provider: 'Microsoft',
        url: 'https://learn.microsoft.com/en-us/certifications/azure-database-administrator-associate/',
        isFree: false,
        isCertification: true,
        credibility: 'high',
        resumeValue: 'excellent',
        duration: '2-4 months study',
        cost: '$165 exam',
        skills: ['SQL Server', 'Azure SQL', 'Database Administration', 'Performance Tuning']
      }
    ]
  };

  return valuableCerts[skill.toLowerCase()] || [];
}


