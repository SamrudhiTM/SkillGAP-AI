import { JobItem } from "../types";
import { fetchFromJSearch, JobQuery } from "../jobSources/jsearch";
import { fetchFromAdzuna } from "../jobSources/adzuna";
import { fetchFromScraper } from "../jobSources/scraper";
import { fetchFromIndeed, fetchFromLinkedIn, fetchFromFreeJobs, fetchFromWellfound } from "../jobSources/freeApis";
import axios from "axios";
import { SkillNormalizer } from "./skillNormalizer";
import { skillWeightCache } from "./skillWeightCache";
import { fuzzyMatcher } from "./fuzzySkillMatcher";

// Enhanced skill extraction from job descriptions using advanced pattern matching
function extractSkillsFromText(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const found = new Set<string>();

  // Extract text from specific sections
  const sections = extractSectionsFromJobDescription(text);

  // Process each section with different priorities
  const allText = sections.fullText + " " + sections.requirements + " " + sections.experience + " " + sections.skills;

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
    // Frontend Technologies
    /\b(html|css|sass|scss|tailwind|bootstrap|webpack|vite|babel|redux|mobx|jquery|axios|fetch)\b/gi,
    // Mobile Development
    /\b(react native|flutter|ios|android|swift|kotlin|xamarin|ionic|cordova|capacitor|expo)\b/gi,
    // Testing Frameworks
    /\b(jest|mocha|cypress|selenium|pytest|junit|testng|rspec|cucumber|karma|enzyme|testing|tdd|bdd)\b/gi,
    // Operating Systems
    /\b(linux|ubuntu|windows|macos|unix|bash|shell|powershell)\b/gi,
    // Version Control & Collaboration
    /\b(git|svn|mercurial|github|gitlab|bitbucket|confluence|wiki)\b/gi,
    // Design & UI/UX
    /\b(figma|sketch|adobe|photoshop|illustrator|zeplin|invision|principle|framer|after effects)\b/gi,
  ];

  for (const pattern of skillPatterns) {
    const matches = allText.match(pattern);
    if (matches) {
      matches.forEach(m => {
        const cleaned = m.toLowerCase().trim();
        // More lenient filtering and normalization
        if (cleaned.length > 1 && cleaned.length < 50 && !cleaned.includes('years') && !cleaned.includes('experience')) {
          // Remove common prefixes/suffixes that create incomplete matches
          const normalized = cleaned
            .replace(/^with\s+/, '') // Remove "with " prefix
            .replace(/^in\s+/, '') // Remove "in " prefix
            .replace(/^and\s+/, '') // Remove "and " prefix
            .replace(/^the\s+/, '') // Remove "the " prefix
            .replace(/^for\s+/, '') // Remove "for " prefix
            .replace(/,$/, '') // Remove trailing commas
            .replace(/\.$/, '') // Remove trailing periods
            .trim();

          // Only add if it's still a reasonable skill name
          if (normalized.length > 1 && normalized.length < 30 && !normalized.includes(' ')) {
            // ✅ NEW: Normalize skill to canonical form
            const canonicalSkill = SkillNormalizer.normalize(normalized);
            if (canonicalSkill) {
              found.add(canonicalSkill);
            }
          }
        }
      });
    }
  }

  // Additional extraction from specific sections with higher priority
  if (sections.requirements) {
    extractSkillsFromSection(sections.requirements, found);
  }
  if (sections.skills) {
    extractSkillsFromSection(sections.skills, found);
  }
  if (sections.experience) {
    extractSkillsFromSection(sections.experience, found);
  }

  return Array.from(found);
}

// Extract specific sections from job descriptions
function extractSectionsFromJobDescription(text: string): {
  fullText: string;
  requirements: string;
  skills: string;
  experience: string;
  qualifications: string;
} {
  const lowerText = text.toLowerCase();

  // Common section headers to look for
  const sectionPatterns = {
    requirements: /(?:requirements?|what we'?re looking for|what you'?ll need|must have|required skills?|qualifications?|job requirements?)/gi,
    skills: /(?:skills?|technical skills?|key skills?|core competencies?|competencies?)/gi,
    experience: /(?:experience|work experience|professional experience|previous experience|years of experience)/gi,
    qualifications: /(?:qualifications?|education|certifications?|degrees?)/gi,
  };

  const sections = {
    fullText: text,
    requirements: "",
    skills: "",
    experience: "",
    qualifications: "",
  };

  // Extract sections based on headers
  for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
    const matches = [...lowerText.matchAll(pattern)];
    if (matches.length > 0) {
      // Find the section content after the header
      const headerMatch = matches[0];
      const headerIndex = headerMatch.index!;
      const headerEnd = headerIndex + headerMatch[0].length;

      // Look for the next section header or end of text
      let sectionEnd = text.length;
      for (const [otherSection, otherPattern] of Object.entries(sectionPatterns)) {
        if (otherSection !== sectionName) {
          const otherMatches = [...lowerText.matchAll(otherPattern)];
          const nextMatch = otherMatches.find(m => m.index! > headerIndex);
          if (nextMatch && nextMatch.index! < sectionEnd) {
            sectionEnd = nextMatch.index!;
          }
        }
      }

      // Extract section content (up to 500 chars to avoid too much text)
      const sectionContent = text.substring(headerEnd, sectionEnd).trim();
      if (sectionContent.length > 0 && sectionContent.length < 1000) {
        sections[sectionName as keyof typeof sections] = sectionContent;
      }
    }
  }

  return sections;
}

