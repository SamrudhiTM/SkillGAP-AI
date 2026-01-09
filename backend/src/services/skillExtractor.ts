// Advanced Skill Extraction with Confidence Scores
// This improves accuracy by weighting skills based on context

import { SkillNormalizer } from './skillNormalizer';

export interface SkillWithConfidence {
  skill: string;
  confidence: number;  // 0.0 to 1.0
  frequency: number;   // How many times mentioned
  contexts: string[];  // Where it was found
}

export class SkillExtractor {
  // Libraries and tools to EXCLUDE (not core skills)
  private static readonly EXCLUDED_TOOLS = new Set([
    // HTTP/API Libraries
    'axios', 'fetch', 'superagent', 'request', 'got', 'ky',
    
    // Build Tools
    'vite', 'webpack', 'parcel', 'rollup', 'esbuild', 'turbopack', 'snowpack', 'browserify',
    
    // Routing Libraries
    'react-router', 'react router', 'vue-router', 'vue router',
    
    // React Ecosystem Libraries (NOT core skills)
    'react query', 'react-query', 'reactquery',
    'react testing library', 'react-testing-library',
    'preact',  // Lightweight React alternative
    
    // State Management Libraries (Minor)
    'zustand', 'jotai', 'recoil', 'valtio', 'nanostores',
    
    // UI Component Libraries
    'material-ui', 'mui', 'ant-design', 'antd', 'chakra-ui', 'chakra', 'shadcn', 'shadcn-ui',
    'semantic-ui', 'semantic ui', 'foundation',  // CSS framework
    
    // Testing Libraries (Minor)
    'vitest', 'testing-library', 'enzyme', 'chai', 'sinon', 'jasmine',
    
    // Utility Libraries
    'lodash', 'underscore', 'moment', 'dayjs', 'date-fns', 'ramda',
    
    // CSS-in-JS Libraries
    'styled-components', 'emotion', 'styled components',
    
    // CSS Preprocessors (keep Sass as core, but filter SCSS variant)
    'scss',  // Keep 'sass' as core, filter 'scss' variant
    
    // Package Managers
    'npm', 'yarn', 'pnpm', 'bun', 'gem', 'pip', 'composer', 'cargo',
    
    // Vector/Search Libraries
    'faiss', 'pinecone', 'weaviate', 'chromadb', 'milvus',
    
    // Cloud Platforms (Minor - keep AWS, Azure, GCP as core)
    'oci', 'oracle cloud', 'digitalocean', 'linode', 'heroku', 'netlify', 'vercel', 'cloudflare workers',
    
    // Linters/Formatters
    'eslint', 'prettier', 'tslint', 'stylelint',
    
    // Backend Frameworks (Minor)
    'gin',  // Go framework (minor)
    
    // Big Data (filter if not in resume)
    'hadoop', 'mapreduce', 'hive', 'pig', 'hbase',
    
    // Data Science Languages (filter if not in resume)
    'r', 'r language', 'rstudio',
    
    // Mobile (filter if not in resume)
    'react native', 'react-native', 'reactnative',
    
    // Other Tools
    'nodemon', 'pm2', 'dotenv', 'cors', 'helmet',
    'cheerio', 'puppeteer', 'playwright',
    'multer', 'bcrypt', 'jsonwebtoken', 'jwt',
    'husky', 'lint-staged', 'commitlint',
  ]);
  
