import axios from "axios";
import pdfParse from "pdf-parse";
import { ResumeProfile } from "../types";
import { SkillNormalizer } from "./skillNormalizer";

async function fileBufferToText(buffer: Buffer, mimetype?: string): Promise<string> {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  // For now treat everything else as UTF-8 text
  return buffer.toString("utf8");
}

function buildPrompt(text: string): string {
  return `You are an expert ATS (Applicant Tracking System) resume parser. Your task is to extract ONLY the technical skills that are EXPLICITLY MENTIONED in the resume text.

🎯 CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - NO markdown code blocks, NO explanations, NO comments
2. Start with { and end with }
3. Extract ONLY skills that are EXPLICITLY WRITTEN in the resume text
4. DO NOT infer, assume, or add skills that are not directly mentioned
5. DO NOT extract related technologies - only what is actually written
6. Look in ALL sections: skills, experience, projects, education, certifications, summary

⚠️ STRICT EXTRACTION RULES:
- If "React" is mentioned, extract "React" - DO NOT add "React Native" unless explicitly written
- If "JavaScript" is mentioned, DO NOT add "TypeScript" unless explicitly written
- If "Python" is mentioned, DO NOT add "R", "Hadoop", or other data science tools unless explicitly written
- If "Testing" is mentioned, DO NOT add specific frameworks like "Chai", "Mocha", "Jest" unless explicitly written
- DO NOT add package managers (npm, yarn, gem, pip) unless explicitly mentioned
- DO NOT add build tools (webpack, vite, rollup) unless explicitly mentioned
- DO NOT add related libraries or frameworks - ONLY what you see in the text
- ONLY extract what you can READ in the text - NO assumptions, NO inferences, NO related technologies

📋 REQUIRED JSON STRUCTURE:
{
  "name": "Full Name or null",
  "email": "email@example.com or null",
  "phone": "+1234567890 or null",
  "location": "City, State/Country or null",
  "summary": "Professional summary or null",
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY or null",
      "description": "Job description",
      "skills": ["skill1", "skill2"]
    }
  ]
}

🔍 EXTRACTION STRATEGY:
- Read EVERY word carefully
- Extract skills from phrases like "experience with", "proficient in", "worked with", "using", "built with"
- Look for skills in bullet points, job descriptions, project descriptions
- Extract from parentheses: "Backend (Node.js, Express)" → extract "nodejs", "express"
- Extract from slash-separated: "HTML/CSS/JavaScript" → extract all three
- Extract from comma-separated: "Python, Java, C++" → extract all three
- Normalize to lowercase: "React.js" → "react", "Node.js" → "nodejs"
- Remove duplicates

⚠️ WHAT NOT TO DO:
- DO NOT add skills that are commonly used with mentioned skills
- DO NOT add tools from the same ecosystem
- DO NOT add testing frameworks unless explicitly mentioned
- DO NOT add package managers unless explicitly mentioned
- DO NOT add build tools unless explicitly mentioned
- DO NOT infer skills from job titles or company names
- DO NOT add skills based on what "should" be there

RESUME TEXT:
${text.substring(0, 8000)}
`;
}