// Extract skills from specific sections with context awareness
function extractSkillsFromSection(sectionText: string, foundSkills: Set<string>) {
  const lowerText = sectionText.toLowerCase();

  // Look for bullet points and numbered lists
  const bulletPoints = sectionText.split(/[•\-\*\d+\.]\s*/).filter(item => item.trim().length > 0);

  for (const bullet of bulletPoints) {
    if (bullet.length < 100) { // Skip very long bullets
      // Extract skills from bullet points
      const skillMatches = bullet.match(/\b[a-z][a-z\s\-\+#\.]+[a-z]\b/gi);
      if (skillMatches) {
        skillMatches.forEach(match => {
          const cleaned = match.toLowerCase().trim();
          if (cleaned.length > 2 && cleaned.length < 30 && !cleaned.includes('years') && !cleaned.includes('experience')) {
            foundSkills.add(cleaned);
          }
        });
      }
    }
  }
}

function normalizeSkillsFromText(text: string, baseSkills: string[]): string[] {
  const lowered = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of baseSkills) {
    const s = skill.toLowerCase();
    if (s && lowered.includes(s)) {
      found.add(s);
    }
  }

  return Array.from(found);
}

function dedupeJobs(jobs: JobItem[]): JobItem[] {
  const seen = new Map<string, JobItem>();
  const duplicatesRemoved = [];

  for (const job of jobs) {
    // More specific deduplication key to avoid removing similar jobs
    const key = job.url || `${job.title}-${job.company}-${job.source}`;
    if (!seen.has(key)) {
      seen.set(key, job);
      duplicatesRemoved.push(job);
    }
  }

  console.log(`Deduplication: ${jobs.length} → ${duplicatesRemoved.length} jobs`);
  return duplicatesRemoved;
}

// Generate skill-specific jobs for popular technologies
function generateSkillSpecificJobs(skills: string[], limit: number): JobItem[] {
  const skillSet = new Set(skills.map(s => s.toLowerCase().trim()));
  const jobs: JobItem[] = [];

  const companies = [
    "Google", "Microsoft", "Amazon", "Meta", "Netflix", "Uber", "Airbnb", "Spotify",
    "Stripe", "Shopify", "GitHub", "Slack", "Discord", "Notion", "Figma", "Canva"
  ];

  const locations = [
    "San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Remote",
    "London, UK", "Berlin, Germany", "Toronto, Canada", "Bangalore, India"
  ];

  // React-specific jobs
  if (skillSet.has('react') || skillSet.has('javascript')) {
    jobs.push({
      id: `react-frontend-${Date.now()}`,
      title: "Senior React Frontend Developer",
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      description: "Join our team as a Senior React Developer. You'll work with modern JavaScript frameworks, build responsive user interfaces, and collaborate with cross-functional teams.",
      url: "https://example.com/careers/react-developer",
      source: "sample-generated",
      skillsRequired: ["react", "javascript", "html", "css", "typescript"]
    });

    jobs.push({
      id: `react-native-${Date.now()}`,
      title: "React Native Mobile Developer",
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      description: "Build cross-platform mobile applications using React Native. Experience with iOS and Android development required.",
      url: "https://example.com/careers/react-native-developer",
      source: "sample-generated",
      skillsRequired: ["react native", "react", "javascript", "ios", "android"]
    });
  }

  // Node.js/Backend jobs
  if (skillSet.has('node') || skillSet.has('express') || skillSet.has('javascript')) {
    jobs.push({
      id: `nodejs-backend-${Date.now()}`,
      title: "Node.js Backend Developer",
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      description: "Develop scalable backend services using Node.js and Express. Work with REST APIs, databases, and cloud infrastructure.",
      url: "https://example.com/careers/nodejs-developer",
      source: "sample-generated",
      skillsRequired: ["nodejs", "express", "javascript", "mongodb", "rest api"]
    });
  }

  // Python jobs
  if (skillSet.has('python')) {
    jobs.push({
      id: `python-developer-${Date.now()}`,
      title: "Python Backend Developer",
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      description: "Build robust backend systems with Python. Experience with Django, Flask, or FastAPI preferred.",
      url: "https://example.com/careers/python-developer",
      source: "sample-generated",
      skillsRequired: ["python", "django", "postgresql", "rest api", "git"]
    });
  }

  // AWS/Cloud jobs
  if (skillSet.has('aws') || skillSet.has('docker')) {
    jobs.push({
      id: `aws-engineer-${Date.now()}`,
      title: "AWS Cloud Engineer",
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      description: "Design and maintain cloud infrastructure on AWS. Experience with EC2, S3, Lambda, and containerization required.",
      url: "https://example.com/careers/aws-engineer",
      source: "sample-generated",
      skillsRequired: ["aws", "docker", "kubernetes", "terraform", "python"]
    });
  }

  // Database jobs
  if (skillSet.has('mongodb') || skillSet.has('oracle') || skillSet.has('sql')) {
    jobs.push({
      id: `database-admin-${Date.now()}`,
      title: "Database Administrator",
      company: companies[Math.floor(Math.random() * companies.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      description: "Manage and optimize database systems. Experience with MongoDB, Oracle, or SQL Server required.",
      url: "https://example.com/careers/database-admin",
      source: "sample-generated",
      skillsRequired: ["mongodb", "oracle", "sql", "linux", "bash"]
    });
  }

  return jobs.slice(0, limit);
}

// 🚀 DYNAMIC Market Demand Calculator - Replaces Hard-coded Weights
async function calculateSkillImportance(userSkills: string[], allJobs: JobItem[] = []): Promise<Record<string, number>> {
  console.log(`🔄 Calculating dynamic market demand for ${userSkills.length} skills from ${allJobs.length} jobs`);
  
  if (allJobs.length === 0) {
    console.log("⚠️ No job data available, using enhanced fallback weights");
    return getEnhancedFallbackWeights(userSkills);
  }

  // STEP 1: Analyze Real Market Data
  const marketAnalysis = await analyzeRealTimeMarketData(allJobs);
  
  // STEP 2: Calculate Dynamic Weights for User Skills
  const skillImportance: Record<string, number> = {};
  let cacheHits = 0;
  let cacheMisses = 0;
  
  for (const skill of userSkills) {
    const normalizedSkill = skill.toLowerCase().trim();
    
    // ✅ NEW: Check cache first
    const cachedWeight = skillWeightCache.get(normalizedSkill, allJobs.length);
    
    if (cachedWeight !== null) {
      skillImportance[normalizedSkill] = cachedWeight;
      cacheHits++;
      console.log(`💾 ${normalizedSkill}: ${cachedWeight.toFixed(3)} (cached)`);
    } else {
      const dynamicWeight = calculateDynamicSkillWeight(normalizedSkill, marketAnalysis);
      skillImportance[normalizedSkill] = dynamicWeight;
      
      // ✅ NEW: Cache the calculated weight
      skillWeightCache.set(normalizedSkill, dynamicWeight, allJobs.length);
      cacheMisses++;
      
      console.log(`📊 ${normalizedSkill}: ${dynamicWeight.toFixed(3)} (demand: ${marketAnalysis.skillDemand.get(normalizedSkill) || 0}, salary: ${marketAnalysis.skillSalaries.get(normalizedSkill) || 0})`);
    }
  }

  console.log(`✅ Dynamic market analysis complete. Average weight: ${(Object.values(skillImportance).reduce((a, b) => a + b, 0) / Object.values(skillImportance).length).toFixed(3)}`);
  console.log(`📈 Cache performance: ${cacheHits} hits, ${cacheMisses} misses (${cacheHits > 0 ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1) : 0}% hit rate)`);
  return skillImportance;
}

// 📈 Real-Time Market Data Analysis
async function analyzeRealTimeMarketData(jobs: JobItem[]): Promise<MarketAnalysis> {
  const analysis: MarketAnalysis = {
    skillDemand: new Map(),
    skillSalaries: new Map(),
    skillCompanyTiers: new Map(),
    skillGrowthTrend: new Map(),
    totalJobs: jobs.length,
    avgSalary: 0,
    topCompanies: new Set()
  };

  let totalSalarySum = 0;
  let salaryCount = 0;

  // ANALYZE EACH JOB
  for (const job of jobs) {
    // Extract skills from job description
    const jobSkills = extractSkillsFromText(job.description || job.title || '');
    
    // Extract salary information
    const salary = extractSalaryFromJob(job);
    if (salary > 0) {
      totalSalarySum += salary;
      salaryCount++;
    }
    
    // Determine company tier (1-5 scale)
    const companyTier = determineCompanyTier(job.company || '');
    
    // Track top companies
    if (companyTier >= 4) {
      analysis.topCompanies.add(job.company || '');
    }

    // PROCESS EACH SKILL IN JOB
    for (const skill of jobSkills) {
      const normalizedSkill = skill.toLowerCase().trim();
      if (normalizedSkill.length < 2) continue;

      // 1. DEMAND FREQUENCY
      analysis.skillDemand.set(
        normalizedSkill, 
        (analysis.skillDemand.get(normalizedSkill) || 0) + 1
      );

      // 2. SALARY CORRELATION
      if (salary > 0) {
        const salaries = analysis.skillSalaries.get(normalizedSkill) || [];
        salaries.push(salary);
        analysis.skillSalaries.set(normalizedSkill, salaries);
      }

      // 3. COMPANY TIER CORRELATION
      const currentMaxTier = analysis.skillCompanyTiers.get(normalizedSkill) || 0;
      analysis.skillCompanyTiers.set(
        normalizedSkill, 
        Math.max(currentMaxTier, companyTier)
      );
    }
  }

  analysis.avgSalary = salaryCount > 0 ? totalSalarySum / salaryCount : 75000;
  
  console.log(`📊 Market Analysis: ${analysis.skillDemand.size} unique skills, avg salary: $${analysis.avgSalary.toLocaleString()}, top companies: ${analysis.topCompanies.size}`);
  return analysis;
}

// 🧮 Dynamic Weight Calculation Formula
function calculateDynamicSkillWeight(skill: string, analysis: MarketAnalysis): number {
  const demand = analysis.skillDemand.get(skill) || 0;
  const salaries = analysis.skillSalaries.get(skill) || [];
  const maxCompanyTier = analysis.skillCompanyTiers.get(skill) || 1;

  // COMPONENT 1: Demand Score (40% weight)
  // Formula: log-normalized frequency to prevent outliers
  const demandScore = demand > 0 ? 
    Math.log(demand + 1) / Math.log(analysis.totalJobs + 1) : 0;

  // COMPONENT 2: Salary Premium Score (35% weight)  
  // Formula: Compare skill salary to market average
  const avgSkillSalary = salaries.length > 0 ? 
    salaries.reduce((a, b) => a + b, 0) / salaries.length : analysis.avgSalary;
  const salaryPremium = avgSkillSalary / analysis.avgSalary;
  const salaryScore = Math.min(salaryPremium, 2.0) / 2.0; // Normalize to 0-1, cap at 2x

  // COMPONENT 3: Company Tier Score (15% weight)
  // Formula: Normalize company tier to 0-1 scale
  const tierScore = maxCompanyTier / 5.0;

  // COMPONENT 4: Market Penetration Score (10% weight)
  // Formula: How widespread is this skill across different companies
  const penetrationScore = Math.min(demand / Math.max(analysis.topCompanies.size, 1), 1.0);

  // 🎯 FINAL DYNAMIC WEIGHT FORMULA
  const dynamicWeight = (
    (demandScore * 0.40) +      // Market demand
    (salaryScore * 0.35) +      // Salary premium  
    (tierScore * 0.15) +        // Company quality
    (penetrationScore * 0.10)   // Market penetration
  );

  // Apply skill-specific adjustments
  const adjustedWeight = applySkillSpecificAdjustments(skill, dynamicWeight, analysis);
  
  // Ensure weight is between 0.1 and 1.0
  return Math.max(0.1, Math.min(1.0, adjustedWeight));
}

// 🎯 Skill-Specific Adjustments
function applySkillSpecificAdjustments(skill: string, baseWeight: number, analysis: MarketAnalysis): number {
  let adjustedWeight = baseWeight;

  // EMERGING TECHNOLOGY BONUS
  const emergingTech = ['ai', 'machine learning', 'blockchain', 'web3', 'rust', 'go', 'kubernetes', 'terraform'];
  if (emergingTech.some(tech => skill.includes(tech))) {
    adjustedWeight *= 1.2; // 20% bonus for emerging tech
  }

  // FOUNDATIONAL SKILL PENALTY (they're common but necessary)
  const foundationalSkills = ['html', 'css', 'git', 'agile', 'scrum'];
  if (foundationalSkills.includes(skill)) {
    adjustedWeight *= 0.7; // Reduce weight for very common skills
  }

  // HIGH-DEMAND PROGRAMMING LANGUAGES BONUS
  const highDemandLangs = ['python', 'javascript', 'typescript', 'java', 'go', 'rust'];
  if (highDemandLangs.includes(skill)) {
    adjustedWeight *= 1.1; // 10% bonus for high-demand languages
  }

  // CLOUD/DEVOPS PREMIUM
  const cloudSkills = ['aws', 'azure', 'gcp', 'docker', 'kubernetes'];
  if (cloudSkills.some(cloud => skill.includes(cloud))) {
    adjustedWeight *= 1.15; // 15% bonus for cloud skills
  }

  return adjustedWeight;
}

// 💰 Extract Salary from Job Description
function extractSalaryFromJob(job: JobItem): number {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  
  // Salary patterns: $50k, $50,000, 50k-60k, $50-60k, etc.
  const salaryPatterns = [
    /\$(\d{2,3}),?(\d{3})\s*-?\s*\$?(\d{2,3}),?(\d{3})?/g,  // $50,000-$60,000
    /\$(\d{2,3})k?\s*-?\s*\$?(\d{2,3})k?/g,                  // $50k-$60k
    /(\d{2,3}),?(\d{3})\s*-?\s*(\d{2,3}),?(\d{3})?\s*(?:per year|annually)/g, // 50,000-60,000 per year
    /salary.*?(\d{2,3}),?(\d{3})/g                           // salary: 50,000
  ];

  for (const pattern of salaryPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      // Extract first number and convert to annual salary
      const firstNum = parseInt(match[1] + (match[2] || '000'));
      return firstNum > 1000 ? firstNum : firstNum * 1000; // Handle k notation
    }
  }

  // Default salary based on job title keywords
  if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
    return 120000;
  } else if (text.includes('junior') || text.includes('entry')) {
    return 65000;
  }
  
  return 85000; // Default mid-level salary
}

// 🏢 Determine Company Tier (1-5 scale)
function determineCompanyTier(companyName: string): number {
  if (!companyName) return 2;
  
  const company = companyName.toLowerCase();
  
  // Tier 5: FAANG + Top Tech
  const tier5 = ['google', 'apple', 'microsoft', 'amazon', 'meta', 'facebook', 'netflix', 'tesla', 'nvidia', 'openai'];
  if (tier5.some(t5 => company.includes(t5))) return 5;
  
  // Tier 4: Major Tech Companies
  const tier4 = ['uber', 'airbnb', 'spotify', 'stripe', 'shopify', 'github', 'gitlab', 'slack', 'zoom', 'salesforce'];
  if (tier4.some(t4 => company.includes(t4))) return 4;
  
  // Tier 3: Established Companies
  const tier3 = ['ibm', 'oracle', 'adobe', 'intel', 'cisco', 'vmware', 'atlassian', 'dropbox'];
  if (tier3.some(t3 => company.includes(t3))) return 3;
  
  // Tier 2: Default for unknown companies
  return 2;
}

// 🔄 Enhanced Fallback Weights (when no job data available)
function getEnhancedFallbackWeights(userSkills: string[]): Record<string, number> {
  const enhancedWeights: Record<string, number> = {
    // 2024 High-Demand Skills (based on industry reports)
    'python': 0.95, 'javascript': 0.92, 'typescript': 0.88, 'java': 0.82,
    'react': 0.90, 'nodejs': 0.85, 'aws': 0.93, 'docker': 0.87,
    'kubernetes': 0.85, 'terraform': 0.82, 'go': 0.88, 'rust': 0.85,
    
    // AI/ML Premium Skills
    'machine learning': 0.94, 'ai': 0.92, 'tensorflow': 0.80, 'pytorch': 0.82,
    'data science': 0.88, 'pandas': 0.75, 'numpy': 0.70,
    
    // Cloud & DevOps
    'azure': 0.90, 'gcp': 0.87, 'jenkins': 0.75, 'ansible': 0.78,
    'ci/cd': 0.80, 'microservices': 0.85,
    
    // Databases
    'postgresql': 0.78, 'mongodb': 0.75, 'redis': 0.72, 'sql': 0.70,
    
    // Frontend Frameworks
    'vue': 0.82, 'angular': 0.80, 'svelte': 0.75, 'nextjs': 0.85,
    
    // Mobile
    'react native': 0.83, 'flutter': 0.80, 'ios': 0.78, 'android': 0.78,
    
    // Foundational (lower weights due to commonality)
    'html': 0.50, 'css': 0.52, 'git': 0.60, 'linux': 0.65,
    'agile': 0.58, 'scrum': 0.55, 'jira': 0.50
  };

  const skillImportance: Record<string, number> = {};
  for (const skill of userSkills) {
    const normalizedSkill = skill.toLowerCase().trim();
    skillImportance[normalizedSkill] = enhancedWeights[normalizedSkill] || 0.65; // Higher default
  }

  return skillImportance;
}

// 📊 Market Analysis Interface
interface MarketAnalysis {
  skillDemand: Map<string, number>;           // How many jobs require this skill
  skillSalaries: Map<string, number[]>;       // Salary data for each skill
  skillCompanyTiers: Map<string, number>;     // Highest company tier for each skill
  skillGrowthTrend: Map<string, number>;      // Growth trend (future enhancement)
  totalJobs: number;                          // Total jobs analyzed
  avgSalary: number;                          // Market average salary
  topCompanies: Set<string>;                  // Set of top-tier companies
}

// Build skill relationship graph to understand skill centrality and clusters
function buildSkillRelationshipGraph(userSkills: string[]): Record<string, { centrality: number, relatedSkills: string[] }> {
  // Define skill clusters and relationships
  const skillClusters = {
    frontend: ['html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular', 'webpack'],
    backend: ['nodejs', 'python', 'java', 'django', 'flask', 'spring', 'express', 'sql'],
    devops: ['docker', 'kubernetes', 'aws', 'azure', 'linux', 'terraform', 'ci/cd'],
    data: ['python', 'machine learning', 'tensorflow', 'pandas', 'sql', 'spark'],
    mobile: ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin']
  };

  const relationships: Record<string, { centrality: number, relatedSkills: string[] }> = {};

  for (const skill of userSkills) {
    const normalizedSkill = skill.toLowerCase();
    let centrality = 0;
    const relatedSkills: string[] = [];

    // Calculate centrality based on cluster membership
    for (const [clusterName, clusterSkills] of Object.entries(skillClusters)) {
      if (clusterSkills.includes(normalizedSkill)) {
        centrality += 0.8; // High centrality for cluster membership
        relatedSkills.push(...clusterSkills.filter(s => s !== normalizedSkill));
      }
    }

    // Cross-cluster relationships
    if (normalizedSkill === 'javascript') {
      centrality += 0.6; // JavaScript connects frontend and backend
      relatedSkills.push('nodejs', 'react', 'typescript');
    }

    if (normalizedSkill === 'python') {
      centrality += 0.5; // Python connects backend and data science
      relatedSkills.push('django', 'flask', 'machine learning');
    }

    relationships[normalizedSkill] = {
      centrality: Math.min(centrality, 1.0),
      relatedSkills: [...new Set(relatedSkills)] // Remove duplicates
    };
  }

  return relationships;
}

// Calculate bonus for jobs that require related skills
function calculateRelationshipBonus(
  matchedSkills: Array<{skill: string, weight: number, centrality: number}>,
  skillRelationships: Record<string, { centrality: number, relatedSkills: string[] }>,
  job: JobItem
): number {
  const jobSkills = job.skillsRequired.map(s => s.toLowerCase().trim());
  let relationshipScore = 0;

  for (const matchedSkill of matchedSkills) {
    const skillRelations = skillRelationships[matchedSkill.skill];
    if (skillRelations) {
      // Check if job requires related skills
      const relatedSkillsInJob = skillRelations.relatedSkills.filter(relatedSkill =>
        jobSkills.includes(relatedSkill)
      );

      if (relatedSkillsInJob.length > 0) {
        relationshipScore += 0.3; // Bonus for each related skill cluster
      }

      // Bonus for skill centrality in job requirements
      const centralityBonus = skillRelations.centrality * 0.2;
      relationshipScore += centralityBonus;
    }
  }

  return Math.min(relationshipScore, 1.0); // Cap at 1.0
}

// Categorize skills into meaningful groups for targeted job searches
function categorizeSkills(skills: string[]): Record<string, string[]> {
  const skillSet = new Set(skills.map(s => s.toLowerCase().trim()));

  const categories: Record<string, string[]> = {
    frontend: [],
    backend: [],
    database: [],
    cloud: [],
    devops: [],
    ai: [],
    tools: [],
    other: []
  };

  // Frontend skills
  const frontendSkills = ['html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular', 'sass', 'scss', 'tailwind', 'bootstrap', 'webpack', 'vite'];
  frontendSkills.forEach(skill => {
    if (skillSet.has(skill)) categories.frontend.push(skill);
  });

  // Backend skills
  const backendSkills = ['nodejs', 'express', 'python', 'java', 'django', 'flask', 'spring', 'php', 'ruby', 'go', 'rust', 'c#', 'asp.net', 'laravel', 'rails'];
  backendSkills.forEach(skill => {
    if (skillSet.has(skill)) categories.backend.push(skill);
  });

  // Database skills
  const databaseSkills = ['mongodb', 'postgresql', 'mysql', 'oracle', 'sql', 'redis', 'sqlite', 'dynamodb', 'cassandra'];
  databaseSkills.forEach(skill => {
    if (skillSet.has(skill)) categories.database.push(skill);
  });

  // Cloud skills
  const cloudSkills = ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform'];
  cloudSkills.forEach(skill => {
    if (skillSet.has(skill)) categories.cloud.push(skill);
  });

  // DevOps/CI-CD skills
  const devopsSkills = ['linux', 'bash', 'ci/cd', 'jenkins', 'gitlab ci', 'github actions', 'ansible'];
  devopsSkills.forEach(skill => {
    if (skillSet.has(skill)) categories.devops.push(skill);
  });

  // AI/ML skills
  const aiSkills = ['ai', 'machine learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'jupyter'];
  aiSkills.forEach(skill => {
    if (skillSet.has(skill)) categories.ai.push(skill);
  });

  // Tools and other skills
  const toolSkills = ['git', 'rest api', 'graphql', 'postman', 'jira', 'agile', 'scrum'];
  toolSkills.forEach(skill => {
    if (skillSet.has(skill)) categories.tools.push(skill);
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

// Create targeted job queries based on skill categories
function createTargetedJobQueries(skillGroups: Record<string, string[]>, originalQuery: JobQuery): JobQuery[] {
  const queries: JobQuery[] = [];

  // Create queries for each major skill category combination
  const categoryKeys = Object.keys(skillGroups);

  // Full-stack queries (frontend + backend)
  if (skillGroups.frontend?.length > 0 && skillGroups.backend?.length > 0) {
    const fullstackSkills = [...skillGroups.frontend.slice(0, 2), ...skillGroups.backend.slice(0, 2)];
    queries.push({
      ...originalQuery,
      skills: fullstackSkills,
      role: 'full stack developer'
    });
  }

  // Frontend-focused queries
  if (skillGroups.frontend?.length > 0) {
    queries.push({
      ...originalQuery,
      skills: skillGroups.frontend.slice(0, 4),
      role: 'frontend developer'
    });
  }

  // Backend-focused queries
  if (skillGroups.backend?.length > 0) {
    queries.push({
      ...originalQuery,
      skills: skillGroups.backend.slice(0, 4),
      role: 'backend developer'
    });
  }

  // Database + Backend queries
  if (skillGroups.database?.length > 0 && skillGroups.backend?.length > 0) {
    const dbBackendSkills = [...skillGroups.backend.slice(0, 2), ...skillGroups.database.slice(0, 2)];
    queries.push({
      ...originalQuery,
      skills: dbBackendSkills,
      role: 'backend developer'
    });
  }

  // Cloud/DevOps queries
  if (skillGroups.cloud?.length > 0 || skillGroups.devops?.length > 0) {
    const cloudSkills = [...(skillGroups.cloud || []), ...(skillGroups.devops || [])].slice(0, 4);
    queries.push({
      ...originalQuery,
      skills: cloudSkills,
      role: 'devops engineer'
    });
  }

  // AI/Data Science queries
  if (skillGroups.ai?.length > 0) {
    queries.push({
      ...originalQuery,
      skills: skillGroups.ai.slice(0, 4),
      role: 'data scientist'
    });
  }

  // Generic software engineering with diverse skills
  if (queries.length < 3) {
    const diverseSkills: string[] = [];
    categoryKeys.forEach(cat => {
      if (skillGroups[cat].length > 0) {
        diverseSkills.push(skillGroups[cat][0]); // Take one skill from each category
      }
    });

    if (diverseSkills.length >= 3) {
      queries.push({
        ...originalQuery,
        skills: diverseSkills.slice(0, 5),
        role: 'software engineer'
      });
    }
  }

  // Fallback: ensure we have at least some queries
  if (queries.length === 0) {
    const allSkills = categoryKeys.flatMap(cat => skillGroups[cat]);
    queries.push({
      ...originalQuery,
      skills: allSkills.slice(0, 6),
      role: 'developer'
    });
  }

  console.log(`🎯 Created ${queries.length} targeted job queries`);
  queries.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.role}: [${q.skills?.join(', ')}]`);
  });

  return queries.slice(0, 6); // Limit to prevent too many API calls
}

// Generate template-based jobs as fallback
function generateTemplateJobs(skills: string[], limit: number): JobItem[] {
  const resumeSkillsSet = new Set(skills.map(s => s.toLowerCase().trim()));
  const topResumeSkills = skills.slice(0, Math.min(5, skills.length));

  // Job templates that match multiple skills
  const jobTemplates = [
    {
      title: "Full Stack Developer",
      requiredSkills: ["javascript", "react", "nodejs", "html", "css"],
      description: "Seeking a full stack developer proficient in modern web technologies including JavaScript, React, Node.js, and responsive design."
    },
    {
      title: "Backend Developer",
      requiredSkills: ["python", "django", "postgresql", "rest api", "docker"],
      description: "Looking for a backend developer experienced in Python, Django, PostgreSQL, REST APIs, and containerization with Docker."
    },
    {
      title: "Frontend Developer",
      requiredSkills: ["javascript", "react", "typescript", "css", "webpack"],
      description: "Frontend developer position requiring expertise in JavaScript, React, TypeScript, CSS, and modern build tools."
    },
    {
      title: "DevOps Engineer",
      requiredSkills: ["aws", "docker", "kubernetes", "terraform", "ci/cd"],
      description: "DevOps engineer needed with experience in AWS, Docker, Kubernetes, Terraform, and CI/CD pipelines."
    },
    {
      title: "Data Scientist",
      requiredSkills: ["python", "machine learning", "pandas", "scikit-learn", "sql"],
      description: "Data scientist role requiring Python, machine learning, pandas, scikit-learn, and SQL expertise."
    },
    {
      title: "Mobile App Developer",
      requiredSkills: ["react native", "javascript", "ios", "android", "typescript"],
      description: "Mobile app developer position using React Native, JavaScript, TypeScript for iOS and Android platforms."
    },
    {
      title: "Cloud Architect",
      requiredSkills: ["aws", "terraform", "docker", "kubernetes", "python"],
      description: "Cloud architect needed for designing scalable infrastructure with AWS, Terraform, Docker, and Kubernetes."
    },
    {
      title: "Software Engineer",
      requiredSkills: ["java", "spring", "mysql", "git", "agile"],
      description: "Software engineer position using Java, Spring Framework, MySQL, Git version control, and Agile methodologies."
    }
  ];

  const companies = [
    "TechCorp Solutions", "Innovation Labs", "Digital Dynamics", "CloudTech Systems",
    "DataFlow Analytics", "WebWorks Studio", "AppDev Pro", "CodeMasters Inc",
    "DevOps Central", "StartupHub", "Global Tech", "Future Systems"
  ];

  const locations = [
    "Remote", "San Francisco, CA", "New York, NY", "Austin, TX",
    "Seattle, WA", "Boston, MA", "London, UK", "Toronto, Canada"
  ];

  const jobs: JobItem[] = [];

  // Create jobs that match user's skills as closely as possible
  for (let i = 0; i < limit && jobs.length < limit; i++) {
    const template = jobTemplates[i % jobTemplates.length];
    const company = companies[i % companies.length];
    const location = locations[i % locations.length];

    // Customize job requirements to match user's skills
    let requiredSkills = [...template.requiredSkills];

    // Replace generic skills with user's actual skills where possible
    const userTechSkills = skills.filter(s =>
      ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'aws', 'docker'].includes(s.toLowerCase())
    );

    // Mix user's skills with job requirements for better relevance
    const mixedSkills = [
      ...userTechSkills.slice(0, 3), // User's top skills
      ...requiredSkills.filter(s => !resumeSkillsSet.has(s.toLowerCase())).slice(0, 2) // Some missing skills
    ];

    // Ensure we have at least 3 skills and at least 2 matches with user's resume
    if (mixedSkills.length < 3) {
      mixedSkills.push(...requiredSkills.slice(0, 3 - mixedSkills.length));
    }

    // Calculate how many skills this job matches
    const matchingSkills = mixedSkills.filter(s => resumeSkillsSet.has(s.toLowerCase()));
    if (matchingSkills.length < 2 && i < jobTemplates.length) {
      // Skip jobs that don't match at least 2 user skills, unless we've exhausted templates
      continue;
    }

    const jobTitle = template.title;
    const key = `${jobTitle}-${company}`;

    // Create job description mentioning the required skills
    const description = `We are looking for a ${jobTitle.toLowerCase()} to join our team. ${template.description} Your experience with ${mixedSkills.slice(0, 3).join(", ")} would be perfect for this role.`;

    jobs.push({
      id: `sample-${Date.now()}-${i}`,
      title: jobTitle,
      company,
      location,
      description,
      url: `https://example.com/careers/${jobTitle.toLowerCase().replace(/\s+/g, "-")}`,
      source: "sample-generated",
      skillsRequired: mixedSkills.slice(0, 5), // Limit to 5 skills
    });
  }

  // If we still don't have enough jobs, create generic ones
  while (jobs.length < limit && topResumeSkills.length > 0) {
    const primarySkill = topResumeSkills[jobs.length % topResumeSkills.length];
    const jobTitle = `${primarySkill.charAt(0).toUpperCase() + primarySkill.slice(1)} Developer`;
    const company = companies[jobs.length % companies.length];
    const location = locations[jobs.length % locations.length];

    const otherSkills = skills.filter(s => s !== primarySkill).slice(0, 2);
    const requiredSkills = [primarySkill, ...otherSkills];

    jobs.push({
      id: `sample-fallback-${Date.now()}-${jobs.length}`,
      title: jobTitle,
      company,
      location,
      description: `Seeking a skilled ${primarySkill} developer with experience in ${requiredSkills.join(", ")}. Join our team and work on exciting projects.`,
      url: `https://example.com/jobs/${jobTitle.toLowerCase().replace(/\s+/g, "-")}`,
      source: "sample-generated",
      skillsRequired: requiredSkills,
    });
  }

  console.log(`Generated ${jobs.length} highly relevant sample jobs`);
  return jobs;
}

// Map skills to appropriate job roles for better search results
function inferJobRolesFromSkills(skills: string[]): string[] {
  const skillSet = new Set(skills.map(s => s.toLowerCase().trim()));

  const roleMappings: { [key: string]: string[] } = {
    // Frontend Development
    'frontend': ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'typescript'],
    'frontend-developer': ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'typescript'],
    'ui-developer': ['html', 'css', 'javascript', 'react', 'typescript'],
    'web-developer': ['html', 'css', 'javascript', 'react', 'vue', 'angular'],

    // Backend Development
    'backend': ['nodejs', 'python', 'java', 'php', 'ruby', 'go', 'rust', 'express', 'django', 'flask', 'spring'],
    'backend-developer': ['nodejs', 'python', 'java', 'php', 'ruby', 'express', 'django', 'flask'],
    'api-developer': ['nodejs', 'python', 'rest api', 'graphql', 'express', 'django'],
    'fullstack-developer': ['javascript', 'nodejs', 'react', 'html', 'css', 'python', 'java'],

    // Full Stack
    'full-stack': ['javascript', 'nodejs', 'react', 'html', 'css', 'python', 'java', 'sql'],
    'fullstack': ['javascript', 'nodejs', 'react', 'html', 'css', 'python', 'java', 'sql'],

    // Data Science & ML
    'data-scientist': ['python', 'machine learning', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
    'ml-engineer': ['python', 'machine learning', 'tensorflow', 'pytorch', 'scikit-learn'],
    'data-engineer': ['python', 'sql', 'spark', 'kafka', 'airflow'],

    // DevOps & Cloud
    'devops-engineer': ['docker', 'kubernetes', 'aws', 'azure', 'linux', 'ci/cd', 'terraform'],
    'cloud-engineer': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
    'platform-engineer': ['docker', 'kubernetes', 'terraform', 'ansible', 'linux'],

    // Mobile Development
    'mobile-developer': ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
    'ios-developer': ['swift', 'ios', 'objective-c', 'xcode'],
    'android-developer': ['kotlin', 'java', 'android', 'android studio'],

    // Database & System
    'database-administrator': ['sql', 'postgresql', 'mysql', 'mongodb', 'oracle'],
    'dba': ['sql', 'postgresql', 'mysql', 'mongodb', 'oracle'],
    'system-administrator': ['linux', 'windows', 'bash', 'powershell', 'networking'],

    // QA & Testing
    'qa-engineer': ['testing', 'selenium', 'cypress', 'jest', 'junit'],
    'test-engineer': ['testing', 'selenium', 'cypress', 'jest', 'automation'],

    // General Software Development
    'software-developer': ['javascript', 'python', 'java', 'git', 'sql'],
    'software-engineer': ['javascript', 'python', 'java', 'git', 'sql', 'algorithms'],
    'developer': ['javascript', 'python', 'java', 'html', 'css'],
    'programmer': ['javascript', 'python', 'java', 'c++', 'c#'],
  };

  const inferredRoles: string[] = [];
  const matchedRoles = new Map<string, number>();

  // Check each role mapping
  for (const [role, requiredSkills] of Object.entries(roleMappings)) {
    let matchCount = 0;
    for (const requiredSkill of requiredSkills) {
      if (skillSet.has(requiredSkill.toLowerCase())) {
        matchCount++;
      }
    }

    // If user has 50% or more of the required skills for a role, consider it a match
    if (matchCount >= Math.ceil(requiredSkills.length * 0.4)) {
      matchedRoles.set(role, matchCount);
    }
  }

  // Sort by match count (descending) and return top roles
  let sortedRoles = Array.from(matchedRoles.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([role]) => role);

  // Add some fallback general roles if no specific matches
  if (sortedRoles.length === 0) {
    if (skillSet.has('javascript') || skillSet.has('python') || skillSet.has('java')) {
      sortedRoles.push('software developer', 'software engineer');
    }
    if (skillSet.has('html') || skillSet.has('css')) {
      sortedRoles.push('web developer', 'frontend developer');
    }
  }

  // For users with extensive technical skills, ensure we focus on developer roles
  const hasTechnicalSkills = skillSet.has('javascript') || skillSet.has('python') || skillSet.has('java') ||
                            skillSet.has('react') || skillSet.has('node') || skillSet.has('html') || skillSet.has('css');

  if (hasTechnicalSkills && skillSet.size >= 3) {
    // Ensure we have core developer roles
    const devRoles = ['software engineer', 'full stack developer', 'web developer'];
    const existingDevRoles = sortedRoles.filter(role =>
      devRoles.some(dev => role.toLowerCase().includes(dev.split(' ')[0]))
    );

    if (existingDevRoles.length === 0) {
      // Add default developer roles if none exist
      sortedRoles = ['software engineer', 'full stack developer', ...sortedRoles.slice(0, 1)];
    }
  }

  // Always include some general developer roles as fallbacks
  if (sortedRoles.length < 3) {
    const fallbackRoles = ['software developer', 'developer', 'programmer'];
    for (const role of fallbackRoles) {
      if (!sortedRoles.includes(role)) {
        sortedRoles.push(role);
      }
    }
  }

  console.log(`Inferred job roles from skills ${Array.from(skillSet).join(', ')}:`, sortedRoles.slice(0, 3));
  console.log(`Final roles to query:`, sortedRoles.slice(0, 3));
  return sortedRoles.slice(0, 3); // Return top 3 most relevant roles
}

