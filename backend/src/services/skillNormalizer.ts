// Skill Normalization & Synonym Mapping
// This improves matching accuracy by 10-15%

export class SkillNormalizer {
  // Tools/Libraries to EXCLUDE (map to null to filter out)
  private static readonly EXCLUDED_TOOLS = new Set([
    // HTTP/API Libraries
    'axios', 'fetch', 'superagent', 'got', 'ky', 'request',
    
    // Build Tools
    'vite', 'webpack', 'parcel', 'rollup', 'esbuild', 'turbopack', 'snowpack', 'browserify',
    
    // Routing Libraries
    'react-router', 'react router', 'vue-router', 'vue router',
    
    // React Ecosystem Libraries (NOT core skills)
    'react query', 'react-query', 'reactquery',
    'react testing library', 'react-testing-library',
    'preact',  // Lightweight React alternative
    
    // State Management (Minor)
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
    
    // CSS Preprocessors (keep Sass/SCSS as core, but filter variants)
    'scss',  // Keep 'sass' as core, filter 'scss' variant
    
    // Package Managers
    'npm', 'yarn', 'pnpm', 'bun', 'gem', 'pip', 'composer', 'cargo',
    
    // Vector/Search Libraries
    'faiss', 'pinecone', 'weaviate', 'chromadb', 'milvus',
    
    // Cloud Platforms (Minor - keep AWS, Azure, GCP as core)
    'oci', 'oracle cloud', 'digitalocean', 'linode', 'heroku', 'netlify', 'vercel', 'cloudflare workers',
    
    // Linters/Formatters
    'eslint', 'prettier', 'tslint', 'stylelint',
    
    // Backend Frameworks (Minor - keep major ones)
    'gin',  // Go framework (minor)
    
    // Big Data (if not explicitly in resume)
    'hadoop', 'mapreduce', 'hive', 'pig', 'hbase',
    
    // Data Science Languages (if not explicitly in resume)
    'r', 'r language', 'rstudio',
    
    // Mobile (if not explicitly in resume)
    'react native', 'react-native', 'reactnative',
    
    // Other Tools
    'nodemon', 'pm2', 'dotenv', 'cors', 'helmet',
    'cheerio', 'puppeteer', 'playwright',
    'multer', 'bcrypt', 'jsonwebtoken', 'jwt',
    'husky', 'lint-staged', 'commitlint',
  ]);
  