async function callGroq(prompt: string): Promise<ResumeProfile> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert ATS resume parser. Extract ONLY skills that are EXPLICITLY WRITTEN in the resume text. DO NOT infer, assume, or add related technologies. Be extremely precise and conservative. Return ONLY valid JSON with no markdown formatting."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,  // Very low for precise extraction
      max_tokens: 4000,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq");
  }

  // Try to extract JSON if wrapped in markdown code blocks
  let jsonText = content.trim();
  if (jsonText.startsWith("```")) {
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonText = match[1];
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (parseErr) {
    console.error("Failed to parse Groq JSON response:", jsonText.substring(0, 200));
    throw new Error(`Invalid JSON from Groq: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
  }

  // Normalize and filter skills - ONLY keep skills that pass filtering
  const rawSkills = Array.isArray(parsed.skills) ? parsed.skills : [];
  
  // Normalize each skill individually
  const normalizedSkills: string[] = [];
  for (const skill of rawSkills) {
    const normalized = SkillNormalizer.normalize(skill);
    // Only add if normalization didn't filter it out (returns non-empty string)
    if (normalized && normalized.length > 0) {
      normalizedSkills.push(normalized);
    } else {
      console.log(`⚠️ Filtered out: ${skill}`);
    }
  }
  
  // Remove duplicates
  const uniqueSkills = Array.from(new Set(normalizedSkills));
  
  console.log(`📊 Resume Parser: ${rawSkills.length} raw skills → ${uniqueSkills.length} normalized skills`);
  
  const profile: ResumeProfile = {
    name: parsed.name ?? undefined,
    email: parsed.email ?? undefined,
    phone: parsed.phone ?? undefined,
    location: parsed.location ?? undefined,
    summary: parsed.summary ?? undefined,
    skills: uniqueSkills,
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
  };

  return profile;
}

export async function parseResumeWithLLM(
  buffer: Buffer,
  mimetype?: string
): Promise<ResumeProfile> {
  let text: string;
  try {
    text = await fileBufferToText(buffer, mimetype);
    if (!text || text.trim().length === 0) {
      throw new Error("Resume file appears to be empty or could not be parsed");
    }
  } catch (err) {
    console.error("Error parsing file:", err);
    throw new Error(`Failed to extract text from resume: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    return await callGroq(buildPrompt(text));
  } catch (err) {
    console.error("Error calling Groq LLM:", err);
    
    // FALLBACK: Use regex-based extraction if LLM fails
    console.log("⚠️ LLM failed, using fallback regex extraction...");
    return fallbackExtraction(text);
  }
}

// FALLBACK: Section-aware skill extraction (Skills section first, then Projects)
function fallbackExtraction(text: string): ResumeProfile {
  const lowerText = text.toLowerCase();
  
  // Extract sections first
  const sections = extractSections(text);
  
  // COMPREHENSIVE skill list (300+ technical skills including ALL web technologies)
  const skillKeywords = [
    // Programming Languages
    'javascript', 'js', 'typescript', 'ts', 'python', 'java', 'c\\+\\+', 'cpp', 'c#', 'csharp', 
    'go', 'golang', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'perl', 'r', 'matlab',
    'dart', 'elixir', 'haskell', 'lua', 'objective-c', 'shell', 'bash', 'powershell', 'sql',
    
    // Web Frameworks - Frontend
    'react', 'reactjs', 'react\\.js', 'vue', 'vuejs', 'vue\\.js', 'angular', 'angularjs',
    'svelte', 'nextjs', 'next\\.js', 'nuxt', 'nuxtjs', 'gatsby', 'remix', 'solid', 'jquery',
    'backbone', 'ember', 'preact',
    
    // Web Frameworks - Backend
    'nodejs', 'node\\.js', 'node js', 'express', 'expressjs', 'express\\.js', 'nestjs', 'fastify',
    'koa', 'hapi', 'django', 'flask', 'fastapi', 'spring', 'spring boot', 'springboot',
    'asp\\.net', '\\.net', 'laravel', 'symfony', 'rails', 'ruby on rails', 'sinatra',
    ,
    
    // Mobile Development
    'react native', 'react-native', 'flutter', 'ionic', 'cordova', 'xamarin', 'swiftui',
    'android', 'ios', 'expo', 'capacitor',
    
    // Databases - Relational
    'sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'sql server', 'mariadb',
    'db2', 'cockroachdb',
    
    // Databases - NoSQL
    'mongodb', 'mongo', 'redis', 'cassandra', 'couchdb', 'dynamodb', 'neo4j', 'couchbase',
    'firebase', 'firestore',
    
    // Data & Search
    'elasticsearch', 'elastic search', 'solr', 'algolia', 'graphql', 'prisma', 'sequelize',
    'mongoose', 'typeorm', 'knex', 'drizzle', 'hibernate', 'jpa',
    
    // Cloud Providers
    'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp', 'google cloud',
    'google cloud platform', 'ibm cloud', 'oracle cloud', 'digitalocean', 'heroku',
    'netlify', 'vercel', 'cloudflare', 'linode',
    
    // Cloud Services
    'ec2', 's3', 'lambda', 'rds', 'cloudfront', 'route53', 'ecs', 'eks', 'fargate',
    'cloudformation', 'azure functions', 'cloud functions', 'app engine', 'cloud run',
    'amplify', 'cognito', 'api gateway', 'cloudwatch', 'sns', 'sqs',
    
    // Containers & Orchestration
    'docker', 'kubernetes', 'k8s', 'podman', 'containerd', 'openshift', 'docker-compose',
    'docker swarm', 'helm', 'rancher', 'nomad',
    
    // CI/CD
    'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis ci', 'azure devops',
    'bamboo', 'teamcity', 'drone', 'bitbucket pipelines', 'codepipeline', 'codebuild',
    'argocd', 'flux', 'spinnaker',
    
    // Infrastructure as Code
    'terraform', 'ansible', 'puppet', 'chef', 'cloudformation', 'pulumi', 'vagrant',
    'saltstack', 'packer',
    
    // Monitoring & Logging
    'prometheus', 'grafana', 'datadog', 'new relic', 'splunk', 'elk stack', 'elk',
    'logstash', 'kibana', 'nagios', 'zabbix', 'sentry', 'cloudwatch', 'stackdriver',
    'jaeger', 'zipkin', 'opentelemetry',
    
    // Version Control
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial', 'perforce',
    
    // Project Management
    'jira', 'confluence', 'trello', 'asana', 'monday', 'notion', 'slack', 'teams',
    'microsoft teams',
    
    // Testing Frameworks
    'jest', 'mocha', 'chai', 'jasmine', 'pytest', 'unittest', 'junit', 'testng',
    'selenium', 'cypress', 'playwright', 'puppeteer', 'enzyme', 'vitest', 'karma',
    'protractor', 'cucumber', 'behave', 'rspec', 'minitest',
    
    // Code Quality
    'eslint', 'prettier', 'sonarqube', 'codecov', 'coveralls', 'husky', 'lint-staged',
    
    // Build Tools
    'webpack', 'vite', 'rollup', 'parcel', 'esbuild', 'gulp', 'grunt', 'babel', 'swc',
    'turbopack', 'snowpack', 'browserify', 'maven', 'gradle', 'ant', 'make', 'cmake',
    
    // API Technologies
    'rest', 'restful', 'rest api', 'graphql', 'grpc', 'soap', 'websocket', 'socket\\.io',
    'sse', 'mqtt', 'postman', 'insomnia', 'swagger', 'openapi',
    
    // Message Queues
    'rabbitmq', 'kafka', 'redis', 'sqs', 'sns', 'pub/sub', 'pub-sub', 'activemq', 'zeromq',
    'nats', 'celery', 'bull', 'sidekiq',
    
    // Frontend Styling
    'css', 'css3', 'sass', 'scss', 'less', 'styled-components', 'emotion', 'tailwind',
    'tailwindcss', 'bootstrap', 'material-ui', 'mui', 'chakra ui', 'ant design', 'bulma',
    'foundation', 'semantic ui',
    
    // State Management
    'redux', 'mobx', 'zustand', 'recoil', 'context api', 'vuex', 'pinia', 'ngrx', 'xstate',
    'jotai', 'valtio',
    
    // Authentication
    'jwt', 'oauth', 'oauth2', 'saml', 'passport', 'auth0', 'okta', 'cognito', 'keycloak',
    'ldap', 'active directory',
    
    // Data Science & ML
    'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'scipy',
    'matplotlib', 'seaborn', 'plotly', 'jupyter', 'anaconda', 'colab', 'kaggle',
    'machine learning', 'ml', 'deep learning', 'neural networks', 'nlp', 'computer vision',
    'data science', 'data analysis', 'data visualization', 'big data', 'hadoop', 'spark',
    'pyspark', 'airflow', 'dbt', 'tableau', 'power bi', 'looker',
    
    // Design Tools
    'figma', 'sketch', 'adobe xd', 'invision', 'zeplin', 'photoshop', 'illustrator',
    
    // Methodologies
    'agile', 'scrum', 'kanban', 'waterfall', 'devops', 'ci/cd', 'tdd', 'bdd',
    'test-driven development', 'microservices', 'serverless', 'mvc', 'mvvm', 'solid',
    'design patterns', 'clean code', 'rest', 'restful',
    
    // Operating Systems
    'linux', 'unix', 'ubuntu', 'centos', 'debian', 'redhat', 'windows', 'macos',
    
    // Security
    'owasp', 'penetration testing', 'security', 'encryption', 'ssl', 'tls', 'https',
    
    // Web Servers & Proxies
    'nginx', 'apache', 'tomcat', 'iis', 'caddy', 'traefik', 'envoy', 'istio', 'haproxy',
    
    // CMS & E-commerce
    'wordpress', 'drupal', 'joomla', 'strapi', 'contentful', 'sanity', 'ghost', 'keystone',
    'shopify', 'woocommerce', 'magento', 'prestashop', 'opencart',
    
    // Static Site Generators
    'hugo', 'jekyll', 'eleventy', '11ty', 'hexo', 'pelican', 'middleman', 'docusaurus',
    
    // API & HTTP Clients
    'axios', 'fetch', 'superagent', 'got', 'request', 'apollo client', 'urql', 'relay',
    'swr', 'react query', 'tanstack query',
    
    // Form Libraries
    'formik', 'react hook form', 'final form', 'redux form', 'yup', 'joi', 'zod', 'ajv',
    
    // Animation Libraries
    'framer motion', 'gsap', 'anime\\.js', 'lottie', 'rive', 'motion', 'react spring',
    'velocity', 'popmotion',
    
    // Chart & Visualization
    'd3\\.js', 'd3', 'chart\\.js', 'chartjs', 'recharts', 'victory', 'nivo', 'highcharts',
    'echarts', 'plotly', 'visx', 'apexcharts',
    
    // UI Component Libraries (Additional)
    'radix ui', 'headless ui', 'mantine', 'primereact', 'evergreen', 'grommet', 'carbon',
    'fluent ui', 'blueprint', 'rsuite', 'react-bootstrap', 'reactstrap', 'rebass',
    
    // CSS Frameworks (Additional)
    'materialize', 'uikit', 'pure css', 'skeleton', 'milligram', 'spectre', 'tachyons',
    
    // CSS Preprocessors & Tools
    'postcss', 'autoprefixer', 'cssnano', 'purgecss', 'stylelint', 'css modules',
    
    // Build & Module Bundlers (Additional)
    'rome', 'nx', 'turborepo', 'lerna', 'rush', 'bazel',
    
    // Package Managers (Additional)
    'bower', 'jspm',
    
    // Template Engines
    'ejs', 'pug', 'jade', 'handlebars', 'mustache', 'nunjucks', 'twig', 'jinja2',
    
    // Real-time & WebSockets
    'socket\\.io', 'socketio', 'websocket', 'websockets', 'ws', 'pusher', 'ably', 'pubnub',
    'signalr', 'sockjs', 'primus',
    
    // GraphQL Tools
    'apollo server', 'apollo', 'graphql yoga', 'hasura', 'prisma', 'postgraphile',
    'graphql-tools', 'type-graphql', 'nexus',
    
    // ORM & Query Builders (Additional)
    'bookshelf', 'objection', 'waterline', 'mikro-orm', 'typegoose',
    
    // Authentication & Authorization (Additional)
    'nextauth', 'next-auth', 'clerk', 'supabase auth', 'firebase auth', 'magic link',
    'auth\\.js', 'lucia', 'iron session',
    
    // Serverless Frameworks
    'serverless', 'serverless framework', 'sst', 'arc', 'claudia', 'apex', 'zappa',
    
    // Edge Computing
    'cloudflare workers', 'deno deploy', 'fastly compute', 'akamai edgeworkers',
    
    // Headless Browsers & Automation
    'puppeteer', 'playwright', 'selenium', 'webdriver', 'nightwatch', 'testcafe',
    'zombie', 'phantomjs',
    
    // Performance & Optimization
    'lighthouse', 'web vitals', 'webpack bundle analyzer', 'source-map-explorer',
    'imagemin', 'sharp', 'jimp',
    
    // Accessibility
    'axe', 'pa11y', 'wave', 'aria', 'wcag',
    
    // Internationalization (i18n)
    'i18next', 'react-intl', 'formatjs', 'polyglot', 'globalize', 'messageformat',
    
    // Date & Time
    'date-fns', 'dayjs', 'moment', 'luxon', 'temporal',
    
    // Validation & Schema
    'yup', 'joi', 'zod', 'ajv', 'superstruct', 'io-ts', 'runtypes',
    
    // Utility Libraries (Additional)
    'lodash', 'underscore', 'ramda', 'immer', 'immutable', 'rxjs', 'xstate',
    
    // Monorepo Tools
    'nx', 'turborepo', 'lerna', 'rush', 'yarn workspaces', 'pnpm workspaces',
    
    // Documentation
    'storybook', 'docz', 'styleguidist', 'jsdoc', 'typedoc', 'swagger', 'openapi',
    'redoc', 'slate', 'docusaurus',
    
    // Error Tracking & Monitoring (Additional)
    'sentry', 'bugsnag', 'rollbar', 'raygun', 'airbrake', 'honeybadger',
    
    // Analytics
    'google analytics', 'mixpanel', 'amplitude', 'segment', 'heap', 'posthog', 'plausible',
    'fathom', 'matomo',
    
    // A/B Testing & Feature Flags
    'optimizely', 'launchdarkly', 'split', 'unleash', 'flagsmith', 'growthbook',
    
    // Payment Processing
    'stripe', 'paypal', 'square', 'braintree', 'adyen', 'razorpay',
    
    // Email Services
    'sendgrid', 'mailgun', 'postmark', 'ses', 'mailchimp', 'sendinblue',
    
    // Search & Indexing
    'algolia', 'elasticsearch', 'meilisearch', 'typesense', 'sonic', 'lunr',
    
    // Web Concepts & Patterns
    'ssr', 'ssg', 'isr', 'csr', 'jamstack', 'pwa', 'spa', 'mpa', 'hydration',
    'lazy loading', 'code splitting', 'tree shaking', 'hot module replacement', 'hmr',
    
    // Web Standards & APIs
    'web components', 'custom elements', 'shadow dom', 'service worker', 'web workers',
    'indexeddb', 'localstorage', 'sessionstorage', 'web storage', 'fetch api',
    'intersection observer', 'mutation observer', 'resize observer',
    
    // Data Formats
    'xml', 'json', 'yaml', 'toml', 'csv', 'protobuf', 'avro', 'messagepack',
    
    // Markup & Documentation
    'markdown', 'mdx', 'asciidoc', 'restructuredtext', 'latex',
    
    // Regular Expressions
    'regex', 'regular expressions', 'regexp',
    
    // Web Security
    'cors', 'csrf', 'xss', 'sql injection', 'content security policy', 'csp',
    'helmet', 'rate limiting',
  ];
  
  const detectedSkills = new Set<string>();
  
  // Extract from Skills section - SIMPLE & DIRECT
  if (sections.skills) {
    console.log("📋 Extracting from Skills section...");
    
    // Split by lines and extract ALL items
    const lines = sections.skills.split(/\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 2) continue;
      
      // Skip header lines
      if (trimmed.toLowerCase().includes('programming') || 
          trimmed.toLowerCase().includes('frontend') ||
          trimmed.toLowerCase().includes('libraries') ||
          trimmed.toLowerCase().includes('database') ||
          trimmed.toLowerCase().includes('version') ||
          trimmed.toLowerCase().includes('relevant') ||
          trimmed.toLowerCase().includes('coursework') ||
          trimmed.toLowerCase().includes('soft skills') ||
          trimmed.toLowerCase().includes('interests')) {
        continue;
      }
      
      // Split by commas and extract each skill
      const items = trimmed.split(/[,;]/);
      for (const item of items) {
        const skill = item.trim()
          .replace(/^[-*•·]\s*/, '')
          .replace(/\s+/g, ' ')
          .toLowerCase();
        
        if (skill.length > 1 && skill.length < 30) {
          detectedSkills.add(skill);
          console.log(`✓ ${skill}`);
        }
      }
    }
  } else {
    console.log("⚠️ Skills section not found!");
  }
  
  console.log(`📊 Detected ${detectedSkills.size} skills from Skills section`);
  
  // Extract from Projects section - SIMPLE & DIRECT
  if (sections.projects) {
    console.log("\n📋 Extracting from Projects...");
    
    // Look for "Technologies Used:" or "Technology Used:" lines
    const techPattern = /(?:technologies? used|tech stack|technology used)[:\s]+([^\n•]+)/gi;
    const matches = sections.projects.matchAll(techPattern);
    
    for (const match of matches) {
      const techText = match[1];
      console.log(`Tech line: ${techText}`);
      
      // Split by commas and extract
      const items = techText.split(/[,;]/);
      for (const item of items) {
        const skill = item.trim()
          .replace(/\./g, '')
          .replace(/\s+/g, ' ')
          .toLowerCase();
        
        if (skill.length > 1 && skill.length < 30 && !detectedSkills.has(skill)) {
          detectedSkills.add(skill);
          console.log(`✓ ${skill}`);
        }
      }
    }
  }
  
  console.log(`\n📊 Total detected: ${detectedSkills.size} skills (Skills + Projects)`);
  
  // NO NORMALIZATION - Just clean and return as-is
  const finalSkills: string[] = [];
  console.log(`\n✅ Preparing final skills list (NO filtering)...`);
  
  for (const skill of Array.from(detectedSkills)) {
    // Just basic cleanup
    const cleaned = skill.toLowerCase().trim();
    if (cleaned.length > 0) {
      finalSkills.push(cleaned);
      console.log(`  ✓ ${cleaned}`);
    }
  }
  
  // Remove duplicates
  const uniqueSkills = Array.from(new Set(finalSkills));
  console.log(`\n✅ Final: ${uniqueSkills.length} skills`);
  console.log(`📋 ${uniqueSkills.join(', ')}`);
  
  // Check if no skills found (fresher case)
  const isFreher = uniqueSkills.length === 0;
  if (isFreher) {
    console.log("⚠️ No skills found - user needs domain selection");
  }
  
  // Extract name (first line or after "name:")
  let name: string | undefined;
  const nameMatch = text.match(/(?:^|\n)\s*(?:name|full name)[:\s]+([^\n]+)/i) || 
                   text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
  if (nameMatch) name = nameMatch[1]?.trim();
  
  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : undefined;
  
  // Extract phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;
  
  console.log(`✅ Fallback extraction found ${uniqueSkills.length} skills`);
  console.log(`📊 Skills: ${uniqueSkills.join(', ')}`);
  
  return {
    name,
    email,
    phone,
    summary: text.slice(0, 500),
    skills: uniqueSkills,
    projects: [],
    experience: [],
    isFreher: uniqueSkills.length === 0, // Flag for no skills case
  };
}

