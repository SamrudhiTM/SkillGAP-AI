import { fetchFromAdzuna } from '../jobSources/adzuna';
import { fetchFromJSearch } from '../jobSources/jsearch';

export interface DomainSkillAnalysis {
  domain: string;
  totalJobs: number;
  topSkills: Array<{
    skill: string;
    frequency: number;
    percentage: number;
    priority: 'critical' | 'important' | 'nice-to-have';
  }>;
  learningPath: {
    foundation: string[];
    core: string[];
    advanced: string[];
  };
  jobRoles: Array<{
    title: string;
    count: number;
    avgSalary?: string;
  }>;
}

export class DomainSkillAnalyzer {
  
  // Domain-specific job search keywords
  private static domainKeywords = {
    'frontend': ['frontend developer', 'react developer', 'ui developer', 'javascript developer', 'web developer'],
    'backend': ['backend developer', 'api developer', 'server developer', 'node.js developer', 'python developer'],
    'fullstack': ['full stack developer', 'fullstack developer', 'full-stack engineer', 'web developer'],
    'data-science': ['data scientist', 'data analyst', 'machine learning engineer', 'data engineer', 'business analyst'],
    'mobile': ['mobile developer', 'android developer', 'ios developer', 'react native developer', 'flutter developer'],
    'devops': ['devops engineer', 'cloud engineer', 'infrastructure engineer', 'site reliability engineer', 'platform engineer'],
    'uiux': ['ui designer', 'ux designer', 'product designer', 'visual designer', 'interaction designer']
  };

  // Comprehensive skill keywords for extraction
  private static skillKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    
    // Frontend
    'react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'nextjs', 'nuxt',
    
    // Backend
    'nodejs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net', 'fastapi',
    
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'dynamodb', 'elasticsearch',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git', 'ci/cd',
    
    // Mobile
    'react native', 'flutter', 'android', 'ios', 'swift', 'kotlin', 'xamarin',
    
    // Data Science
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'tableau', 'power bi',
    