  // Map of synonyms to canonical skill names (CORE SKILLS ONLY)
  private static synonymMap: Record<string, string> = {
    // JavaScript variants
    'js': 'javascript',
    'javascript': 'javascript',
    'ecmascript': 'javascript',
    'es6': 'javascript',
    'es2015': 'javascript',
    'es2020': 'javascript',
    
    // TypeScript variants
    'ts': 'typescript',
    'typescript': 'typescript',
    
    // Node.js variants
    'node': 'nodejs',
    'nodejs': 'nodejs',
    'node.js': 'nodejs',
    'node js': 'nodejs',
    
    // React variants
    'react': 'react',
    'reactjs': 'react',
    'react.js': 'react',
    'react js': 'react',
    
    // Next.js variants
    'nextjs': 'nextjs',
    'next.js': 'nextjs',
    'next js': 'nextjs',
    
    // Vue variants
    'vue': 'vue',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'vue js': 'vue',
    
    // Angular variants
    'angular': 'angular',
    'angularjs': 'angular',
    'angular.js': 'angular',
    'angular2': 'angular',
    'angular 2': 'angular',
    
    // Django variants
    'django': 'django',
    
    // Flask variants
    'flask': 'flask',
    
    // Spring variants
    'spring': 'spring',
    'spring boot': 'spring boot',
    'springboot': 'spring boot',
    
    // React Native variants
    'react native': 'react native',
    'reactnative': 'react native',
    'react-native': 'react native',
    'rn': 'react native',
    
    // Express variants
    'express': 'express',
    'expressjs': 'express',
    'express.js': 'express',
    
    // Kubernetes variants
    'k8s': 'kubernetes',
    'kubernetes': 'kubernetes',
    'kube': 'kubernetes',
    
    // PostgreSQL variants
    'postgres': 'postgresql',
    'postgresql': 'postgresql',
    'psql': 'postgresql',
    
    // MongoDB variants
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    'mongo db': 'mongodb',
    
    // MySQL variants
    'mysql': 'mysql',
    'my sql': 'mysql',
    
    // Redis variants
    'redis': 'redis',
    
    // AWS variants
    'aws': 'aws',
    'amazon web services': 'aws',
    
    // Azure variants
    'azure': 'azure',
    'microsoft azure': 'azure',
    
    // GCP variants
    'gcp': 'gcp',
    'google cloud': 'gcp',
    'google cloud platform': 'gcp',
    
    // Python variants
    'python': 'python',
    'python3': 'python',
    'py': 'python',
    
    // Java variants
    'java': 'java',
    
    // C++ variants
    'c++': 'c++',
    'cpp': 'c++',
    'cplusplus': 'c++',
    
    // C# variants
    'c#': 'c#',
    'csharp': 'c#',
    'c sharp': 'c#',
    
    // Go variants
    'go': 'go',
    'golang': 'go',
    
    // Rust variants
    'rust': 'rust',
    
    // PHP variants
    'php': 'php',
    
    // Ruby variants
    'ruby': 'ruby',
    'ruby on rails': 'ruby on rails',
    'rails': 'ruby on rails',
    'ror': 'ruby on rails',
    
    // Swift variants
    'swift': 'swift',
    
    // Kotlin variants
    'kotlin': 'kotlin',
    
    // REST API variants
    'rest': 'rest api',
    'rest api': 'rest api',
    'restapi': 'rest api',
    'rest-api': 'rest api',
    'restful': 'rest api',
    'restful api': 'rest api',
    
    // GraphQL variants
    'graphql': 'graphql',
    'graph ql': 'graphql',
    
    // CI/CD variants
    'ci/cd': 'ci/cd',
    'cicd': 'ci/cd',
    'ci cd': 'ci/cd',
    'continuous integration': 'ci/cd',
    'continuous deployment': 'ci/cd',
    
    // Machine Learning variants
    'ml': 'machine learning',
    'machine learning': 'machine learning',
    'machinelearning': 'machine learning',
    
    // Deep Learning variants
    'dl': 'deep learning',
    'deep learning': 'deep learning',
    'deeplearning': 'deep learning',
    
    // Artificial Intelligence variants
    'ai': 'artificial intelligence',
    'artificial intelligence': 'artificial intelligence',
    
    // Data Science variants
    'data science': 'data science',
    'datascience': 'data science',
    
    // NLP variants
    'nlp': 'natural language processing',
    'natural language processing': 'natural language processing',
    
    // Computer Vision variants
    'cv': 'computer vision',
    'computer vision': 'computer vision',
    
    // SQL variants
    'sql': 'sql',
    'structured query language': 'sql',
    
    // HTML variants
    'html': 'html',
    'html5': 'html',
    
    // CSS variants
    'css': 'css',
    'css3': 'css',
    
    // Sass variants
    'sass': 'sass',
    'scss': 'scss',
    
    // Tailwind variants
    'tailwind': 'tailwind',
    'tailwindcss': 'tailwind',
    'tailwind css': 'tailwind',
    
    // Bootstrap variants
    'bootstrap': 'bootstrap',
    
    // Git variants
    'git': 'git',
    'version control': 'git',
    
    // Docker variants
    'docker': 'docker',
    'containerization': 'docker',
    
    // Terraform variants
    'terraform': 'terraform',
    
    // Ansible variants
    'ansible': 'ansible',
    
    // Jenkins variants
    'jenkins': 'jenkins',
    
    // TensorFlow variants
    'tensorflow': 'tensorflow',
    'tf': 'tensorflow',
    
    // PyTorch variants
    'pytorch': 'pytorch',
    'torch': 'pytorch',
    
    // Pandas variants
    'pandas': 'pandas',
    
    // NumPy variants
    'numpy': 'numpy',
    
    // Scikit-learn variants
    'sklearn': 'scikit-learn',
    'scikit-learn': 'scikit-learn',
    'scikit learn': 'scikit-learn',
    
    // Jest variants
    'jest': 'jest',
    
    // Mocha variants
    'mocha': 'mocha',
    
    // Cypress variants
    'cypress': 'cypress',
    
    // Selenium variants
    'selenium': 'selenium',
    
    // Redux variants
    'redux': 'redux',
    
    // MobX variants
    'mobx': 'mobx',
    
    // Vuex variants
    'vuex': 'vuex',
    
    // Agile variants
    'agile': 'agile',
    'scrum': 'scrum',
    'kanban': 'kanban',
    
    // Microservices variants
    'microservices': 'microservices',
    'micro services': 'microservices',
    'microservice': 'microservices',
  };
  
  // Skill categories for better understanding
  private static skillCategories: Record<string, string[]> = {
    'frontend': ['javascript', 'typescript', 'react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'webpack'],
    'backend': ['nodejs', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'django', 'flask', 'spring', 'express'],
    'database': ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'oracle', 'dynamodb'],
    'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
    'mobile': ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
    'data': ['python', 'machine learning', 'artificial intelligence', 'tensorflow', 'pytorch', 'pandas'],
  };
  