// Helper function to extract sections from resume (more flexible)
function extractSections(text: string): {
  skills?: string;
  projects?: string;
  experience?: string;
  education?: string;
} {
  const sections: any = {};
  
  // Try multiple patterns for Skills section (including "SKILLS AND INTERESTS")
  const skillsPatterns = [
    /(?:^|\n)\s*(?:skills? and interests?|skills?|technical skills?|core competencies?|technologies?|tech stack)[:\s-]*\n([\s\S]*?)(?=\n\s*(?:experience|projects?|education|certifications?|achievements?|objective|$))/i,
    /(?:^|\n)\s*(?:skills? and interests?|skills?|technical skills?)[:\s-]*([\s\S]*?)(?=\n\s*(?:experience|projects?|education|$))/i,
    /(?:skills? and interests?|skills?|technical skills?)[:\s-]*\n([^\n]+(?:\n[^\n]+)*?)(?=\n\s*[A-Z])/i,
  ];
  
  for (const pattern of skillsPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 10) {
      sections.skills = match[1];
      console.log(`✅ Found Skills section (${match[1].length} chars)`);
      break;
    }
  }
  
  // Try multiple patterns for Projects section
  const projectsPatterns = [
    /(?:^|\n)\s*(?:projects?|personal projects?|academic projects?|work)[:\s-]*\n([\s\S]*?)(?=\n\s*(?:experience|education|skills?|certifications?|$))/i,
    /(?:projects?)[:\s-]*\n([\s\S]*?)(?=\n\s*[A-Z])/i,
  ];
  
  for (const pattern of projectsPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 10) {
      sections.projects = match[1];
      console.log(`✅ Found Projects section (${match[1].length} chars)`);
      break;
    }
  }
  
  // Try multiple patterns for Experience section
  const experiencePatterns = [
    /(?:^|\n)\s*(?:experience|work experience|professional experience|employment history?)[:\s-]*\n([\s\S]*?)(?=\n\s*(?:projects?|education|skills?|certifications?|$))/i,
    /(?:experience)[:\s-]*\n([\s\S]*?)(?=\n\s*[A-Z])/i,
  ];
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 10) {
      sections.experience = match[1];
      console.log(`✅ Found Experience section (${match[1].length} chars)`);
      break;
    }
  }
  
  // Try multiple patterns for Education section
  const educationPatterns = [
    /(?:^|\n)\s*(?:education|academic background|qualifications?)[:\s-]*\n([\s\S]*?)(?=\n\s*(?:experience|projects?|skills?|certifications?|$))/i,
    /(?:education)[:\s-]*\n([\s\S]*?)(?=\n\s*[A-Z])/i,
  ];
  
  for (const pattern of educationPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 10) {
      sections.education = match[1];
      console.log(`✅ Found Education section (${match[1].length} chars)`);
      break;
    }
  }
  
  // If no sections found, log warning
  if (!sections.skills && !sections.projects && !sections.experience) {
    console.log("⚠️ No sections detected - will search entire document");
  }
  
  return sections;
}