  /**
   * Extract skills with confidence scores based on context and frequency
   */
  static extractWithConfidence(text: string): SkillWithConfidence[] {
    if (!text) return [];
    
    const lowerText = text.toLowerCase();
    const skillMap = new Map<string, SkillWithConfidence>();
    
    // Define sections with different importance weights
    const sections = this.extractSections(text);
    const sectionWeights = {
      skills: 1.0,          // Skills section = highest confidence
      requirements: 0.9,    // Requirements = very high
      qualifications: 0.9,  // Qualifications = very high
      experience: 0.7,      // Experience = high
      responsibilities: 0.6, // Responsibilities = medium
      description: 0.5,     // General description = medium
      other: 0.3           // Other sections = low
    };
    
    // CORE SKILLS ONLY - No libraries/tools
    const skillPatterns = [
      // Programming Languages (CORE)
      /\b(javascript|typescript|python|java|c\+\+|c#|go|golang|rust|php|ruby|swift|kotlin|scala|r|matlab)\b/gi,
      
      // Major Frameworks (CORE - widely recognized)
      /\b(react|vue|angular|nextjs|next\.js|nodejs?|node\.js|express|django|flask|spring|spring boot|laravel|rails|ruby on rails|asp\.net|\.net)\b/gi,
      
      // Databases (CORE)
      /\b(mysql|postgresql|postgres|mongodb|redis|sqlite|oracle|sql server|dynamodb|cassandra|elasticsearch|mariadb)\b/gi,
      
      // Cloud Platforms (CORE - major providers only)
      /\b(aws|amazon web services|azure|microsoft azure|gcp|google cloud)\b/gi,
      
      // DevOps & Containerization (CORE)
      /\b(docker|kubernetes|k8s|terraform|ansible|jenkins|ci\/cd|continuous integration|continuous deployment|gitlab ci|github actions)\b/gi,
      
      // Version Control (CORE)
      /\b(git|github|gitlab|bitbucket|version control)\b/gi,
      
      // API & Architecture (CORE)
      /\b(rest api|restful|graphql|grpc|microservices|api design|system design|software architecture)\b/gi,
      
      // AI/ML/Data Science (CORE)
      /\b(machine learning|deep learning|artificial intelligence|data science|natural language processing|nlp|computer vision|neural networks|data analysis)\b/gi,
      
      // ML Frameworks (CORE - major ones)
      /\b(tensorflow|pytorch|scikit-learn|keras|pandas|numpy)\b/gi,
      
      // Frontend Core (CORE)
      /\b(html|html5|css|css3|sass|scss|less|responsive design|web design)\b/gi,
      
      // CSS Frameworks (CORE - major ones)
      /\b(tailwind|tailwindcss|bootstrap|material design)\b/gi,
      
      // Mobile Development (CORE)
      /\b(react native|flutter|ios development|android development|mobile development|swift|kotlin)\b/gi,
      
      // Testing (CORE - major frameworks)
      /\b(jest|mocha|cypress|selenium|unit testing|integration testing|test automation|tdd|bdd)\b/gi,
      
      // State Management (CORE - major ones)
      /\b(redux|mobx|vuex|context api|state management)\b/gi,
      
      // Security (CORE)
      /\b(cybersecurity|security|authentication|authorization|oauth|jwt|encryption|penetration testing)\b/gi,
      
      // Agile/Project Management (CORE)
      /\b(agile|scrum|kanban|jira|project management|product management)\b/gi,
      
      // Soft Skills (CORE)
      /\b(leadership|communication|problem solving|team collaboration|critical thinking|self-learning|continuous learning)\b/gi,
    ];
    
    // Extract from each section with appropriate weight
    for (const [sectionName, sectionText] of Object.entries(sections)) {
      const weight = sectionWeights[sectionName as keyof typeof sectionWeights] || 0.3;
      
      for (const pattern of skillPatterns) {
        const matches = sectionText.matchAll(pattern);
        
        for (const match of matches) {
          const rawSkill = match[0].toLowerCase().trim();
          const normalizedSkill = SkillNormalizer.normalize(rawSkill);
          
          if (!normalizedSkill || normalizedSkill.length < 2) continue;
          
          // FILTER OUT EXCLUDED TOOLS/LIBRARIES
          if (this.EXCLUDED_TOOLS.has(normalizedSkill)) {
            console.log(`⚠️ Filtered out tool/library: ${normalizedSkill}`);
            continue;
          }
          
          if (!skillMap.has(normalizedSkill)) {
            skillMap.set(normalizedSkill, {
              skill: normalizedSkill,
              confidence: 0,
              frequency: 0,
              contexts: []
            });
          }
          
          const skillData = skillMap.get(normalizedSkill)!;
          skillData.frequency++;
          skillData.confidence = Math.min(1.0, skillData.confidence + weight);
          
          if (!skillData.contexts.includes(sectionName)) {
            skillData.contexts.push(sectionName);
          }
        }
      }
    }
    
    // Boost confidence for skills mentioned multiple times
    for (const skillData of skillMap.values()) {
      if (skillData.frequency >= 3) {
        skillData.confidence = Math.min(1.0, skillData.confidence * 1.2);
      } else if (skillData.frequency >= 2) {
        skillData.confidence = Math.min(1.0, skillData.confidence * 1.1);
      }
    }
    
    // Sort by confidence (highest first)
    return Array.from(skillMap.values())
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Extract just the skill names (for backward compatibility)
   */
  static extract(text: string): string[] {
    return this.extractWithConfidence(text).map(s => s.skill);
  }
  
  /**
   * Extract high-confidence skills only (confidence >= 0.6)
   */
  static extractHighConfidence(text: string): string[] {
    return this.extractWithConfidence(text)
      .filter(s => s.confidence >= 0.6)
      .map(s => s.skill);
  }
  
  /**
   * Extract sections from text
   */
  private static extractSections(text: string): Record<string, string> {
    const lowerText = text.toLowerCase();
    const sections: Record<string, string> = {
      skills: '',
      requirements: '',
      qualifications: '',
      experience: '',
      responsibilities: '',
      description: text,  // Full text as fallback
      other: ''
    };
    
    // Section header patterns
    const sectionPatterns = {
      skills: /(?:skills?|technical skills?|key skills?|core competencies?)[:\s]/gi,
      requirements: /(?:requirements?|what we'?re looking for|what you'?ll need|must have)[:\s]/gi,
      qualifications: /(?:qualifications?|education|certifications?)[:\s]/gi,
      experience: /(?:experience|work experience|professional experience)[:\s]/gi,
      responsibilities: /(?:responsibilities?|duties|what you'?ll do)[:\s]/gi,
    };
    
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      const matches = [...text.matchAll(pattern)];
      
      if (matches.length > 0) {
        const startIndex = matches[0].index!;
        
        // Find next section or end of text
        let endIndex = text.length;
        for (const [otherName, otherPattern] of Object.entries(sectionPatterns)) {
          if (otherName === sectionName) continue;
          
          const otherMatches = [...text.matchAll(otherPattern)];
          const nextMatch = otherMatches.find(m => m.index! > startIndex);
          
          if (nextMatch && nextMatch.index! < endIndex) {
            endIndex = nextMatch.index!;
          }
        }
        
        sections[sectionName] = text.substring(startIndex, endIndex);
      }
    }
    
    return sections;
  }
}