    // Design
    'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'wireframing', 'prototyping'
  ];

  /**
   * Analyze skills required for a specific domain
   */
  static async analyzeDomainSkills(domain: string): Promise<DomainSkillAnalysis> {
    console.log(`🔍 Analyzing skills for domain: ${domain}`);
    
    // Get domain-specific job search terms
    const searchTerms = this.domainKeywords[domain as keyof typeof this.domainKeywords] || [domain];
    
    // Fetch jobs for all search terms
    const allJobs = [];
    for (const term of searchTerms) {
      try {
        const [adzunaJobs, jsearchJobs] = await Promise.all([
          fetchFromAdzuna({ role: term, skills: [] }),
          fetchFromJSearch({ role: term, skills: [] })
        ]);
        
        allJobs.push(...adzunaJobs, ...jsearchJobs);
      } catch (error) {
        console.error(`Error fetching jobs for ${term}:`, error);
      }
    }
    
    console.log(`📊 Found ${allJobs.length} jobs for ${domain}`);
    
    // Extract and analyze skills
    const skillAnalysis = this.extractSkillsFromJobs(allJobs);
    
    // Create learning path
    const learningPath = this.createLearningPath(domain, skillAnalysis);
    
    // Analyze job roles
    const jobRoles = this.analyzeJobRoles(allJobs);
    
    return {
      domain,
      totalJobs: allJobs.length,
      topSkills: skillAnalysis,
      learningPath,
      jobRoles
    };
  }

  /**
   * Extract skills from job descriptions
   */
  private static extractSkillsFromJobs(jobs: any[]): Array<{
    skill: string;
    frequency: number;
    percentage: number;
    priority: 'critical' | 'important' | 'nice-to-have';
  }> {
    const skillFrequency = new Map<string, number>();
    
    // Count skill occurrences
    jobs.forEach(job => {
      const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
      
      this.skillKeywords.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
          skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
        }
      });
    });
    
    // Convert to analysis format
    const totalJobs = jobs.length;
    const skillAnalysis = Array.from(skillFrequency.entries())
      .map(([skill, frequency]) => {
        const percentage = Math.round((frequency / totalJobs) * 100);
        let priority: 'critical' | 'important' | 'nice-to-have' = 'nice-to-have';
        
        if (percentage >= 60) priority = 'critical';
        else if (percentage >= 30) priority = 'important';
        
        return { skill, frequency, percentage, priority };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20); // Top 20 skills
    
    return skillAnalysis;
  }

  /**
   * Create learning path based on domain and skill analysis
   */
  private static createLearningPath(domain: string, skills: any[]): {
    foundation: string[];
    core: string[];
    advanced: string[];
  } {
    const criticalSkills = skills.filter(s => s.priority === 'critical').map(s => s.skill);
    const importantSkills = skills.filter(s => s.priority === 'important').map(s => s.skill);
    
    // Domain-specific learning paths
    const domainPaths = {
      'frontend': {
        foundation: ['html', 'css', 'javascript'],
        core: ['react', 'typescript', 'responsive design'],
        advanced: ['nextjs', 'state management', 'performance optimization']
      },
      'backend': {
        foundation: ['programming fundamentals', 'databases', 'apis'],
        core: ['nodejs', 'express', 'sql', 'mongodb'],
        advanced: ['microservices', 'system design', 'scalability']
      },
      'fullstack': {
        foundation: ['html', 'css', 'javascript', 'databases'],
        core: ['react', 'nodejs', 'express', 'sql'],
        advanced: ['system architecture', 'deployment', 'devops']
      },
      'data-science': {
        foundation: ['python', 'statistics', 'sql'],
        core: ['pandas', 'numpy', 'machine learning', 'data visualization'],
        advanced: ['deep learning', 'tensorflow', 'big data', 'mlops']
      },
      'mobile': {
        foundation: ['programming fundamentals', 'ui/ux principles'],
        core: ['react native', 'flutter', 'mobile apis'],
        advanced: ['native development', 'app store optimization', 'performance']
      },
      'devops': {
        foundation: ['linux', 'networking', 'scripting'],
        core: ['docker', 'kubernetes', 'aws', 'ci/cd'],
        advanced: ['infrastructure as code', 'monitoring', 'security']
      },
      'uiux': {
        foundation: ['design principles', 'user research', 'wireframing'],
        core: ['figma', 'prototyping', 'user testing'],
        advanced: ['design systems', 'accessibility', 'interaction design']
      }
    };
    
    const defaultPath = domainPaths[domain as keyof typeof domainPaths] || {
      foundation: criticalSkills.slice(0, 3),
      core: criticalSkills.slice(3, 7),
      advanced: importantSkills.slice(0, 4)
    };
    
    return defaultPath;
  }

  /**
   * Analyze job roles and their frequency
   */
  private static analyzeJobRoles(jobs: any[]): Array<{
    title: string;
    count: number;
    avgSalary?: string;
  }> {
    const roleFrequency = new Map<string, number>();
    
    jobs.forEach(job => {
      const title = job.title?.toLowerCase() || '';
      
      // Normalize job titles
      let normalizedTitle = '';
      if (title.includes('frontend') || title.includes('front-end')) {
        normalizedTitle = 'Frontend Developer';
      } else if (title.includes('backend') || title.includes('back-end')) {
        normalizedTitle = 'Backend Developer';
      } else if (title.includes('full stack') || title.includes('fullstack')) {
        normalizedTitle = 'Full Stack Developer';
      } else if (title.includes('data scientist')) {
        normalizedTitle = 'Data Scientist';
      } else if (title.includes('data analyst')) {
        normalizedTitle = 'Data Analyst';
      } else if (title.includes('mobile') || title.includes('android') || title.includes('ios')) {
        normalizedTitle = 'Mobile Developer';
      } else if (title.includes('devops') || title.includes('sre')) {
        normalizedTitle = 'DevOps Engineer';
      } else if (title.includes('ui') || title.includes('ux') || title.includes('designer')) {
        normalizedTitle = 'UI/UX Designer';
      } else {
        normalizedTitle = 'Software Developer';
      }
      
      roleFrequency.set(normalizedTitle, (roleFrequency.get(normalizedTitle) || 0) + 1);
    });
    
    return Array.from(roleFrequency.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Get all available domains
   */
  static getAvailableDomains(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'frontend',
        name: 'Frontend Development',
        description: 'Build user interfaces and web experiences'
      },
      {
        id: 'backend',
        name: 'Backend Development',
        description: 'Build server-side applications and APIs'
      },
      {
        id: 'fullstack',
        name: 'Full Stack Development',
        description: 'End-to-end web application development'
      },
      {
        id: 'data-science',
        name: 'Data Science',
        description: 'Analyze data and build ML models'
      },
      {
        id: 'mobile',
        name: 'Mobile Development',
        description: 'Build mobile applications for iOS/Android'
      },
      {
        id: 'devops',
        name: 'DevOps/Cloud',
        description: 'Infrastructure, deployment, and operations'
      },
      {
        id: 'uiux',
        name: 'UI/UX Design',
        description: 'Design user experiences and interfaces'
      }
    ];
  }
}