export async function recommendJobsForSkills(query: JobQuery): Promise<JobItem[]> {
  const limit = query.limit || 30;

  // ✅ NEW: Normalize all user skills first
  const normalizedSkills = SkillNormalizer.normalizeArray(query.skills);
  console.log(`🔧 Normalized ${query.skills.length} skills: ${query.skills.slice(0, 3).join(', ')} → ${normalizedSkills.slice(0, 3).join(', ')}`);
  
  // Update query with normalized skills
  query.skills = normalizedSkills;

  // Determine the best job search strategy based on skills
  const hasDeveloperSkills = normalizedSkills.some(skill =>
    ['javascript', 'python', 'java', 'react', 'nodejs', 'html', 'css', 'git'].includes(skill)
  );
  console.log(`🎯 Has developer skills: ${hasDeveloperSkills}, skills checked: ${normalizedSkills.slice(0, 5).join(', ')}...`);

  let searchQueries: JobQuery[];

  if (hasDeveloperSkills) {
    // Smart skill-based job searching instead of generic roles
    const allSkills = query.skills;
    console.log(`🔧 Processing ${allSkills.length} developer skills: [${allSkills.join(', ')}]`);

    // Group skills by category for targeted searches
    const skillGroups = categorizeSkills(allSkills);
    console.log(`📊 Skill categories:`, Object.keys(skillGroups).map(cat =>
      `${cat}(${skillGroups[cat].length})`
    ).join(', '));

    searchQueries = createTargetedJobQueries(skillGroups, query);
  } else {
    // For other skill sets, use inferred roles with limited skills
    const inferredRoles = inferJobRolesFromSkills(query.skills);
    const topSkills = query.skills.slice(0, 2); // Limit skills for non-dev searches
    searchQueries = inferredRoles.slice(0, 3).map(role => ({
      ...query,
      skills: topSkills,
      role
    }));
  }

  console.log("Fetching jobs from multiple sources...");
  console.log("Using search queries:", searchQueries.map(q => q.role || 'skill-based'));

  // Fetch jobs using proven role-based queries with expanded sources
  const allJobsPromises: Promise<JobItem[]>[] = [];

  for (const roleQuery of searchQueries) {
    allJobsPromises.push(
      fetchFromJSearch(roleQuery).catch(err => {
        console.error(`JSearch failed for ${roleQuery.role || 'skills'}:`, err.message);
        return [];
      }),
      fetchFromAdzuna(roleQuery).catch(err => {
        console.error(`Adzuna failed for ${roleQuery.role || 'skills'}:`, err.message);
        return [];
      }),
      fetchFromIndeed(roleQuery).catch(err => {
        console.error(`Indeed failed for ${roleQuery.role || 'skills'}:`, err.message);
        return [];
      }),
      fetchFromLinkedIn(roleQuery).catch(err => {
        console.error(`LinkedIn failed for ${roleQuery.role || 'skills'}:`, err.message);
        return [];
      }),
      fetchFromFreeJobs(roleQuery).catch(err => {
        console.error(`FreeJobs failed for ${roleQuery.role || 'skills'}:`, err.message);
        return [];
      }),
      fetchFromWellfound(roleQuery).catch(err => {
        console.error(`Wellfound failed for ${roleQuery.role || 'skills'}:`, err.message);
        return [];
      })
    );
  }

  console.log(`Making ${allJobsPromises.length} job queries across all sources...`);

  // Execute all queries and flatten results
  const allJobResults = await Promise.all(allJobsPromises);
  let jobs = dedupeJobs(allJobResults.flat());

  console.log(`Total jobs from all queries: ${jobs.length}`);

  // Always try scraper for additional jobs using the primary role
  console.log("Fetching additional jobs from scrapers...");
  try {
    const primaryRole = searchQueries[0]?.role || 'software engineer';
    const scraperQuery = { ...query, role: primaryRole };
    const scraped = await fetchFromScraper(scraperQuery);
    console.log(`Scraper: ${scraped.length} jobs`);
    if (scraped.length > 0) {
      jobs = dedupeJobs([...jobs, ...scraped]);
    }
  } catch (err) {
    console.error("Scraper failed:", err);
  }

  console.log(`Total jobs after scraping: ${jobs.length}`);

  // If very few jobs found, supplement with sample jobs based on skills
  if (jobs.length < 5) {
    console.log(`Only ${jobs.length} jobs found, supplementing with sample jobs based on skills...`);
    const sampleJobs = generateSkillSpecificJobs(query.skills, Math.max(5, (query.limit || 30) - jobs.length));
    jobs = dedupeJobs([...jobs, ...sampleJobs]);
    console.log(`Total jobs after adding samples: ${jobs.length}`);
  }

  // Real-time skill extraction from job descriptions and compute missing skills
  const resumeSkillsSet = new Set(query.skills.map(s => s.toLowerCase().trim()));

  const enriched: JobItem[] = jobs.map((job, i) => {
    let skills = job.skillsRequired || [];

    // Extract skills from description in real-time if not provided
    if (skills.length === 0 && job.description) {
      skills = extractSkillsFromText(job.description);
    }

    // Also match against user's skills to show relevance
    if (query.skills.length > 0 && job.description) {
      const matched = normalizeSkillsFromText(job.description, query.skills);
      // Merge with extracted skills, prioritizing matched ones
      const allSkills = new Set([...matched, ...skills]);
      skills = Array.from(allSkills);
    }

    // Calculate missing skills for this specific job
    const missingSkills = skills
      .map(s => s.toLowerCase().trim())
      .filter(skill => skill && !resumeSkillsSet.has(skill));

    const enrichedJob = {
      ...job,
      skillsRequired: skills,
      missingSkills: missingSkills.slice(0, 5), // Top 5 missing skills per job
    };

    if (i < 3) { // Log first 3 jobs for debugging
      console.log(`Job ${i + 1}: ${job.title}`, {
        requiredSkills: skills.length,
        missingSkills: missingSkills.length,
        missing: missingSkills.slice(0, 3),
      });
    }

    return enrichedJob;
  });

  console.log(`Final job count: ${enriched.length}`);
  console.log(`Jobs by source:`, enriched.reduce((acc, job) => {
    acc[job.source] = (acc[job.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>));

  // Advanced relevance scoring with dynamic skill importance
  if (query.skills.length > 0) {
    // 🚀 Dynamic skill importance based on REAL market data and relationships
    const skillImportance = await calculateSkillImportance(query.skills, enriched);
    const skillRelationships = buildSkillRelationshipGraph(query.skills);

    const userSkillsWithWeights = query.skills.map(skill => ({
      skill: skill.toLowerCase(),
      importance: skillImportance[skill.toLowerCase()] || 0.5,
      centrality: skillRelationships[skill.toLowerCase()]?.centrality || 0.5
    }));

    // Calculate relevance score using dynamic skill importance
    const scoredJobs = enriched.map(job => {
      const allJobSkills = job.skillsRequired.map(s => s.toLowerCase().trim());
      const matchedSkills: Array<{skill: string, weight: number, centrality: number}> = [];

      // Calculate weighted matches using dynamic importance
      for (const jobSkill of allJobSkills) {
        const userSkillData = userSkillsWithWeights.find(s => s.skill === jobSkill);
        if (userSkillData) {
          matchedSkills.push({
            skill: userSkillData.skill,
            weight: userSkillData.importance,
            centrality: userSkillData.centrality
          });
        }
      }

      const matchCount = matchedSkills.length;
      const totalJobSkills = job.skillsRequired.length;

      // Calculate comprehensive relevance score
      let relevanceScore = 0;

      if (matchCount > 0) {
        // Weighted skill matching (50% of score)
        const totalUserSkillWeight = userSkillsWithWeights.reduce((sum, s) => sum + s.importance, 0);
        const matchedSkillWeight = matchedSkills.reduce((sum, s) => sum + s.weight, 0);
        const skillMatchScore = totalUserSkillWeight > 0 ? (matchedSkillWeight / totalUserSkillWeight) * 50 : 0;

        // Skill centrality bonus (20% of score) - rewards jobs that match central skills
        const avgCentrality = matchedSkills.reduce((sum, s) => sum + s.centrality, 0) / Math.max(matchCount, 1);
        const centralityScore = avgCentrality * 20;

        // Coverage percentage (15% of score) - how much of the job's skills are covered
        const coverageScore = (matchCount / totalJobSkills) * 15;

        // Relationship bonus (15% of score) - bonus for related skill matches
        const relationshipBonus = calculateRelationshipBonus(matchedSkills, skillRelationships, job);
        const relationshipScore = Math.min(relationshipBonus * 15, 15);

        relevanceScore = skillMatchScore + centralityScore + coverageScore + relationshipScore;

        // Apply penalties for over-specialized or under-matched jobs
        if (totalJobSkills > 8) relevanceScore *= 0.9; // Too many requirements
        if (matchCount === 1) relevanceScore *= 0.8; // Only one skill match
        if (relevanceScore < 15) relevanceScore *= 0.5; // Very low relevance
      }

      return {
        ...job,
        relevanceScore: Math.min(relevanceScore, 100),
        matchedSkills: matchedSkills.slice(0, 5).map(s => s.skill),
        matchCount,
        weightedMatches: matchedSkills
      };
    });

    // Lenient filtering to ensure users see job results
    const relevantJobs = scoredJobs.filter(job => {
      const hasAnySkillMatch = job.matchCount > 0;
      const hasMinimalScore = job.relevanceScore >= 5; // Very low threshold
      const hasWeightedMatches = job.weightedMatches && job.weightedMatches.length > 0;

      // Accept jobs with any skill matches, from good sources, or minimal scores
      const goodSources = ['weworkremotely', 'linkedin', 'jsearch', 'adzuna', 'indeed'];
      const isGoodSource = goodSources.includes(job.source?.toLowerCase() || '');

      // Be very inclusive for popular skills
      return hasAnySkillMatch || isGoodSource || hasMinimalScore;
    });

    // Sort by comprehensive relevance score with tie-breaking
    relevantJobs.sort((a, b) => {
      // Primary sort: relevance score
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 3) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Secondary sort: number of skill matches
      if (a.matchCount !== b.matchCount) {
        return b.matchCount - a.matchCount;
      }

      // Tertiary sort: average skill weight
      const aAvgWeight = a.weightedMatches?.reduce((sum, m) => sum + m.weight, 0) / Math.max(a.matchCount, 1) || 0;
      const bAvgWeight = b.weightedMatches?.reduce((sum, m) => sum + m.weight, 0) / Math.max(b.matchCount, 1) || 0;

      return bAvgWeight - aAvgWeight;
    });

    console.log(`Filtered to ${relevantJobs.length} relevant jobs out of ${scoredJobs.length} total`);
    console.log(`Dynamic skill importance:`, userSkillsWithWeights.slice(0, 5).map(s => `${s.skill}(${s.importance.toFixed(2)})`));

    // Log top 3 for debugging
    relevantJobs.slice(0, 3).forEach((job, i) => {
      const avgWeight = job.weightedMatches?.reduce((sum, m) => sum + m.weight, 0) / Math.max(job.matchCount, 1) || 0;
      console.log(`Top job ${i+1}: ${job.title} (${job.matchCount} matches, avg weight: ${avgWeight.toFixed(2)}, Score: ${job.relevanceScore.toFixed(1)}%)`);
    });

    return relevantJobs.slice(0, limit);
  }

  // If no skills provided, return all jobs
  console.log(`No skills provided, returning ${enriched.length} jobs`);
  return enriched.slice(0, limit);
}