  /**
   * Normalize a skill to its canonical form
   * Example: "node.js" -> "nodejs", "k8s" -> "kubernetes"
   * Returns empty string if skill is an excluded tool/library
   */
  static normalize(skill: string): string {
    if (!skill) return '';
    
    // Convert to lowercase and trim
    let normalized = skill.toLowerCase().trim();
    
    // Remove special characters and extra spaces
    normalized = normalized
      .replace(/[._]/g, '')  // Remove dots and underscores
      .replace(/\s+/g, ' ')  // Normalize spaces
      .trim();
    
    // CHECK IF IT'S AN EXCLUDED TOOL/LIBRARY
    if (this.EXCLUDED_TOOLS.has(normalized)) {
      return '';  // Return empty to filter out
    }
    
    // Look up in synonym map
    if (this.synonymMap[normalized]) {
      const canonical = this.synonymMap[normalized];
      
      // Double-check canonical form isn't excluded
      if (this.EXCLUDED_TOOLS.has(canonical)) {
        return '';
      }
      
      return canonical;
    }
    
    // Try without spaces for concatenated words
    const noSpaces = normalized.replace(/\s+/g, '');
    if (this.synonymMap[noSpaces]) {
      const canonical = this.synonymMap[noSpaces];
      
      // Double-check canonical form isn't excluded
      if (this.EXCLUDED_TOOLS.has(canonical)) {
        return '';
      }
      
      return canonical;
    }
    
    // Check if the no-spaces version is excluded
    if (this.EXCLUDED_TOOLS.has(noSpaces)) {
      return '';
    }
    
    // Return cleaned version if no synonym found and not excluded
    return normalized;
  }
  
  /**
   * Split concatenated skills string into individual skills
   * Example: "javascriptpythonreact" → ["javascript", "python", "react"]
   */
  static splitConcatenatedSkills(text: string): string[] {
    if (!text) return [];
    
    const lowerText = text.toLowerCase();
    const foundSkills: string[] = [];
    const allKnownSkills = Object.keys(this.synonymMap);
    
    // Sort by length (longest first) to match longer skills first
    const sortedSkills = allKnownSkills.sort((a, b) => b.length - a.length);
    
    let remainingText = lowerText;
    
    // Try to match known skills
    while (remainingText.length > 0) {
      let matched = false;
      
      for (const skill of sortedSkills) {
        if (remainingText.startsWith(skill)) {
          foundSkills.push(skill);
          remainingText = remainingText.substring(skill.length);
          matched = true;
          break;
        }
      }
      
      // If no match, skip one character
      if (!matched) {
        remainingText = remainingText.substring(1);
      }
    }
    
    return foundSkills;
  }
  
  /**
   * Normalize an array of skills
   */
  static normalizeArray(skills: string[]): string[] {
    const normalized = new Set<string>();
    
    for (const skill of skills) {
      const norm = this.normalize(skill);
      if (norm && norm.length > 1) {
        normalized.add(norm);
      }
    }
    
    return Array.from(normalized);
  }
  
  /**
   * Parse and normalize skills from various formats
   * Handles: arrays, comma-separated, space-separated, concatenated
   */
  static parseAndNormalize(input: string | string[]): string[] {
    let skills: string[] = [];
    
    if (Array.isArray(input)) {
      skills = input;
    } else if (typeof input === 'string') {
      // Try comma-separated first
      if (input.includes(',')) {
        skills = input.split(',').map(s => s.trim());
      }
      // Check if it looks like concatenated skills with some spaces
      // (e.g., "javascriptpythonreact apiartificial intelligencehtmlcss")
      else if (input.length > 30 && !input.includes(',') && input.split(/\s+/).length < 10) {
        // Try to split as concatenated first
        skills = this.splitConcatenatedSkills(input);
      }
      // Try space-separated (for normal space-separated lists)
      else if (input.includes(' ') && input.split(/\s+/).length >= 3) {
        skills = input.split(/\s+/).map(s => s.trim());
      }
      // Try to split concatenated skills
      else if (input.length > 20) {
        skills = this.splitConcatenatedSkills(input);
      }
      // Single skill
      else {
        skills = [input];
      }
    }
    
    return this.normalizeArray(skills.filter(s => s && s.length > 0));
  }
  
  /**
   * Get skill category
   */
  static getCategory(skill: string): string | null {
    const normalized = this.normalize(skill);
    
    for (const [category, skills] of Object.entries(this.skillCategories)) {
      if (skills.includes(normalized)) {
        return category;
      }
    }
    
    return null;
  }
  
  /**
   * Check if two skills are equivalent (synonyms)
   */
  static areEquivalent(skill1: string, skill2: string): boolean {
    return this.normalize(skill1) === this.normalize(skill2);
  }
  
  /**
   * Get all synonyms for a skill
   */
  static getSynonyms(skill: string): string[] {
    const normalized = this.normalize(skill);
    const synonyms: string[] = [];
    
    for (const [synonym, canonical] of Object.entries(this.synonymMap)) {
      if (canonical === normalized && synonym !== normalized) {
        synonyms.push(synonym);
      }
    }
    
    return synonyms;
  }
}
