import { JobItem, SkillGapItem } from "../types";

export interface LearningNode {
  id: string;
  type: 'skill' | 'course' | 'project' | 'certification';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // hours

  outcomes: string[]; // skills gained
  resources: {
    free: string[];
    paid: string[];
    platforms: string[];
  };
}

export interface KnowledgeNode {
  id: string;
  title: string;
  description: string;
  category: 'foundation' | 'core' | 'advanced' | 'project' | 'specialization';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected nodes
  miniTopics: {
    title: string;
    description: string;
    resources: {
      title: string;
      url: string;
      type: 'tutorial' | 'documentation' | 'course' | 'project' | 'practice' | 'article';
      platform: string;
      isFree: boolean;
    }[];
    estimatedTime: number;
  }[];
  projectMilestone?: {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    deliverables: string[];
    estimatedTime: number;
  };
}

export interface KnowledgeGraphData {
  nodes: KnowledgeNode[];
  edges: {
    from: string;
    to: string;
    type: 'related' | 'builds_on';
    strength: number;
  }[];
  skillPath: string[]; // Ordered path of node IDs
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  type: 'foundation' | 'core' | 'advanced' | 'project' | 'specialization';
  estimatedTime: number;
  status: 'pending' | 'current' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  resources: {
    title: string;
    url: string;
    type: 'tutorial' | 'documentation' | 'course' | 'project' | 'practice' | 'article';
    platform: string;
    isFree: boolean;
  }[];
  projectMilestone?: {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    deliverables: string[];
    estimatedTime: number;
  };
}

export interface LearningPath {
  skill: string;
  totalTime: number; // total hours
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nodes: LearningNode[];
  milestones: {
    title: string;
    nodeIds: string[];
    estimatedTime: number;
  }[];
  parallelTracks: LearningPath[]; // related skills that can be learned in parallel
  roadmap: RoadmapStep[]; // Step-by-step roadmap view
  knowledgeGraph: KnowledgeGraphData; // Interactive knowledge graph
}

export class KnowledgeGraph {
  private nodes: Map<string, LearningNode> = new Map();
  private edges: Map<string, string[]> = new Map(); // nodeId -> related nodeIds

  constructor() {
    this.initializeKnowledgeGraph();
  }

  /**
   * Helper function to ensure all nodes in a knowledge graph are connected
   * Automatically connects disconnected nodes to the next node in sequence
   */
  private ensureAllNodesConnected(knowledgeGraph: KnowledgeGraphData): KnowledgeGraphData {
    console.log(`🔧 ensureAllNodesConnected called with ${knowledgeGraph.nodes.length} nodes, ${knowledgeGraph.edges.length} original edges`);
    const nodes = knowledgeGraph.nodes;
    
    // Ensure every node (except the last) has at least one connection
    for (let i = 0; i < nodes.length - 1; i++) {
      if (!nodes[i].connections || nodes[i].connections.length === 0) {
        // Connect to next node in sequence
        nodes[i].connections = [nodes[i + 1].id];
        console.log(`🔗 Auto-connected ${nodes[i].id} → ${nodes[i + 1].id}`);
      }
    }

    // Regenerate ALL edges from connections (ignore original edges)
    const edges: { from: string; to: string; type: 'related'; strength: number }[] = [];
    for (const node of nodes) {
      if (node.connections) {
        for (const targetId of node.connections) {
          edges.push({
            from: node.id,
            to: targetId,
            type: 'related',
            strength: 0.9
          });
        }
      }
    }

    console.log(`✅ Generated ${edges.length} edges from node connections`);

    // Ensure skillPath includes all nodes in order
    const skillPath = nodes.map(n => n.id);

    return {
      ...knowledgeGraph,
      nodes,
      edges,  // This REPLACES the original edges
      skillPath
    };
  }

  private initializeKnowledgeGraph() {
    // Core programming skills
    this.addNode({
      id: 'html-css-basics',
      type: 'skill',
      title: 'HTML & CSS Fundamentals',
      description: 'Learn the basics of web development with HTML and CSS',
      difficulty: 'beginner',
      estimatedTime: 20,
      outcomes: ['html', 'css', 'web development'],
      resources: {
        free: ['freeCodeCamp HTML/CSS', 'MDN Web Docs', 'W3Schools'],
        paid: ['Udemy HTML/CSS', 'Coursera Web Design'],
        platforms: ['freeCodeCamp', 'Codecademy', 'Khan Academy']
      }
    });

    this.addNode({
      id: 'javascript-basics',
      type: 'skill',
      title: 'JavaScript Fundamentals',
      description: 'Master JavaScript programming fundamentals',
      difficulty: 'beginner',
      estimatedTime: 40,
      outcomes: ['javascript', 'programming', 'problem solving'],
      resources: {
        free: ['freeCodeCamp JavaScript', 'MDN JavaScript Guide', 'JavaScript.info'],
        paid: ['Udemy JavaScript', 'Coursera JavaScript'],
        platforms: ['freeCodeCamp', 'Codecademy', 'Pluralsight']
      }
    });

    this.addNode({
      id: 'react-basics',
      type: 'skill',
      title: 'React Fundamentals',
      description: 'Learn React.js for building user interfaces',
      difficulty: 'intermediate',
      estimatedTime: 30,
      outcomes: ['react', 'frontend', 'ui development', 'component architecture'],
      resources: {
        free: ['React Official Docs', 'freeCodeCamp React', 'Scrimba React'],
        paid: ['Udemy React', 'React Training'],
        platforms: ['freeCodeCamp', 'Egghead', 'Frontend Masters']
      }
    });

    this.addNode({
      id: 'nodejs-basics',
      type: 'skill',
      title: 'Node.js Fundamentals',
      description: 'Learn server-side JavaScript with Node.js',
      difficulty: 'intermediate',
      estimatedTime: 25,
      outcomes: ['nodejs', 'backend', 'server development', 'apis'],
      resources: {
        free: ['Node.js Official Docs', 'freeCodeCamp Node.js', 'Node School'],
        paid: ['Udemy Node.js', 'Node.js Certification'],
        platforms: ['freeCodeCamp', 'Udemy', 'Pluralsight']
      }
    });

    this.addNode({
      id: 'python-basics',
      type: 'skill',
      title: 'Python Fundamentals',
      description: 'Learn Python programming for data science and backend',
      difficulty: 'beginner',
      estimatedTime: 35,
      outcomes: ['python', 'programming', 'automation'],
      resources: {
        free: ['Python Official Docs', 'freeCodeCamp Python', 'Codecademy Python'],
        paid: ['Udemy Python', 'Coursera Python'],
        platforms: ['freeCodeCamp', 'Codecademy', 'DataCamp']
      }
    });

    this.addNode({
      id: 'database-basics',
      type: 'skill',
      title: 'Database Fundamentals',
      description: 'Learn SQL and database design principles',
      difficulty: 'beginner',
      estimatedTime: 20,
      outcomes: ['sql', 'database design', 'data management'],
      resources: {
        free: ['SQLZoo', 'freeCodeCamp SQL', 'Khan Academy Databases'],
        paid: ['Udemy SQL', 'Coursera Database Systems'],
        platforms: ['freeCodeCamp', 'Khan Academy', 'Udemy']
      }
    });

    // Cloud & DevOps skills
    this.addNode({
      id: 'aws-basics',
      type: 'skill',
      title: 'AWS Fundamentals',
      description: 'Learn Amazon Web Services cloud platform basics',
      difficulty: 'beginner',
      estimatedTime: 25,
      outcomes: ['aws', 'cloud computing', 'ec2', 's3'],
      resources: {
        free: ['AWS Free Tier', 'AWS Documentation', 'freeCodeCamp AWS'],
        paid: ['Udemy AWS', 'AWS Certified Cloud Practitioner'],
        platforms: ['AWS', 'freeCodeCamp', 'A Cloud Guru']
      }
    });

    this.addNode({
      id: 'docker-basics',
      type: 'skill',
      title: 'Docker Fundamentals',
      description: 'Learn containerization with Docker',
      difficulty: 'beginner',
      estimatedTime: 15,
      outcomes: ['docker', 'containerization', 'devops'],
      resources: {
        free: ['Docker Official Docs', 'freeCodeCamp Docker', 'Docker Playground'],
        paid: ['Udemy Docker', 'Docker Certified Associate'],
        platforms: ['Docker', 'freeCodeCamp', 'Katacoda']
      }
    });

    this.addNode({
      id: 'kubernetes-basics',
      type: 'skill',
      title: 'Kubernetes Fundamentals',
      description: 'Learn container orchestration with Kubernetes',
      difficulty: 'intermediate',
      estimatedTime: 30,
      outcomes: ['kubernetes', 'k8s', 'container orchestration', 'devops'],
      resources: {
        free: ['Kubernetes Official Docs', 'freeCodeCamp Kubernetes', 'Katacoda'],
        paid: ['Udemy Kubernetes', 'CKA Certification'],
        platforms: ['Kubernetes', 'freeCodeCamp', 'Linux Academy']
      }
    });

    // Data Science & ML skills
    this.addNode({
      id: 'data-analysis-basics',
      type: 'skill',
      title: 'Data Analysis with Python',
      description: 'Learn data analysis and visualization with Python',
      difficulty: 'beginner',
      estimatedTime: 40,
      outcomes: ['data analysis', 'pandas', 'numpy', 'matplotlib', 'data visualization'],
      resources: {
        free: ['Python Data Science Handbook', 'freeCodeCamp Data Analysis', 'Kaggle Learn'],
        paid: ['Udemy Data Analysis', 'Coursera Data Science'],
        platforms: ['freeCodeCamp', 'DataCamp', 'Kaggle']
      }
    });

    this.addNode({
      id: 'machine-learning-basics',
      type: 'skill',
      title: 'Machine Learning Fundamentals',
      description: 'Learn basic machine learning concepts and algorithms',
      difficulty: 'intermediate',
      estimatedTime: 60,
      outcomes: ['machine learning', 'ml', 'scikit-learn', 'supervised learning', 'unsupervised learning'],
      resources: {
        free: ['Scikit-learn Documentation', 'Andrew Ng ML Course', 'freeCodeCamp ML'],
        paid: ['Udemy Machine Learning', 'Coursera ML Specialization'],
        platforms: ['Coursera', 'freeCodeCamp', 'DataCamp']
      }
    });

    // Mobile Development
    this.addNode({
      id: 'react-native-basics',
      type: 'skill',
      title: 'React Native Fundamentals',
      description: 'Learn cross-platform mobile development with React Native',
      difficulty: 'intermediate',
      estimatedTime: 35,
      outcomes: ['react native', 'mobile development', 'ios', 'android'],
      resources: {
        free: ['React Native Docs', 'freeCodeCamp React Native', 'Expo Docs'],
        paid: ['Udemy React Native', 'React Native Certification'],
        platforms: ['React Native', 'freeCodeCamp', 'Expo']
      }
    });

    // Advanced Backend
    this.addNode({
      id: 'microservices-basics',
      type: 'skill',
      title: 'Microservices Architecture',
      description: 'Learn microservices design patterns and implementation',
      difficulty: 'advanced',
      estimatedTime: 45,
      outcomes: ['microservices', 'api gateway', 'service mesh', 'distributed systems'],
      resources: {
        free: ['Microservices Patterns', 'freeCodeCamp Microservices', 'Martin Fowler Articles'],
        paid: ['Udemy Microservices', 'Microservices Certification'],
        platforms: ['freeCodeCamp', 'Udemy', 'Pluralsight']
      }
    });

    // Cybersecurity
    this.addNode({
      id: 'cybersecurity-basics',
      type: 'skill',
      title: 'Cybersecurity Fundamentals',
      description: 'Learn basic cybersecurity concepts and best practices',
      difficulty: 'beginner',
      estimatedTime: 30,
      outcomes: ['cybersecurity', 'information security', 'ethical hacking', 'security best practices'],
      resources: {
        free: ['Cybrary Free Courses', 'freeCodeCamp Cybersecurity', 'OWASP'],
        paid: ['Udemy Cybersecurity', 'CompTIA Security+'],
        platforms: ['freeCodeCamp', 'Cybrary', 'Coursera']
      }
    });

    // Project Management & Soft Skills
    this.addNode({
      id: 'agile-scrum-basics',
      type: 'skill',
      title: 'Agile & Scrum Fundamentals',
      description: 'Learn agile methodologies and scrum practices',
      difficulty: 'beginner',
      estimatedTime: 15,
      outcomes: ['agile', 'scrum', 'project management', 'sprint planning'],
      resources: {
        free: ['Scrum Guide', 'Agile Manifesto', 'freeCodeCamp Agile'],
        paid: ['Udemy Scrum Master', 'Scrum Alliance Certification'],
        platforms: ['Scrum.org', 'freeCodeCamp', 'Coursera']
      }
    });

    // Add more nodes for advanced skills...
    this.addNode({
      id: 'fullstack-project',
      type: 'project',
      title: 'Full-Stack Web Application',
      description: 'Build a complete web application with frontend and backend',
      difficulty: 'intermediate',
      estimatedTime: 80,
      outcomes: ['fullstack development', 'project management', 'deployment'],
      resources: {
        free: ['GitHub Templates', 'freeCodeCamp Projects'],
        paid: ['Udemy Full-Stack Projects'],
        platforms: ['GitHub', 'Glitch', 'CodeSandbox']
      }
    });
  }

  private addNode(node: LearningNode) {
    this.nodes.set(node.id, node);
    this.edges.set(node.id, []);
  }

  async generateLearningPath(targetSkill: string, currentSkills: string[] = []): Promise<LearningPath> {
    const skillNode = Array.from(this.nodes.values()).find(
      node => node.outcomes.includes(targetSkill.toLowerCase())
    );

    const currentSkillSet = new Set(currentSkills.map(s => s.toLowerCase()));

    // Generate interactive knowledge graph (this handles all skills including generics)
    const knowledgeGraph = await this.generateKnowledgeGraph(targetSkill, [], currentSkillSet);

    if (!skillNode) {
      // No specific node found, generate dynamic learning path from knowledge graph
      console.log(`Generating dynamic learning path for skill: ${targetSkill}`);
      
      // Create dynamic roadmap from knowledge graph
      const dynamicRoadmap = this.generateDynamicRoadmapFromKnowledgeGraph(knowledgeGraph, currentSkillSet);
      const parallelTracks = await this.findParallelTracks(targetSkill, currentSkillSet);
      
      return {
        skill: targetSkill,
        totalTime: knowledgeGraph.nodes.reduce((sum, node) => sum + node.estimatedTime, 0),
        difficulty: this.calculateDifficultyFromKnowledgeGraph(knowledgeGraph),
        nodes: [], // No traditional nodes for generic skills
        milestones: this.createMilestonesFromKnowledgeGraph(knowledgeGraph),
        parallelTracks,
        roadmap: dynamicRoadmap, // Dynamic roadmap from knowledge graph
        knowledgeGraph
      };
    }

    const path: LearningNode[] = [];
    const visited = new Set<string>();

    // Use topological sort to find learning path
    const learningPath = this.buildLearningPath(skillNode.id, visited, currentSkillSet);

    // Calculate milestones
    const milestones = this.createMilestones(learningPath);

    // Find parallel tracks
    const parallelTracks = await this.findParallelTracks(targetSkill, currentSkillSet);

    // Generate roadmap with clickable links and projects
    const roadmap = this.generateRoadmap(targetSkill, learningPath, currentSkillSet);

    return {
      skill: targetSkill,
      totalTime: learningPath.reduce((sum, node) => sum + node.estimatedTime, 0),
      difficulty: this.calculateOverallDifficulty(learningPath),
      nodes: learningPath,
      milestones,
      parallelTracks,
      roadmap,
      knowledgeGraph
    };
  }

  private buildLearningPath(nodeId: string, visited: Set<string>, currentSkills: Set<string>): LearningNode[] {
    if (visited.has(nodeId)) return [];

    const node = this.nodes.get(nodeId);
    if (!node) return [];

    visited.add(nodeId);

    // If user already has this skill, skip it
    const hasSkill = node.outcomes.some(outcome => currentSkills.has(outcome));
    if (hasSkill) {
      return [];
    }

    const path: LearningNode[] = [];

    // Add current node if not already known
    if (!hasSkill) {
      path.push(node);
    }

    return path;
  }

  private createMilestones(nodes: LearningNode[]): LearningPath['milestones'] {
    const milestones = [];
    let currentTime = 0;

    // Group by difficulty
    const beginnerNodes = nodes.filter(n => n.difficulty === 'beginner');
    const intermediateNodes = nodes.filter(n => n.difficulty === 'intermediate');
    const advancedNodes = nodes.filter(n => n.difficulty === 'advanced');

    if (beginnerNodes.length > 0) {
      const time = beginnerNodes.reduce((sum, n) => sum + n.estimatedTime, 0);
      milestones.push({
        title: 'Foundation Building',
        nodeIds: beginnerNodes.map(n => n.id),
        estimatedTime: time
      });
      currentTime += time;
    }

    if (intermediateNodes.length > 0) {
      const time = intermediateNodes.reduce((sum, n) => sum + n.estimatedTime, 0);
      milestones.push({
        title: 'Skill Development',
        nodeIds: intermediateNodes.map(n => n.id),
        estimatedTime: time
      });
      currentTime += time;
    }

    if (advancedNodes.length > 0) {
      const time = advancedNodes.reduce((sum, n) => sum + n.estimatedTime, 0);
      milestones.push({
        title: 'Advanced Mastery',
        nodeIds: advancedNodes.map(n => n.id),
        estimatedTime: time
      });
    }

    return milestones;
  }

  private async findParallelTracks(targetSkill: string, currentSkills: Set<string>): Promise<LearningPath[]> {
    const parallelSkills = this.getRelatedSkills(targetSkill);
    const tracks: LearningPath[] = [];

    for (const skill of parallelSkills.slice(0, 2)) { // Limit to 2 parallel tracks
      const path = await this.generateLearningPath(skill, Array.from(currentSkills));
      if (path && path.nodes.length > 0) {
        tracks.push(path);
      }
    }

    return tracks;
  }

  private getRelatedSkills(skill: string): string[] {
    const relatedSkills: { [key: string]: string[] } = {
      'javascript': ['react', 'nodejs', 'typescript'],
      'python': ['django', 'flask', 'data analysis'],
      'react': ['redux', 'nextjs', 'typescript'],
      'nodejs': ['express', 'mongodb', 'rest api'],
      'html': ['css', 'javascript', 'responsive design'],
      'css': ['sass', 'tailwind', 'animation'],
      'sql': ['postgresql', 'mongodb', 'database design'],
      'git': ['github', 'ci/cd', 'collaboration'],
      'aws': ['cloud computing', 'devops', 'scalability'],
      'docker': ['containerization', 'devops', 'deployment'],
      'kubernetes': ['container orchestration', 'devops', 'microservices'],
      'machine learning': ['python', 'data science', 'ai'],
      'data analysis': ['python', 'statistics', 'visualization'],
      'react native': ['react', 'mobile development', 'cross-platform'],
      'cybersecurity': ['network security', 'ethical hacking', 'compliance'],
      'agile': ['scrum', 'kanban', 'lean']
    };

    return relatedSkills[skill.toLowerCase()] || [];
  }

  private calculateOverallDifficulty(nodes: LearningNode[]): 'beginner' | 'intermediate' | 'advanced' {
    const difficulties = nodes.map(n => n.difficulty);
    if (difficulties.includes('advanced')) return 'advanced';
    if (difficulties.includes('intermediate')) return 'intermediate';
    return 'beginner';
  }

  private calculateDifficultyFromKnowledgeGraph(knowledgeGraph: KnowledgeGraphData): 'beginner' | 'intermediate' | 'advanced' {
    const difficulties = knowledgeGraph.nodes.map(n => n.difficulty);
    if (difficulties.includes('advanced')) return 'advanced';
    if (difficulties.includes('intermediate')) return 'intermediate';
    return 'beginner';
  }

  private createMilestonesFromKnowledgeGraph(knowledgeGraph: KnowledgeGraphData): LearningPath['milestones'] {
    const milestones = [];
    
    // Group nodes by category
    const foundationNodes = knowledgeGraph.nodes.filter(n => n.category === 'foundation');
    const coreNodes = knowledgeGraph.nodes.filter(n => n.category === 'core');
    const advancedNodes = knowledgeGraph.nodes.filter(n => n.category === 'advanced');
    const projectNodes = knowledgeGraph.nodes.filter(n => n.category === 'project');

    if (foundationNodes.length > 0) {
      milestones.push({
        title: 'Foundation Building',
        nodeIds: foundationNodes.map(n => n.id),
        estimatedTime: foundationNodes.reduce((sum, n) => sum + n.estimatedTime, 0)
      });
    }

    if (coreNodes.length > 0) {
      milestones.push({
        title: 'Core Skills Development',
        nodeIds: coreNodes.map(n => n.id),
        estimatedTime: coreNodes.reduce((sum, n) => sum + n.estimatedTime, 0)
      });
    }

    if (advancedNodes.length > 0) {
      milestones.push({
        title: 'Advanced Mastery',
        nodeIds: advancedNodes.map(n => n.id),
        estimatedTime: advancedNodes.reduce((sum, n) => sum + n.estimatedTime, 0)
      });
    }

    if (projectNodes.length > 0) {
      milestones.push({
        title: 'Practical Projects',
        nodeIds: projectNodes.map(n => n.id),
        estimatedTime: projectNodes.reduce((sum, n) => sum + n.estimatedTime, 0)
      });
    }

    return milestones;
  }

  private generateDynamicRoadmapFromKnowledgeGraph(knowledgeGraph: KnowledgeGraphData, currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];
    
    // Sort nodes by skill path order if available, otherwise by category priority
    const sortedNodes = knowledgeGraph.skillPath.length > 0 
      ? knowledgeGraph.skillPath.map(id => knowledgeGraph.nodes.find(n => n.id === id)).filter(Boolean) as KnowledgeNode[]
      : this.sortNodesByPriority(knowledgeGraph.nodes);

    for (const node of sortedNodes) {
      const isInterviewImportant = this.isInterviewImportantTopic(node.title, node.description);
      
      roadmap.push({
        id: node.id,
        title: isInterviewImportant ? `🔥 Interview HOT! ${node.title}` : node.title,
        description: node.description,
        type: node.category,
        estimatedTime: node.estimatedTime,
        status: 'pending',
        priority: isInterviewImportant ? 'high' : this.calculateNodePriority(node),
        resources: node.miniTopics.flatMap(topic => topic.resources),
        projectMilestone: node.projectMilestone
      });
    }

    return roadmap;
  }

  private sortNodesByPriority(nodes: KnowledgeNode[]): KnowledgeNode[] {
    const categoryOrder = { 'foundation': 1, 'core': 2, 'advanced': 3, 'project': 4, 'specialization': 5 };
    
    return nodes.sort((a, b) => {
      const aOrder = categoryOrder[a.category] || 6;
      const bOrder = categoryOrder[b.category] || 6;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Within same category, sort by difficulty
      const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
      return (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2);
    });
  }

  private isInterviewImportantTopic(title: string, description: string): boolean {
    const interviewKeywords = [
      // Core Programming Concepts (FAANG favorites)
      'algorithm', 'data structure', 'big o', 'complexity', 'sorting', 'searching',
      'tree', 'graph', 'dynamic programming', 'recursion', 'binary search',
      'hash table', 'linked list', 'stack', 'queue', 'heap',
      
      // JavaScript/Frontend (High frequency)
      'async', 'promise', 'closure', 'prototype', 'hoisting', 'event loop',
      'callback', 'this binding', 'scope', 'lexical scope', 'arrow function',
      
      // React (Must-know for React roles)
      'react hooks', 'useeffect', 'usestate', 'usecallback', 'usememo',
      'state management', 'redux', 'context api', 'virtual dom', 'reconciliation',
      'component lifecycle', 'performance optimization', 'memoization',
      
      // System Design (Senior roles)
      'system design', 'scalability', 'load balancing', 'caching', 'database design',
      'microservices', 'api design', 'rest api', 'graphql', 'websocket',
      'distributed systems', 'consistency', 'availability', 'partition tolerance',
      
      // Backend/Infrastructure
      'docker', 'kubernetes', 'aws', 'cloud', 'serverless', 'lambda',
      'database optimization', 'sql optimization', 'indexing', 'nosql',
      'redis', 'mongodb', 'postgresql', 'mysql',
      
      // TypeScript (Growing importance)
      'typescript', 'generics', 'advanced types', 'type guards', 'conditional types',
      'mapped types', 'utility types', 'interface', 'type inference',
      
      // Testing (Quality focus)
      'testing', 'unit test', 'integration test', 'e2e test', 'tdd', 'bdd',
      'jest', 'cypress', 'selenium', 'test automation',
      
      // Security (Always important)
      'security', 'authentication', 'authorization', 'jwt', 'oauth',
      'xss', 'csrf', 'sql injection', 'encryption', 'https',
      
      // DevOps/CI/CD (Modern development)
      'ci/cd', 'devops', 'git', 'version control', 'deployment',
      'monitoring', 'logging', 'error handling',
      
      // Data Science/ML (Growing field)
      'machine learning', 'neural network', 'deep learning', 'ai',
      'data analysis', 'statistics', 'python', 'pandas', 'numpy',
      
      // Soft Skills (Leadership roles)
      'communication', 'leadership', 'project management', 'agile', 'scrum'
    ];

    const text = `${title} ${description}`.toLowerCase();
    return interviewKeywords.some(keyword => text.includes(keyword));
  }

  private calculateNodePriority(node: KnowledgeNode): 'high' | 'medium' | 'low' {
    if (node.category === 'foundation') return 'high';
    if (node.category === 'core') return 'medium';
    if (node.difficulty === 'advanced') return 'high';
    return 'low';
  }

  private addInterviewPreparationSection(roadmap: RoadmapStep[], targetSkill: string): RoadmapStep[] {
    const interviewSection: RoadmapStep = {
      id: `${targetSkill.toLowerCase()}-interview-prep`,
      title: `🎯 Interview Preparation for ${targetSkill}`,
      description: `Essential topics and practice questions for ${targetSkill} interviews at top tech companies`,
      type: 'specialization',
      estimatedTime: 20,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: `${targetSkill} Interview Questions`,
          url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + ' interview questions')}`,
          type: 'practice',
          platform: 'Google',
          isFree: true
        },
        {
          title: 'LeetCode Practice',
          url: 'https://leetcode.com/',
          type: 'practice',
          platform: 'LeetCode',
          isFree: true
        },
        {
          title: 'System Design Interview',
          url: 'https://www.youtube.com/results?search_query=system+design+interview',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: `${targetSkill} Interview Portfolio`,
        description: `Build projects that demonstrate ${targetSkill} expertise for interviews`,
        difficulty: 'advanced',
        deliverables: [
          'Technical portfolio project',
          'Code samples and explanations',
          'System design documentation',
          'Performance optimization examples'
        ],
        estimatedTime: 25
      }
    };

    // Add interview preparation as the last step
    return [...roadmap, interviewSection];
  }

  private generateRoadmap(targetSkill: string, learningPath: LearningNode[], currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];
    const skill = targetSkill.toLowerCase();

    // Foundation steps - always include basics
    if (!currentSkills.has('html') && !currentSkills.has('css')) {
      roadmap.push({
        id: 'foundation-html-css',
        title: 'HTML & CSS Foundation',
        description: 'Build the foundation of web development',
        type: 'foundation',
        estimatedTime: 25,
        status: 'pending',
        resources: [
          {
            title: 'HTML & CSS Full Course',
            url: 'https://www.youtube.com/watch?v=G3e-cpL7ofc',
            type: 'tutorial',
            platform: 'YouTube',
            isFree: true
          },
          {
            title: 'freeCodeCamp HTML/CSS',
            url: 'https://www.freecodecamp.org/learn/responsive-web-design/',
            type: 'course',
            platform: 'freeCodeCamp',
            isFree: true
          },
          {
            title: 'MDN Web Docs',
            url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML',
            type: 'documentation',
            platform: 'MDN',
            isFree: true
          }
        ]
      });
    }

    // Skill-specific roadmap based on target skill
    if (skill === 'javascript') {
      roadmap.push(...this.getJavaScriptRoadmap(currentSkills));
    } else if (skill === 'typescript') {
      roadmap.push(...this.getTypeScriptRoadmap(currentSkills));
    } else if (skill === 'react') {
      roadmap.push(...this.getReactRoadmap(currentSkills));
    } else if (skill === 'angular') {
      roadmap.push(...this.getAngularRoadmap(currentSkills));
    } else if (skill === 'microservices') {
      roadmap.push(...this.getMicroservicesRoadmap(currentSkills));
    } else if (skill === 'python') {
      roadmap.push(...this.getPythonRoadmap(currentSkills));
    } else if (skill === 'machine learning') {
      roadmap.push(...this.getMachineLearningRoadmap(currentSkills));
    } else if (skill === 'aws') {
      roadmap.push(...this.getAWSRoadmap(currentSkills));
    } else if (skill === 'docker') {
      roadmap.push(...this.getDockerRoadmap(currentSkills));
    } else {
      // Generic roadmap for other skills
      roadmap.push(...this.getGenericRoadmap(targetSkill, currentSkills));
    }

    // Add interview preparation section for all skills
    const finalRoadmap = this.addInterviewPreparationSection(roadmap, targetSkill);
    
    return finalRoadmap;
  }
  private getJavaScriptRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    if (!currentSkills.has('javascript')) {
      roadmap.push({
        id: 'js-basics',
        title: 'JavaScript Fundamentals',
        description: 'Master the core concepts of JavaScript programming',
        type: 'foundation',
        estimatedTime: 40,
        status: 'pending',
        resources: [
          {
            title: 'JavaScript Crash Course',
            url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
            type: 'tutorial',
            platform: 'YouTube',
            isFree: true
          },
          {
            title: 'freeCodeCamp JavaScript',
            url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
            type: 'course',
            platform: 'freeCodeCamp',
            isFree: true
          },
          {
            title: 'JavaScript.info',
            url: 'https://javascript.info/',
            type: 'tutorial',
            platform: 'JavaScript.info',
            isFree: true
          }
        ],
        projectMilestone: {
          title: 'JavaScript Calculator',
          description: 'Build a fully functional calculator using vanilla JavaScript',
          difficulty: 'beginner',
          deliverables: ['HTML structure', 'CSS styling', 'JavaScript logic', 'Event handling'],
          estimatedTime: 8
        }
      });
    }

    roadmap.push({
      id: 'js-dom-manipulation',
      title: 'DOM Manipulation & Events',
      description: 'Learn to interact with web pages dynamically',
      type: 'core',
      estimatedTime: 15,
      status: 'pending',
      resources: [
        {
          title: 'DOM Manipulation Tutorial',
          url: 'https://www.youtube.com/watch?v=y17RuWkWdnw',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        },
        {
          title: 'MDN DOM Events',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events',
          type: 'documentation',
          platform: 'MDN',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Interactive Todo List',
        description: 'Create a todo list with add, edit, delete, and mark complete functionality',
        difficulty: 'beginner',
        deliverables: ['Add/delete items', 'Mark complete', 'Local storage', 'Responsive design'],
        estimatedTime: 12
      }
    });

    // Interview-focused JavaScript topics
    roadmap.push({
      id: 'js-async-programming',
      title: '🔥 Interview HOT! Asynchronous JavaScript',
      description: 'Master promises, async/await, and asynchronous programming patterns - CRITICAL for interviews at FAANG companies',
      type: 'core',
      estimatedTime: 20,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'Async/Await Crash Course',
          url: 'https://www.youtube.com/watch?v=PoRJizFvM7s',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        },
        {
          title: 'JavaScript Promises',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises',
          type: 'documentation',
          platform: 'MDN',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Async Data Fetcher',
        description: 'Build a utility that handles multiple async operations with proper error handling',
        difficulty: 'intermediate',
        deliverables: ['Promise.all implementation', 'Error handling', 'Retry logic', 'Concurrent requests'],
        estimatedTime: 15
      }
    });

    roadmap.push({
      id: 'js-data-structures-algorithms',
      title: '🔥 Interview HOT! Data Structures & Algorithms',
      description: 'MANDATORY for technical interviews at FAANG, Google, Meta, Amazon, Netflix, Apple - 80% of interview questions',
      type: 'advanced',
      estimatedTime: 35,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'JavaScript Algorithms',
          url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
          type: 'course',
          platform: 'freeCodeCamp',
          isFree: true
        },
        {
          title: 'LeetCode JavaScript Solutions',
          url: 'https://leetcode.com/problemset/all/',
          type: 'practice',
          platform: 'LeetCode',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'LeetCode Problem Solver',
        description: 'Implement solutions for common algorithmic problems asked in interviews',
        difficulty: 'advanced',
        deliverables: ['Array manipulation', 'Tree traversals', 'Sorting algorithms', 'Dynamic programming'],
        estimatedTime: 30
      }
    });

    return roadmap;
  }
  private getPythonRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    roadmap.push({
      id: 'python-basics',
      title: 'Python Programming Fundamentals',
      description: 'Learn Python syntax, data structures, and basic programming concepts',
      type: 'foundation',
      estimatedTime: 35,
      status: 'pending',
      resources: [
        {
          title: 'Python Crash Course',
          url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        },
        {
          title: 'Python Official Tutorial',
          url: 'https://docs.python.org/3/tutorial/',
          type: 'tutorial',
          platform: 'Python.org',
          isFree: true
        },
        {
          title: 'freeCodeCamp Python',
          url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
          type: 'course',
          platform: 'freeCodeCamp',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Command Line Task Manager',
        description: 'Build a CLI application for managing tasks and todos',
        difficulty: 'beginner',
        deliverables: ['File I/O operations', 'Command line arguments', 'Data persistence', 'Error handling'],
        estimatedTime: 15
      }
    });

    roadmap.push({
      id: 'python-web-dev',
      title: 'Web Development with Flask/Django',
      description: 'Learn to build web applications with Python frameworks',
      type: 'core',
      estimatedTime: 40,
      status: 'pending',
      resources: [
        {
          title: 'Flask Tutorial',
          url: 'https://www.youtube.com/watch?v=Z1RJmh_OqeA',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        },
        {
          title: 'Django Tutorial',
          url: 'https://www.youtube.com/watch?v=rHux0gMZ3Eg',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Personal Blog with Django',
        description: 'Create a full-featured blog with user accounts, posts, and comments',
        difficulty: 'intermediate',
        deliverables: ['User authentication', 'CRUD operations', 'Admin panel', 'Template system'],
        estimatedTime: 30
      }
    });

    return roadmap;
  }

  private getMachineLearningRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    roadmap.push({
      id: 'ml-math-foundations',
      title: 'Mathematics for Machine Learning',
      description: 'Linear Algebra, Calculus, and Statistics fundamentals',
      type: 'foundation',
      estimatedTime: 50,
      status: 'pending',
      resources: [
        {
          title: 'Mathematics for ML',
          url: 'https://www.coursera.org/specializations/mathematics-machine-learning',
          type: 'course',
          platform: 'Coursera',
          isFree: true
        },
        {
          title: 'Khan Academy Linear Algebra',
          url: 'https://www.khanacademy.org/math/linear-algebra',
          type: 'course',
          platform: 'Khan Academy',
          isFree: true
        }
      ]
    });

    roadmap.push({
      id: 'ml-python-data',
      title: 'Python for Data Science',
      description: 'NumPy, Pandas, Matplotlib, and Scikit-learn',
      type: 'core',
      estimatedTime: 40,
      status: 'pending',
      resources: [
        {
          title: 'Data Science with Python',
          url: 'https://www.youtube.com/watch?v=GPVsHOlRBBI',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        },
        {
          title: 'Scikit-learn Documentation',
          url: 'https://scikit-learn.org/stable/user_guide.html',
          type: 'documentation',
          platform: 'Scikit-learn',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Iris Flower Classification',
        description: 'Build a machine learning model to classify iris flowers using scikit-learn',
        difficulty: 'beginner',
        deliverables: ['Data exploration', 'Model training', 'Accuracy evaluation', 'Visualization'],
        estimatedTime: 12
      }
    });

    roadmap.push({
      id: 'ml-deep-learning',
      title: 'Deep Learning with TensorFlow/PyTorch',
      description: 'Neural networks, CNNs, and modern deep learning frameworks',
      type: 'advanced',
      estimatedTime: 60,
      status: 'pending',
      resources: [
        {
          title: 'Deep Learning Specialization',
          url: 'https://www.coursera.org/specializations/deep-learning',
          type: 'course',
          platform: 'Coursera',
          isFree: true
        },
        {
          title: 'PyTorch Tutorials',
          url: 'https://pytorch.org/tutorials/',
          type: 'tutorial',
          platform: 'PyTorch',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Image Classification CNN',
        description: 'Build a convolutional neural network for image classification using CIFAR-10 dataset',
        difficulty: 'advanced',
        deliverables: ['CNN architecture', 'Data preprocessing', 'Model training', 'Performance analysis'],
        estimatedTime: 35
      }
    });

    return roadmap;
  }

  private getAWSRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    roadmap.push({
      id: 'aws-fundamentals',
      title: 'AWS Cloud Fundamentals',
      description: 'Understanding cloud computing concepts and AWS global infrastructure',
      type: 'foundation',
      estimatedTime: 25,
      status: 'pending',
      resources: [
        {
          title: 'AWS Cloud Practitioner Essentials',
          url: 'https://aws.amazon.com/training/learn-about/cloud-practitioner/',
          type: 'course',
          platform: 'AWS',
          isFree: true
        },
        {
          title: 'AWS Free Tier Guide',
          url: 'https://aws.amazon.com/free/',
          type: 'documentation',
          platform: 'AWS',
          isFree: true
        }
      ]
    });

    roadmap.push({
      id: 'aws-core-services',
      title: 'Core AWS Services',
      description: 'EC2, S3, RDS, Lambda, and VPC fundamentals',
      type: 'core',
      estimatedTime: 40,
      status: 'pending',
      resources: [
        {
          title: 'AWS Hands-on Tutorials',
          url: 'https://aws.amazon.com/getting-started/hands-on/',
          type: 'tutorial',
          platform: 'AWS',
          isFree: true
        },
        {
          title: 'Linux Academy AWS Essentials',
          url: 'https://linuxacademy.com/course/aws-essentials/',
          type: 'course',
          platform: 'Linux Academy',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Serverless Web Application',
        description: 'Build a serverless web app using Lambda, API Gateway, and DynamoDB',
        difficulty: 'intermediate',
        deliverables: ['API Gateway setup', 'Lambda functions', 'DynamoDB table', 'Frontend integration'],
        estimatedTime: 25
      }
    });

    return roadmap;
  }

  private getDockerRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    roadmap.push({
      id: 'docker-basics',
      title: 'Docker Fundamentals',
      description: 'Containers, images, and basic Docker commands',
      type: 'foundation',
      estimatedTime: 15,
      status: 'pending',
      resources: [
        {
          title: 'Docker for Beginners',
          url: 'https://docker-curriculum.com/',
          type: 'tutorial',
          platform: 'Docker Curriculum',
          isFree: true
        },
        {
          title: 'Docker Official Getting Started',
          url: 'https://docs.docker.com/get-started/',
          type: 'tutorial',
          platform: 'Docker',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Dockerize a Node.js App',
        description: 'Containerize a simple Node.js application and run it with Docker',
        difficulty: 'beginner',
        deliverables: ['Dockerfile creation', 'Image building', 'Container running', 'Volume mounting'],
        estimatedTime: 8
      }
    });

    roadmap.push({
      id: 'docker-compose',
      title: 'Multi-container Applications',
      description: 'Docker Compose for managing multi-container applications',
      type: 'core',
      estimatedTime: 20,
      status: 'pending',
      resources: [
        {
          title: 'Docker Compose Tutorial',
          url: 'https://docs.docker.com/compose/gettingstarted/',
          type: 'tutorial',
          platform: 'Docker',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Full-Stack App with Docker Compose',
        description: 'Set up a complete application stack with React, Node.js, and MongoDB using Docker Compose',
        difficulty: 'intermediate',
        deliverables: ['docker-compose.yml', 'Multi-service setup', 'Network configuration', 'Volume management'],
        estimatedTime: 18
      }
    });

    return roadmap;
  }

  private getTypeScriptRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    if (!currentSkills.has('javascript')) {
      roadmap.push({
        id: 'ts-js-basics',
        title: 'JavaScript Fundamentals',
        description: 'Ensure you have solid JavaScript fundamentals before learning TypeScript',
        type: 'foundation',
        estimatedTime: 20,
        status: 'pending',
        resources: [
          {
            title: 'JavaScript Fundamentals for TypeScript',
            url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
            type: 'tutorial',
            platform: 'YouTube',
            isFree: true
          }
        ]
      });
    }

    roadmap.push({
      id: 'ts-basics',
      title: 'TypeScript Fundamentals (HIGH PRIORITY)',
      description: 'Static typing, interfaces, and basic TypeScript concepts',
      type: 'foundation',
      estimatedTime: 15,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'TypeScript in 5 Minutes',
          url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html',
          type: 'tutorial',
          platform: 'TypeScript',
          isFree: true
        },
        {
          title: 'TypeScript Deep Dive',
          url: 'https://basarat.gitbook.io/typescript/',
          type: 'documentation',
          platform: 'GitBook',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Typed Todo App',
        description: 'Build a todo application with full TypeScript type safety',
        difficulty: 'beginner',
        deliverables: ['Interface definitions', 'Type guards', 'Generic types', 'Error handling'],
        estimatedTime: 12
      }
    });

    roadmap.push({
      id: 'ts-advanced-types',
      title: '🔥 Interview HOT! Advanced Types & Generics',
      description: 'Union types, intersection types, conditional types, and generics - CRITICAL for senior TypeScript roles',
      type: 'core',
      estimatedTime: 20,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'Advanced Types',
          url: 'https://www.typescriptlang.org/docs/handbook/advanced-types.html',
          type: 'documentation',
          platform: 'TypeScript',
          isFree: true
        },
        {
          title: 'TypeScript Generics Guide',
          url: 'https://www.youtube.com/watch?v=nViEqpgwxHE',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Type-Safe API Client',
        description: 'Create a fully typed API client with proper error handling',
        difficulty: 'intermediate',
        deliverables: ['Generic API functions', 'Type-safe responses', 'Error types', 'Request/response types'],
        estimatedTime: 18
      }
    });

    roadmap.push({
      id: 'ts-react-integration',
      title: 'TypeScript with React',
      description: 'Using TypeScript effectively in React applications',
      type: 'core',
      estimatedTime: 15,
      status: 'pending',
      resources: [
        {
          title: 'React TypeScript Cheatsheet',
          url: 'https://react-typescript-cheatsheet.netlify.app/',
          type: 'documentation',
          platform: 'Netlify',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Full-Stack TypeScript App',
        description: 'Build a React + Node.js app with end-to-end TypeScript',
        difficulty: 'advanced',
        deliverables: ['Frontend types', 'Backend types', 'API contracts', 'Type-safe communication'],
        estimatedTime: 25
      }
    });

    return roadmap;
  }
  private getReactRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    if (!currentSkills.has('javascript')) {
      roadmap.push({
        id: 'react-js-prereq',
        title: 'JavaScript Fundamentals',
        description: 'Modern JavaScript (ES6+) knowledge required',
        type: 'foundation',
        estimatedTime: 15,
        status: 'pending',
        resources: [
          {
            title: 'Modern JavaScript for React',
            url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
            type: 'tutorial',
            platform: 'YouTube',
            isFree: true
          }
        ]
      });
    }

    roadmap.push({
      id: 'react-core-concepts',
      title: 'React Core Concepts (HIGH PRIORITY)',
      description: 'Components, JSX, props, state, and lifecycle',
      type: 'foundation',
      estimatedTime: 20,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'React Official Documentation',
          url: 'https://react.dev/learn',
          type: 'documentation',
          platform: 'React.dev',
          isFree: true
        },
        {
          title: 'React Crash Course',
          url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'React Portfolio Website',
        description: 'Build a personal portfolio with multiple components and routing',
        difficulty: 'intermediate',
        deliverables: ['Component composition', 'State management', 'Props drilling solution', 'Responsive design'],
        estimatedTime: 20
      }
    });

    roadmap.push({
      id: 'react-hooks-advanced',
      title: '🔥 Interview HOT! Advanced Hooks & Patterns',
      description: 'Custom hooks, useEffect, useContext, performance optimization - Asked in 90% of React interviews',
      type: 'core',
      estimatedTime: 25,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'React Hooks Deep Dive',
          url: 'https://www.youtube.com/watch?v=cF2lQ_gZeA8',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        },
        {
          title: 'React Performance Optimization',
          url: 'https://www.youtube.com/watch?v=5fLW5Q5ODiE',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Advanced React Dashboard',
        description: 'Build a complex dashboard with multiple data visualizations and interactions',
        difficulty: 'advanced',
        deliverables: ['Custom hooks', 'Context optimization', 'Memoization', 'Virtual scrolling'],
        estimatedTime: 30
      }
    });

    roadmap.push({
      id: 'react-state-management',
      title: 'State Management Solutions',
      description: 'Context API, Redux, Zustand, and server state management',
      type: 'advanced',
      estimatedTime: 20,
      status: 'pending',
      resources: [
        {
          title: 'Redux Toolkit Tutorial',
          url: 'https://redux-toolkit.js.org/tutorials/overview',
          type: 'tutorial',
          platform: 'Redux',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'E-commerce Platform',
        description: 'Build a full-featured e-commerce site with complex state management',
        difficulty: 'advanced',
        deliverables: ['Shopping cart', 'User authentication', 'Product catalog', 'Order management'],
        estimatedTime: 35
      }
    });

    return roadmap;
  }

  private getAngularRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    if (!currentSkills.has('javascript') && !currentSkills.has('typescript')) {
      roadmap.push({
        id: 'angular-prereq',
        title: 'JavaScript/TypeScript Fundamentals',
        description: 'Strong foundation in JS/TS required for Angular',
        type: 'foundation',
        estimatedTime: 25,
        status: 'pending',
        resources: [
          {
            title: 'TypeScript for Angular',
            url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html',
            type: 'tutorial',
            platform: 'TypeScript',
            isFree: true
          }
        ]
      });
    }

    roadmap.push({
      id: 'angular-fundamentals',
      title: 'Angular Fundamentals (HIGH PRIORITY)',
      description: 'Components, modules, services, dependency injection',
      type: 'foundation',
      estimatedTime: 25,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'Angular Official Tutorial',
          url: 'https://angular.io/tutorial',
          type: 'tutorial',
          platform: 'Angular.io',
          isFree: true
        },
        {
          title: 'Angular Crash Course',
          url: 'https://www.youtube.com/watch?v=3dHNOWTI7XU',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Angular Task Manager',
        description: 'Build a task management app with CRUD operations and routing',
        difficulty: 'intermediate',
        deliverables: ['Component architecture', 'Service layer', 'Routing', 'Forms'],
        estimatedTime: 20
      }
    });

    roadmap.push({
      id: 'angular-reactive-forms',
      title: '🔥 Interview HOT! Reactive Forms & RxJS',
      description: 'Advanced form handling and reactive programming with RxJS',
      type: 'core',
      estimatedTime: 20,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'Angular Reactive Forms',
          url: 'https://angular.io/guide/reactive-forms',
          type: 'documentation',
          platform: 'Angular.io',
          isFree: true
        },
        {
          title: 'RxJS Deep Dive',
          url: 'https://www.youtube.com/watch?v=T9wOu11uU6U',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Dynamic Form Builder',
        description: 'Create a dynamic form builder with validation and complex field types',
        difficulty: 'advanced',
        deliverables: ['Dynamic components', 'Form validation', 'Custom validators', 'Form state management'],
        estimatedTime: 25
      }
    });

    roadmap.push({
      id: 'angular-performance',
      title: 'Angular Performance & Best Practices',
      description: 'Lazy loading, change detection, bundle optimization',
      type: 'advanced',
      estimatedTime: 15,
      status: 'pending',
      resources: [
        {
          title: 'Angular Performance Guide',
          url: 'https://angular.io/guide/performance',
          type: 'documentation',
          platform: 'Angular.io',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Enterprise Angular App',
        description: 'Build a large-scale Angular application with advanced patterns',
        difficulty: 'advanced',
        deliverables: ['Lazy loading', 'State management', 'Performance optimization', 'Testing'],
        estimatedTime: 40
      }
    });

    return roadmap;
  }

  private getMicroservicesRoadmap(currentSkills: Set<string>): RoadmapStep[] {
    const roadmap: RoadmapStep[] = [];

    roadmap.push({
      id: 'microservices-fundamentals',
      title: 'Microservices Architecture Fundamentals (HIGH PRIORITY)',
      description: 'Understanding microservices vs monolithic architecture',
      type: 'foundation',
      estimatedTime: 15,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'Microservices Guide',
          url: 'https://microservices.io/',
          type: 'documentation',
          platform: 'Microservices.io',
          isFree: true
        },
        {
          title: 'Microservices Patterns',
          url: 'https://www.youtube.com/watch?v=8XU-MGY3VvI',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Microservices Design Document',
        description: 'Design a microservices architecture for an e-commerce platform',
        difficulty: 'intermediate',
        deliverables: ['Service boundaries', 'API contracts', 'Data ownership', 'Communication patterns'],
        estimatedTime: 15
      }
    });

    roadmap.push({
      id: 'microservices-communication',
      title: '🔥 Interview HOT! Inter-Service Communication',
      description: 'REST APIs, gRPC, message queues, and service discovery',
      type: 'core',
      estimatedTime: 20,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'API Gateway Pattern',
          url: 'https://microservices.io/patterns/apigateway.html',
          type: 'documentation',
          platform: 'Microservices.io',
          isFree: true
        },
        {
          title: 'gRPC vs REST',
          url: 'https://www.youtube.com/watch?v=gnchfOcfDh4',
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Service Mesh Implementation',
        description: 'Implement inter-service communication with API Gateway and message queues',
        difficulty: 'advanced',
        deliverables: ['API Gateway setup', 'Service discovery', 'Circuit breaker', 'Load balancing'],
        estimatedTime: 30
      }
    });

    roadmap.push({
      id: 'microservices-data-management',
      title: 'Data Management in Microservices (HIGH PRIORITY)',
      description: 'Database per service, event sourcing, CQRS patterns',
      type: 'core',
      estimatedTime: 18,
      status: 'pending',
      priority: 'high',
      resources: [
        {
          title: 'Database per Service',
          url: 'https://microservices.io/patterns/data/database-per-service.html',
          type: 'documentation',
          platform: 'Microservices.io',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Event-Driven Microservices',
        description: 'Implement event sourcing and CQRS in a microservices system',
        difficulty: 'advanced',
        deliverables: ['Event store', 'Read models', 'Event handlers', 'Saga pattern'],
        estimatedTime: 35
      }
    });

    roadmap.push({
      id: 'microservices-observability',
      title: 'Observability & Monitoring',
      description: 'Logging, metrics, tracing, and centralized monitoring',
      type: 'advanced',
      estimatedTime: 15,
      status: 'pending',
      resources: [
        {
          title: 'Distributed Tracing',
          url: 'https://opentracing.io/',
          type: 'documentation',
          platform: 'OpenTracing',
          isFree: true
        }
      ],
      projectMilestone: {
        title: 'Microservices Monitoring Dashboard',
        description: 'Set up comprehensive monitoring for a microservices system',
        difficulty: 'intermediate',
        deliverables: ['Centralized logging', 'Metrics collection', 'Health checks', 'Alerting'],
        estimatedTime: 20
      }
    });

    return roadmap;
  }
  private getGenericRoadmap(targetSkill: string, currentSkills: Set<string>): RoadmapStep[] {
    return [{
      id: `generic-${targetSkill.toLowerCase().replace(/\s+/g, '-')}`,
      title: `${targetSkill} Learning Path`,
      description: `Comprehensive guide to learning ${targetSkill}`,
      type: 'foundation',
      estimatedTime: 30,
      status: 'pending',
      resources: [
        {
          title: `freeCodeCamp ${targetSkill}`,
          url: `https://www.freecodecamp.org/learn/${targetSkill.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'course',
          platform: 'freeCodeCamp',
          isFree: true
        },
        {
          title: `MDN ${targetSkill} Documentation`,
          url: `https://developer.mozilla.org/en-US/docs/Web/${targetSkill}`,
          type: 'documentation',
          platform: 'MDN',
          isFree: true
        },
        {
          title: `${targetSkill} on YouTube`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' tutorial')}`,
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ],
      projectMilestone: {
        title: `${targetSkill} Practice Project`,
        description: `Build a practical project to apply your ${targetSkill} knowledge`,
        difficulty: 'intermediate',
        deliverables: ['Core functionality', 'Best practices', 'Documentation', 'Testing'],
        estimatedTime: 20
      }
    }];
  }

  private async generateKnowledgeGraph(targetSkill: string, learningPath: LearningNode[], currentSkills: Set<string>): Promise<KnowledgeGraphData> {
    const skill = targetSkill.toLowerCase();

    let knowledgeGraph: KnowledgeGraphData;

    // Priority-ordered skill matching - most specific patterns first
    // Machine Learning & AI (check first to avoid conflicts)
    if (skill === 'machine learning' || skill === 'ml' ||
        (skill.includes('machine') && skill.includes('learning')) ||
        skill.includes('neural') || skill.includes('deep learning') ||
        (skill.includes('data science') && !skill.includes('database'))) {
      knowledgeGraph = this.generateMachineLearningKnowledgeGraph(currentSkills);
    }
    else if (skill === 'ai' || skill === 'artificial intelligence' ||
             skill.includes('artificial intelligence')) {
      return this.generateAIKnowledgeGraph(currentSkills);
    }
    // Cloud & Infrastructure
    else if (skill === 'aws' || skill === 'azure' || skill === 'gcp' ||
             skill === 'amazon web services' || skill === 'google cloud' ||
             (skill.includes('cloud') && !skill.includes('frontend'))) {
      return this.generateAWSKnowledgeGraph(currentSkills);
    }
    // Programming Languages (exact matches first)
    else if (skill === 'javascript' || skill === 'js') {
      return this.generateJavaScriptKnowledgeGraph(currentSkills);
    }
    else if (skill === 'python' || skill === 'py') {
      return this.generatePythonKnowledgeGraph(currentSkills);
    }
    else if (skill === 'typescript' || skill === 'ts') {
      knowledgeGraph = this.generateTypeScriptKnowledgeGraph(currentSkills);
    }
    // Frameworks & Libraries
    else if (skill === 'react' || skill.includes('react')) {
      knowledgeGraph = this.generateReactKnowledgeGraph(currentSkills);
    }
    else if (skill === 'angular' || skill.includes('angular')) {
      knowledgeGraph = this.generateAngularKnowledgeGraph(currentSkills);
    }
    else if (skill === 'vue' || skill === 'react native' || skill.includes('frontend')) {
      return this.generateJavaScriptKnowledgeGraph(currentSkills);
    }
    else if (skill === 'django') {
      return this.generateDjangoKnowledgeGraph(currentSkills);
    }
    else if (skill === 'flask') {
      return this.generateFlaskKnowledgeGraph(currentSkills);
    }
    else if (skill === 'nodejs' || skill === 'node' || skill === 'express') {
      return this.generateNodeJSKnowledgeGraph(currentSkills);
    }
    // Databases & Data
    else if (skill === 'sql' || skill === 'mysql' || skill === 'postgresql' ||
             skill === 'mongodb' || skill === 'oracle' ||
             (skill.includes('database') && !skill.includes('data science'))) {
      return this.generateSQLKnowledgeGraph(currentSkills);
    }
    // DevOps & Tools
    else if (skill === 'docker') {
      return this.generateDockerKnowledgeGraph(currentSkills);
    }
    else if (skill === 'kubernetes' || skill.includes('k8s')) {
      return this.generateKubernetesKnowledgeGraph(currentSkills);
    }
    else if (skill === 'git' || skill === 'github' || skill === 'gitlab') {
      return this.generateGitKnowledgeGraph(currentSkills);
    }
    else if (skill === 'jenkins' || skill === 'terraform' || skill.includes('ci/cd')) {
      return this.generateDevOpsKnowledgeGraph(currentSkills);
    }
    // Testing
    else if (skill === 'testing' || skill === 'jest' || skill === 'cypress' ||
             skill === 'selenium' || skill.includes('qa')) {
      return this.generateTestingKnowledgeGraph(currentSkills);
    }
    // APIs
    else if (skill === 'rest api' || skill === 'graphql' ||
             (skill.includes('api') && !skill.includes('data'))) {
      return this.generateAPIKnowledgeGraph(currentSkills);
    }
    // Mobile
    else if (skill === 'ios' || skill === 'android' || skill.includes('mobile')) {
      return this.generateMobileKnowledgeGraph(currentSkills);
    }
    // Security
    else if (skill.includes('cybersecurity') || skill.includes('penetration') ||
             (skill.includes('security') && !skill.includes('social'))) {
      return this.generateCybersecurityKnowledgeGraph(currentSkills);
    }
    // System Administration
    else if (skill === 'linux' || skill === 'bash' || skill === 'shell') {
      return this.generateLinuxKnowledgeGraph(currentSkills);
    }
    // Methodologies
    else if (skill === 'agile' || skill === 'scrum' || skill === 'kanban') {
      return this.generateAgileKnowledgeGraph(currentSkills);
    }
    // Algorithms & Patterns
    else if (skill.includes('algorithm') || skill.includes('design pattern')) {
      return this.generateAlgorithmKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('microservice') || skill === 'microservices') {
      return this.generateMicroservicesKnowledgeGraph(currentSkills);
    }
    // Broad patterns (lower priority)
    else if (skill.includes('data') || skill.includes('analytics')) {
      return this.generateMachineLearningKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('backend') || skill.includes('server')) {
      return this.generateNodeJSKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('container') || skill.includes('deployment')) {
      return this.generateDockerKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('version control')) {
      return this.generateGitKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('test')) {
      return this.generateTestingKnowledgeGraph(currentSkills);
    }
    // Additional categorizations for common skills
    else if (skill.includes('communication') || skill.includes('presentation') ||
             skill.includes('leadership') || skill.includes('management')) {
      return this.generateCommunicationKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('marketing') || skill.includes('sales') || skill.includes('business')) {
      return this.generateBusinessKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('finance') || skill.includes('accounting') || skill.includes('budget')) {
      return this.generateFinanceKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('writing') || skill.includes('content') || skill.includes('documentation')) {
      return this.generateWritingKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('design') || skill.includes('ui') || skill.includes('ux')) {
      return this.generateDesignKnowledgeGraph(currentSkills);
    }
    // Additional common skills that appear as gaps
    else if (skill.includes('agile') || skill.includes('scrum') || skill.includes('kanban')) {
      return this.generateAgileKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('testing') || skill.includes('qa') || skill.includes('selenium') || skill.includes('jest')) {
      return this.generateTestingKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('git') || skill.includes('github') || skill.includes('version control')) {
      return this.generateGitKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('docker') || skill.includes('kubernetes') || skill.includes('container')) {
      return this.generateDockerKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('linux') || skill.includes('bash') || skill.includes('shell')) {
      return this.generateLinuxKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('api') || skill.includes('rest') || skill.includes('graphql')) {
      return this.generateAPIKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('security') || skill.includes('cybersecurity')) {
      return this.generateCybersecurityKnowledgeGraph(currentSkills);
    }
    else if (skill.includes('project management') || skill.includes('jira') || skill.includes('trello')) {
      return this.generateAgileKnowledgeGraph(currentSkills); // Reuse agile for project management
    }
    else if (skill.includes('excel') || skill.includes('spreadsheet') || skill.includes('power bi')) {
      knowledgeGraph = this.generateBusinessKnowledgeGraph(currentSkills); // Reuse business for excel/spreadsheets
    }
    else if (skill.includes('powerpoint') || skill.includes('presentation')) {
      knowledgeGraph = this.generateCommunicationKnowledgeGraph(currentSkills); // Reuse communication for presentations
    }
    else {
      // Use LLM to generate comprehensive knowledge graph for unknown skills
      console.log(`🤖 Using LLM to generate knowledge graph for skill: ${targetSkill}`);
      // Import dynamically to avoid circular dependencies
      knowledgeGraph = await this.generateLLMBasedKnowledgeGraph(targetSkill, currentSkills);
    }

    // Ensure all nodes are properly connected before returning
    console.log(`🔗 Ensuring all nodes connected for skill: ${targetSkill}`);
    return this.ensureAllNodesConnected(knowledgeGraph);
  }

  private async generateLLMBasedKnowledgeGraph(targetSkill: string, currentSkills: Set<string>): Promise<KnowledgeGraphData> {
    try {
      // Dynamic import to avoid issues
      const { generateLLMKnowledgeGraph } = await import('./llmKnowledgeGraphGenerator');
      return await generateLLMKnowledgeGraph(targetSkill, currentSkills);
    } catch (error) {
      console.error('❌ LLM generation failed, using enhanced fallback:', error);
      return this.generateEnhancedGenericKnowledgeGraph(targetSkill, currentSkills);
    }
  }
  private generateSQLKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'sql-basics',
        title: 'SQL Fundamentals',
        description: 'Core SQL concepts and basic queries',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: ['sql-joins', 'sql-aggregation'],
        miniTopics: [
          {
            title: 'Basic SELECT Queries',
            description: 'SELECT, FROM, WHERE clauses',
            resources: [
              { title: 'SQLZoo SELECT Basics', url: 'https://sqlzoo.net/wiki/SELECT_basics', type: 'practice', platform: 'SQLZoo', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Data Types & Tables',
            description: 'Understanding SQL data types and table structure',
            resources: [
              { title: 'SQL Data Types', url: 'https://www.w3schools.com/sql/sql_datatypes.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'INSERT, UPDATE, DELETE',
            description: 'Modifying data in tables',
            resources: [
              { title: 'SQL DML Commands', url: 'https://www.w3schools.com/sql/sql_insert.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Creating Tables',
            description: 'CREATE TABLE and constraints',
            resources: [
              { title: 'SQL CREATE TABLE', url: 'https://www.w3schools.com/sql/sql_create_table.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Personal Library Database',
          description: 'Create a database for managing a personal library with books, authors, and categories',
          difficulty: 'beginner',
          deliverables: ['Database schema design', 'Tables creation', 'Sample data insertion', 'Basic queries'],
          estimatedTime: 8
        }
      },
      {
        id: 'sql-joins',
        title: 'SQL Joins & Relationships',
        description: 'Understanding table relationships and joins',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 12,
        position: { x: 100, y: 250 },
        connections: ['sql-subqueries', 'sql-indexes'],
        miniTopics: [
          {
            title: 'INNER JOIN',
            description: 'Combining data from multiple tables',
            resources: [
              { title: 'SQL Joins', url: 'https://www.w3schools.com/sql/sql_join.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'LEFT/RIGHT/FULL JOINs',
            description: 'Different types of outer joins',
            resources: [
              { title: 'SQL Outer Joins', url: 'https://www.w3schools.com/sql/sql_join_left.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Primary/Foreign Keys',
            description: 'Understanding table relationships',
            resources: [
              { title: 'SQL Keys', url: 'https://www.w3schools.com/sql/sql_primarykey.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'sql-aggregation',
        title: 'Aggregation & Grouping',
        description: 'GROUP BY, aggregate functions, HAVING clause',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 10,
        position: { x: 300, y: 250 },
        connections: ['sql-subqueries'],
        miniTopics: [
          {
            title: 'Aggregate Functions',
            description: 'COUNT, SUM, AVG, MIN, MAX',
            resources: [
              { title: 'SQL Functions', url: 'https://www.w3schools.com/sql/sql_count_avg_sum.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'GROUP BY & HAVING',
            description: 'Grouping data and filtering groups',
            resources: [
              { title: 'SQL GROUP BY', url: 'https://www.w3schools.com/sql/sql_groupby.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'ORDER BY & LIMIT',
            description: 'Sorting and limiting results',
            resources: [
              { title: 'SQL ORDER BY', url: 'https://www.w3schools.com/sql/sql_orderby.asp', type: 'documentation', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Sales Analytics Database',
          description: 'Create a database for sales analytics with customer orders and product analysis',
          difficulty: 'intermediate',
          deliverables: ['Complex queries with joins', 'Aggregate reporting', 'Data analysis queries', 'Performance optimization'],
          estimatedTime: 15
        }
      },
      {
        id: 'sql-indexes-optimization',
        title: 'Indexes & Performance',
        description: 'Database optimization and query performance',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 200, y: 400 },
        connections: ['sql-stored-procedures'],
        miniTopics: [
          {
            title: 'Database Indexes',
            description: 'Creating and managing indexes for performance',
            resources: [
              { title: 'SQL Indexes', url: 'https://use-the-index-luke.com/', type: 'documentation', platform: 'Use The Index Luke', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Query Optimization',
            description: 'Analyzing and optimizing slow queries',
            resources: [
              { title: 'Query Optimization', url: 'https://dev.mysql.com/doc/refman/8.0/en/optimization.html', type: 'documentation', platform: 'MySQL', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'EXPLAIN Plans',
            description: 'Understanding query execution plans',
            resources: [
              { title: 'Using EXPLAIN', url: 'https://dev.mysql.com/doc/refman/8.0/en/explain.html', type: 'documentation', platform: 'MySQL', isFree: true }
            ],
            estimatedTime: 4
          }
        ],
        projectMilestone: {
          title: 'Database Performance Tuning',
          description: 'Optimize a database with slow queries by adding indexes and restructuring queries',
          difficulty: 'advanced',
          deliverables: ['Performance analysis', 'Index creation', 'Query optimization', 'Performance monitoring'],
          estimatedTime: 20
        }
      },
      {
        id: 'sql-advanced-queries',
        title: 'Advanced SQL Queries',
        description: 'Complex queries, CTEs, window functions',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 22,
        position: { x: 400, y: 400 },
        connections: ['sql-stored-procedures'],
        miniTopics: [
          {
            title: 'Common Table Expressions (CTEs)',
            description: 'Using WITH clauses for complex queries',
            resources: [
              { title: 'SQL CTEs', url: 'https://www.essentialsql.com/introduction-common-table-expressions-ctes/', type: 'tutorial', platform: 'Essential SQL', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Window Functions',
            description: 'ROW_NUMBER, RANK, LAG, LEAD functions',
            resources: [
              { title: 'Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html', type: 'documentation', platform: 'PostgreSQL', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Recursive Queries',
            description: 'Handling hierarchical and recursive data',
            resources: [
              { title: 'Recursive CTEs', url: 'https://www.essentialsql.com/recursive-ctes/', type: 'tutorial', platform: 'Essential SQL', isFree: true }
            ],
            estimatedTime: 8
          }
        ],
        projectMilestone: {
          title: 'Advanced Analytics Dashboard',
          description: 'Build complex SQL queries for a business intelligence dashboard with multiple data sources',
          difficulty: 'advanced',
          deliverables: ['Complex CTEs', 'Window functions', 'Recursive queries', 'Performance optimization'],
          estimatedTime: 25
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'sql-joins', to: 'sql-indexes-optimization', type: 'related', strength: 0.7 },
      { from: 'sql-indexes-optimization', to: 'sql-stored-procedures', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['sql-basics', 'sql-joins', 'sql-aggregation', 'sql-subqueries', 'sql-indexes-optimization', 'sql-advanced-queries'];

    return { nodes, edges, skillPath };
  }

  private generateGitKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'git-basics',
        title: 'Git Fundamentals',
        description: 'Version control basics and core commands',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 8,
        position: { x: 200, y: 100 },
        connections: ['git-branching'],
        miniTopics: [
          {
            title: 'Git Installation & Setup',
            description: 'Installing Git and basic configuration',
            resources: [
              { title: 'Git Installation', url: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git', type: 'documentation', platform: 'Git', isFree: true }
            ],
            estimatedTime: 2
          },
          {
            title: 'Basic Commands',
            description: 'init, add, commit, status, log',
            resources: [
              { title: 'Git Basics', url: 'https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository', type: 'documentation', platform: 'Git', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Understanding Git Flow',
            description: 'Working directory, staging area, repository',
            resources: [
              { title: 'Git Workflow', url: 'https://www.atlassian.com/git/tutorials/what-is-git', type: 'tutorial', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Personal Project Repository',
          description: 'Initialize a Git repository for a personal project and make your first commits',
          difficulty: 'beginner',
          deliverables: ['Repository initialization', 'File staging and committing', 'Commit history viewing', 'Basic Git workflow'],
          estimatedTime: 3
        }
      },
      {
        id: 'git-branching',
        title: 'Branching & Merging',
        description: 'Working with branches and merging strategies',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 12,
        position: { x: 100, y: 250 },
        connections: ['git-remote'],
        miniTopics: [
          {
            title: 'Creating & Switching Branches',
            description: 'branch, checkout, switch commands',
            resources: [
              { title: 'Git Branching', url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging', type: 'documentation', platform: 'Git', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Merge vs Rebase',
            description: 'Different strategies for combining branches',
            resources: [
              { title: 'Merging vs Rebasing', url: 'https://www.atlassian.com/git/tutorials/merging-vs-rebasing', type: 'tutorial', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Branch Management',
            description: 'Listing, deleting, and renaming branches',
            resources: [
              { title: 'Branch Management', url: 'https://git-scm.com/book/en/v2/Git-Branching-Branch-Management', type: 'documentation', platform: 'Git', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'git-remote',
        title: 'Remote Repositories',
        description: 'Working with GitHub and remote repositories',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 10,
        position: { x: 300, y: 250 },
        connections: [],
        miniTopics: [
          {
            title: 'Remote Operations',
            description: 'clone, fetch, pull, push commands',
            resources: [
              { title: 'Working with Remotes', url: 'https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes', type: 'documentation', platform: 'Git', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'GitHub Integration',
            description: 'Connecting local repo to GitHub',
            resources: [
              { title: 'GitHub Getting Started', url: 'https://docs.github.com/en/get-started/quickstart/hello-world', type: 'tutorial', platform: 'GitHub', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'SSH Keys & Authentication',
            description: 'Setting up secure GitHub access',
            resources: [
              { title: 'GitHub SSH Keys', url: 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh', type: 'documentation', platform: 'GitHub', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Collaborative Project on GitHub',
          description: 'Create a GitHub repository, push your code, and set up a basic README and .gitignore',
          difficulty: 'intermediate',
          deliverables: ['GitHub repository creation', 'Remote setup and pushing', 'README and documentation', 'Branch management'],
          estimatedTime: 8
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'git-basics', to: 'git-branching', type: 'related', strength: 0.9 },
      { from: 'git-branching', to: 'git-remote', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['git-basics', 'git-branching', 'git-remote'];

    return { nodes, edges, skillPath };
  }

  private generateAPIKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'api-basics',
        title: 'API Fundamentals',
        description: 'Understanding APIs, HTTP, and REST concepts',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 10,
        position: { x: 200, y: 100 },
        connections: ['rest-api', 'http-methods'],
        miniTopics: [
          {
            title: 'What is an API?',
            description: 'Understanding Application Programming Interfaces',
            resources: [
              { title: 'API Basics', url: 'https://www.redhat.com/en/topics/api/what-are-application-programming-interfaces', type: 'documentation', platform: 'Red Hat', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'HTTP Protocol',
            description: 'Requests, responses, status codes',
            resources: [
              { title: 'HTTP Overview', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'JSON Data Format',
            description: 'Working with JSON in APIs',
            resources: [
              { title: 'JSON Introduction', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'rest-api',
        title: 'REST API Design',
        description: 'RESTful API principles and best practices',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 100, y: 250 },
        connections: ['api-authentication', 'api-testing'],
        miniTopics: [
          {
            title: 'REST Principles',
            description: 'Stateless, uniform interface, client-server architecture',
            resources: [
              { title: 'REST API Tutorial', url: 'https://restfulapi.net/', type: 'tutorial', platform: 'RESTfulAPI.net', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Resource Design',
            description: 'URI patterns, HTTP methods, status codes',
            resources: [
              { title: 'REST Resource Naming', url: 'https://restfulapi.net/resource-naming/', type: 'documentation', platform: 'RESTfulAPI.net', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'API Versioning',
            description: 'Strategies for API versioning',
            resources: [
              { title: 'API Versioning', url: 'https://restfulapi.net/versioning/', type: 'documentation', platform: 'RESTfulAPI.net', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'RESTful Blog API',
          description: 'Design and document a REST API for a blogging platform',
          difficulty: 'intermediate',
          deliverables: ['API endpoint design', 'Resource modeling', 'HTTP method selection', 'Error response design'],
          estimatedTime: 12
        }
      },
      {
        id: 'http-methods',
        title: 'HTTP Methods & Status Codes',
        description: 'Complete guide to HTTP verbs and responses',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 8,
        position: { x: 300, y: 250 },
        connections: ['api-authentication'],
        miniTopics: [
          {
            title: 'CRUD Operations',
            description: 'GET, POST, PUT, DELETE methods',
            resources: [
              { title: 'HTTP Methods', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'HTTP Status Codes',
            description: '2xx, 3xx, 4xx, 5xx status codes',
            resources: [
              { title: 'Status Codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'http-methods', to: 'api-authentication', type: 'related', strength: 0.7 }
    ];

    const skillPath = ['api-basics', 'rest-api', 'http-methods'];

    return { nodes, edges, skillPath };
  }
  private generateNodeJSKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'nodejs-basics',
        title: 'Node.js Fundamentals',
        description: 'Server-side JavaScript with Node.js',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 20,
        position: { x: 200, y: 100 },
        connections: ['nodejs-express'],
        miniTopics: [
          {
            title: 'Node.js Installation',
            description: 'Installing Node.js and npm',
            resources: [
              { title: 'Node.js Getting Started', url: 'https://nodejs.org/en/docs/guides/getting-started-guide/', type: 'documentation', platform: 'Node.js', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Modules & require()',
            description: 'CommonJS modules and require system',
            resources: [
              { title: 'Modules', url: 'https://nodejs.org/api/modules.html', type: 'documentation', platform: 'Node.js', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'npm Package Manager',
            description: 'Installing and managing packages',
            resources: [
              { title: 'npm Documentation', url: 'https://docs.npmjs.com/', type: 'documentation', platform: 'npm', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'File System Operations',
            description: 'Reading and writing files with fs module',
            resources: [
              { title: 'File System', url: 'https://nodejs.org/api/fs.html', type: 'documentation', platform: 'Node.js', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Asynchronous Programming',
            description: 'Callbacks, promises, and async/await in Node.js',
            resources: [
              { title: 'Async Programming', url: 'https://nodejs.dev/learn/asynchronous-work', type: 'tutorial', platform: 'Node.js', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Node.js File Processor',
          description: 'Build a command-line application that processes text files',
          difficulty: 'beginner',
          deliverables: ['File reading/writing', 'Command line arguments', 'Error handling', 'npm package usage'],
          estimatedTime: 10
        }
      },
      {
        id: 'nodejs-express',
        title: 'Express.js Framework',
        description: 'Building web applications with Express',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 100, y: 250 },
        connections: [],
        miniTopics: [
          {
            title: 'Express Basics',
            description: 'Setting up Express server and routes',
            resources: [
              { title: 'Express Getting Started', url: 'https://expressjs.com/en/starter/hello-world.html', type: 'tutorial', platform: 'Express', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Middleware',
            description: 'Using and creating Express middleware',
            resources: [
              { title: 'Express Middleware', url: 'https://expressjs.com/en/guide/using-middleware.html', type: 'documentation', platform: 'Express', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Routing',
            description: 'Creating RESTful routes and route parameters',
            resources: [
              { title: 'Express Routing', url: 'https://expressjs.com/en/guide/routing.html', type: 'documentation', platform: 'Express', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Error Handling',
            description: 'Express error handling patterns',
            resources: [
              { title: 'Error Handling', url: 'https://expressjs.com/en/guide/error-handling.html', type: 'documentation', platform: 'Express', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Express REST API',
          description: 'Build a REST API for a task management system using Express',
          difficulty: 'intermediate',
          deliverables: ['CRUD endpoints', 'Input validation', 'Error handling', 'API documentation'],
          estimatedTime: 15
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'nodejs-basics', to: 'nodejs-express', type: 'related', strength: 0.9 }
    ];

    const skillPath = ['nodejs-basics', 'nodejs-express'];

    return { nodes, edges, skillPath };
  }
  private generateTypeScriptKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'typescript-fundamentals',
        title: '🎯 TypeScript Fundamentals (High Priority)',
        description: 'Core TypeScript concepts frequently asked in interviews',
        category: 'foundation',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 200, y: 100 },
        connections: ['typescript-types-system', 'typescript-functions-generics'],
        miniTopics: [
          {
            title: 'TypeScript vs JavaScript',
            description: 'Static vs dynamic typing, compilation process',
            resources: [
              { title: 'TypeScript for JavaScript Programmers', url: 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html', type: 'tutorial', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Basic Types',
            description: 'boolean, number, string, array, tuple, enum, any, unknown, never',
            resources: [
              { title: 'Basic Types', url: 'https://www.typescriptlang.org/docs/handbook/basic-types.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Type Annotations & Inference',
            description: 'Explicit typing vs type inference',
            resources: [
              { title: 'Type Inference', url: 'https://www.typescriptlang.org/docs/handbook/type-inference.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'TypeScript Configuration (tsconfig.json)',
            description: 'Compiler options, target, module resolution',
            resources: [
              { title: 'tsconfig.json', url: 'https://www.typescriptlang.org/docs/handbook/tsconfig-json.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Common Compiler Errors',
            description: 'Understanding and fixing TypeScript errors',
            resources: [
              { title: 'Common Errors', url: 'https://typescript.tv/errors/', type: 'documentation', platform: 'TypeScript TV', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'TypeScript Fundamentals Quiz App',
          description: 'Build a quiz application demonstrating TypeScript fundamentals',
          difficulty: 'intermediate',
          deliverables: ['Type definitions', 'Interface design', 'Type safety implementation', 'Error handling'],
          estimatedTime: 15
        }
      },
      {
        id: 'typescript-types-system',
        title: '🔥 Interview HOT! Advanced Type System',
        description: 'Complex types and type manipulation techniques',
        category: 'core',
        difficulty: 'advanced',
        estimatedTime: 25,
        position: { x: 100, y: 250 },
        connections: ['typescript-oop', 'typescript-utility-types'],
        miniTopics: [
          {
            title: 'Union & Intersection Types',
            description: 'Combining types with | and & operators',
            resources: [
              { title: 'Union Types', url: 'https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Interfaces vs Type Aliases',
            description: 'When to use interface vs type',
            resources: [
              { title: 'Interfaces vs Types', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Discriminated Unions',
            description: 'Type-safe unions with discriminant properties',
            resources: [
              { title: 'Discriminated Unions', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Mapped Types & Conditional Types',
            description: 'Advanced type manipulation',
            resources: [
              { title: 'Advanced Types', url: 'https://www.typescriptlang.org/docs/handbook/2/types-from-types.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'Template Literal Types',
            description: 'String manipulation at the type level',
            resources: [
              { title: 'Template Literals', url: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Type-Safe API Client',
          description: 'Build a fully type-safe API client with advanced TypeScript features',
          difficulty: 'advanced',
          deliverables: ['Generic API types', 'Error type handling', 'Response type inference', 'Type guards'],
          estimatedTime: 25
        }
      },
      {
        id: 'typescript-functions-generics',
        title: '🔥 Interview HOT! Functions & Generics',
        description: 'Function types, overloads, and generic programming',
        category: 'core',
        difficulty: 'advanced',
        estimatedTime: 20,
        position: { x: 300, y: 250 },
        connections: ['typescript-oop', 'typescript-async'],
        miniTopics: [
          {
            title: 'Function Type Signatures',
            description: 'Typing function parameters and return values',
            resources: [
              { title: 'Function Types', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Function Overloads',
            description: 'Multiple function signatures for different use cases',
            resources: [
              { title: 'Function Overloads', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Generic Functions & Classes',
            description: 'Creating reusable generic components',
            resources: [
              { title: 'Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Generic Constraints',
            description: 'Limiting generic types with constraints',
            resources: [
              { title: 'Generic Constraints', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Keyof & Indexed Access Types',
            description: 'Advanced generic patterns',
            resources: [
              { title: 'Indexed Types', url: 'https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Generic Data Structures Library',
          description: 'Implement generic Stack, Queue, and LinkedList with full type safety',
          difficulty: 'advanced',
          deliverables: ['Generic classes', 'Type constraints', 'Method overloads', 'Type inference'],
          estimatedTime: 20
        }
      },
      {
        id: 'typescript-utility-types',
        title: '🔥 Interview HOT! Utility Types & Patterns',
        description: 'Built-in utility types and advanced TypeScript patterns',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 15,
        position: { x: 50, y: 400 },
        connections: ['typescript-declaration-files'],
        miniTopics: [
          {
            title: 'Built-in Utility Types',
            description: 'Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract',
            resources: [
              { title: 'Utility Types', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Custom Utility Types',
            description: 'Creating your own utility types',
            resources: [
              { title: 'Custom Utilities', url: 'https://www.typescriptlang.org/docs/handbook/2/types-from-types.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Type Guards & Predicates',
            description: 'Runtime type checking functions',
            resources: [
              { title: 'Type Guards', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Module Augmentation',
            description: 'Extending existing module types',
            resources: [
              { title: 'Module Augmentation', url: 'https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 2
          }
        ]
      },
      {
        id: 'typescript-oop',
        title: '🏗️ Object-Oriented Programming',
        description: 'Classes, inheritance, and OOP patterns in TypeScript',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 18,
        position: { x: 200, y: 400 },
        connections: ['typescript-declaration-files'],
        miniTopics: [
          {
            title: 'Classes & Access Modifiers',
            description: 'public, private, protected, readonly',
            resources: [
              { title: 'Classes', url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Abstract Classes & Methods',
            description: 'Abstract base classes and method contracts',
            resources: [
              { title: 'Abstract Classes', url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html#abstract-classes-and-members', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Method Overriding & Overloading',
            description: 'Polymorphism and method signatures',
            resources: [
              { title: 'Method Overriding', url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html#inheritance', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Mixins & Composition',
            description: 'Alternative to inheritance using composition',
            resources: [
              { title: 'Mixins', url: 'https://www.typescriptlang.org/docs/handbook/mixins.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'SOLID Principles',
            description: 'Object-oriented design principles',
            resources: [
              { title: 'SOLID in TypeScript', url: 'https://blog.bitsrc.io/solid-principles-in-typescript-153e6923ffdb', type: 'documentation', platform: 'Bits and Pieces', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'TypeScript OOP Framework',
          description: 'Design and implement an OOP framework demonstrating advanced TypeScript patterns',
          difficulty: 'advanced',
          deliverables: ['Abstract base classes', 'Generic interfaces', 'Design patterns', 'SOLID principles'],
          estimatedTime: 30
        }
      },
      {
        id: 'typescript-async',
        title: '⚡ Asynchronous Programming',
        description: 'Promises, async/await, and advanced async patterns',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 12,
        position: { x: 350, y: 400 },
        connections: ['typescript-declaration-files'],
        miniTopics: [
          {
            title: 'Promise Types',
            description: 'Typing Promise-based APIs',
            resources: [
              { title: 'Promises', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-promises', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Async Function Types',
            description: 'Return types of async functions',
            resources: [
              { title: 'Async Functions', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#async-functions', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Generator Functions',
            description: 'Typed generator functions and iterators',
            resources: [
              { title: 'Generators', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#generator-functions', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Error Handling Types',
            description: 'Typing try/catch blocks and error objects',
            resources: [
              { title: 'Error Handling', url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exception-handling', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'typescript-declaration-files',
        title: '📝 Declaration Files & Modules',
        description: 'Creating .d.ts files and advanced module patterns',
        category: 'specialization',
        difficulty: 'advanced',
        estimatedTime: 15,
        position: { x: 200, y: 550 },
        connections: [],
        miniTopics: [
          {
            title: 'Declaration Files (.d.ts)',
            description: 'Creating type definitions for JavaScript libraries',
            resources: [
              { title: 'Declaration Files', url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'DefinitelyTyped',
            description: 'Using and contributing to @types packages',
            resources: [
              { title: 'DefinitelyTyped', url: 'https://github.com/DefinitelyTyped/DefinitelyTyped', type: 'documentation', platform: 'GitHub', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Module Resolution Strategies',
            description: 'Classic vs Node module resolution',
            resources: [
              { title: 'Module Resolution', url: 'https://www.typescriptlang.org/docs/handbook/module-resolution.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Triple-Slash Directives',
            description: '/// <reference /> directives',
            resources: [
              { title: 'Triple-Slash', url: 'https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html', type: 'documentation', platform: 'TypeScript', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'TypeScript Declaration Library',
          description: 'Create type declarations for a popular JavaScript library',
          difficulty: 'advanced',
          deliverables: ['.d.ts files', 'Type definitions', 'Module augmentation', 'Publishing to DefinitelyTyped'],
          estimatedTime: 25
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'typescript-types-system', to: 'typescript-oop', type: 'related', strength: 0.8 },
      { from: 'typescript-oop', to: 'typescript-declaration-files', type: 'related', strength: 0.7 },
      { from: 'typescript-async', to: 'typescript-declaration-files', type: 'related', strength: 0.6 }
    ];

    const skillPath = [
      'typescript-fundamentals',
      'typescript-types-system',
      'typescript-functions-generics',
      'typescript-utility-types',
      'typescript-oop',
      'typescript-async',
      'typescript-declaration-files'
    ];

    return { nodes, edges, skillPath };
  }
  private generateAngularKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    console.log('🔧 Generating Angular knowledge graph with auto-connected nodes');
    const nodes: KnowledgeNode[] = [
      {
        id: 'angular-fundamentals',
        title: '🎯 Angular Fundamentals (High Priority)',
        description: 'Core Angular concepts and architecture',
        category: 'foundation',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 200, y: 100 },
        connections: ['angular-components', 'angular-services'],
        miniTopics: [
          {
            title: 'Angular CLI & Setup',
            description: 'Installing Angular CLI, creating projects, understanding project structure',
            resources: [
              { title: 'Angular CLI', url: 'https://angular.io/cli', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Components & Templates',
            description: 'Creating components, template syntax, data binding',
            resources: [
              { title: 'Components', url: 'https://angular.io/guide/component-overview', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Directives & Pipes',
            description: 'Built-in directives (*ngIf, *ngFor), custom pipes',
            resources: [
              { title: 'Directives', url: 'https://angular.io/guide/built-in-directives', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Modules & Bootstrapping',
            description: 'NgModules, root module, feature modules',
            resources: [
              { title: 'NgModules', url: 'https://angular.io/guide/ngmodules', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Angular Architecture',
            description: 'Understanding component tree, data flow, change detection',
            resources: [
              { title: 'Architecture', url: 'https://angular.io/guide/architecture', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 6
          }
        ],
        projectMilestone: {
          title: 'Angular Task Manager',
          description: 'Build a task management application with CRUD operations',
          difficulty: 'intermediate',
          deliverables: ['Component hierarchy', 'Data binding', 'Directives usage', 'Module organization'],
          estimatedTime: 20
        }
      },
      {
        id: 'angular-components',
        title: '🔥 Interview HOT! Components & Lifecycle',
        description: 'Component communication, lifecycle, and advanced patterns',
        category: 'core',
        difficulty: 'advanced',
        estimatedTime: 20,
        position: { x: 100, y: 250 },
        connections: ['angular-routing', 'angular-forms'],
        miniTopics: [
          {
            title: 'Component Communication',
            description: '@Input, @Output, ViewChild, ContentChild',
            resources: [
              { title: 'Component Interaction', url: 'https://angular.io/guide/component-interaction', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Lifecycle Hooks',
            description: 'ngOnInit, ngOnChanges, ngOnDestroy, etc.',
            resources: [
              { title: 'Lifecycle Hooks', url: 'https://angular.io/guide/lifecycle-hooks', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Content Projection',
            description: '<ng-content> and content projection patterns',
            resources: [
              { title: 'Content Projection', url: 'https://angular.io/guide/content-projection', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Dynamic Components',
            description: 'Creating components dynamically at runtime',
            resources: [
              { title: 'Dynamic Components', url: 'https://angular.io/guide/dynamic-component-loader', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Change Detection Strategy',
            description: 'OnPush vs Default, manual change detection',
            resources: [
              { title: 'Change Detection', url: 'https://angular.io/guide/change-detection', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          }
        ],
        projectMilestone: {
          title: 'Dynamic Dashboard Builder',
          description: 'Create a dashboard where users can dynamically add/remove widgets',
          difficulty: 'advanced',
          deliverables: ['Dynamic component loading', 'Component communication', 'Content projection', 'Change detection optimization'],
          estimatedTime: 25
        }
      },
      {
        id: 'angular-services',
        title: '🔥 Interview HOT! Services, Dependency Injection & RxJS',
        description: 'Services, DI container, and singleton patterns',
        category: 'core',
        difficulty: 'advanced',
        estimatedTime: 18,
        position: { x: 300, y: 250 },
        connections: ['angular-routing', 'angular-http'],
        miniTopics: [
          {
            title: 'Creating Services',
            description: '@Injectable decorator, service patterns',
            resources: [
              { title: 'Dependency Injection', url: 'https://angular.io/guide/dependency-injection', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Dependency Injection',
            description: 'Constructor injection, providers, injection tokens',
            resources: [
              { title: 'DI in Action', url: 'https://angular.io/guide/dependency-injection-in-action', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Service Scopes',
            description: 'Root, module, component-level services',
            resources: [
              { title: 'Hierarchical Injectors', url: 'https://angular.io/guide/hierarchical-dependency-injection', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'RxJS Integration',
            description: 'Using RxJS with Angular services',
            resources: [
              { title: 'RxJS Integration', url: 'https://angular.io/guide/rxjs-integration', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Custom Injection Tokens',
            description: 'Creating and using custom tokens',
            resources: [
              { title: 'Injection Tokens', url: 'https://angular.io/guide/dependency-injection-in-action#injection-tokens', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Angular Service Architecture',
          description: 'Build a comprehensive service layer for a large application',
          difficulty: 'advanced',
          deliverables: ['Service hierarchy', 'Dependency injection', 'RxJS integration', 'Error handling'],
          estimatedTime: 22
        }
      },
      {
        id: 'angular-routing',
        title: '🧭 Routing & Navigation',
        description: 'Client-side routing, guards, and navigation patterns',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 50, y: 400 },
        connections: ['angular-forms', 'angular-state-management'],
        miniTopics: [
          {
            title: 'Router Configuration',
            description: 'Route definitions, router outlets, nested routes',
            resources: [
              { title: 'Router', url: 'https://angular.io/guide/router', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Route Guards',
            description: 'CanActivate, CanDeactivate, Resolve guards',
            resources: [
              { title: 'Route Guards', url: 'https://angular.io/guide/router-tutorial-toh#guards', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Lazy Loading',
            description: 'Lazy loading modules and preloading strategies',
            resources: [
              { title: 'Lazy Loading', url: 'https://angular.io/guide/lazy-loading-ngmodules', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Route Parameters',
            description: 'Path params, query params, route data',
            resources: [
              { title: 'Route Parameters', url: 'https://angular.io/guide/router-tutorial-toh#route-parameters', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Router Events',
            description: 'Navigation events and router state',
            resources: [
              { title: 'Router Events', url: 'https://angular.io/api/router/Router#events', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 1
          }
        ]
      },
      {
        id: 'angular-forms',
        title: '📝 Forms & Validation',
        description: 'Template-driven and reactive forms',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 200, y: 400 },
        connections: ['angular-http', 'angular-testing'],
        miniTopics: [
          {
            title: 'Template-Driven Forms',
            description: 'ngModel, ngForm, validation directives',
            resources: [
              { title: 'Forms', url: 'https://angular.io/guide/forms-overview', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Reactive Forms',
            description: 'FormBuilder, FormGroup, FormControl, validators',
            resources: [
              { title: 'Reactive Forms', url: 'https://angular.io/guide/reactive-forms', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Custom Validators',
            description: 'Creating custom validation logic',
            resources: [
              { title: 'Custom Validators', url: 'https://angular.io/guide/form-validation#custom-validators', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Dynamic Forms',
            description: 'Building forms dynamically at runtime',
            resources: [
              { title: 'Dynamic Forms', url: 'https://angular.io/guide/dynamic-form', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Form State Management',
            description: 'Touched, dirty, valid states',
            resources: [
              { title: 'Form Validation', url: 'https://angular.io/guide/form-validation', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Advanced Form Builder',
          description: 'Create a dynamic form builder with validation and conditional fields',
          difficulty: 'advanced',
          deliverables: ['Reactive forms', 'Custom validators', 'Dynamic form generation', 'Form state management'],
          estimatedTime: 28
        }
      },
      {
        id: 'angular-http',
        title: '🌐 HTTP Client & APIs',
        description: 'HTTP client, interceptors, and API integration',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 350, y: 400 },
        connections: ['angular-testing', 'angular-performance'],
        miniTopics: [
          {
            title: 'HttpClient Module',
            description: 'Making HTTP requests, response types',
            resources: [
              { title: 'HttpClient', url: 'https://angular.io/guide/http', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'HTTP Interceptors',
            description: 'Request/response interceptors for auth, logging',
            resources: [
              { title: 'Interceptors', url: 'https://angular.io/guide/http#intercepting-requests-and-responses', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Error Handling',
            description: 'HTTP error handling and retry logic',
            resources: [
              { title: 'Error Handling', url: 'https://angular.io/guide/http#error-handling', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Progress Events',
            description: 'Upload/download progress tracking',
            resources: [
              { title: 'Progress Events', url: 'https://angular.io/api/common/http/HttpEventType', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 2
          },
          {
            title: 'Testing HTTP Calls',
            description: 'Mocking HTTP requests in tests',
            resources: [
              { title: 'Testing HTTP', url: 'https://angular.io/guide/http#testing-http-requests', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 2
          }
        ]
      },
      {
        id: 'angular-testing',
        title: '🧪 Testing & Quality Assurance',
        description: 'Unit testing, integration testing, and testing best practices',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 150, y: 550 },
        connections: ['angular-performance'],
        miniTopics: [
          {
            title: 'Jasmine & Karma',
            description: 'Testing framework setup and basic syntax',
            resources: [
              { title: 'Testing', url: 'https://angular.io/guide/testing', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Component Testing',
            description: 'Testing components, templates, and interactions',
            resources: [
              { title: 'Component Testing', url: 'https://angular.io/guide/testing-components-basics', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Service Testing',
            description: 'Testing services and dependency injection',
            resources: [
              { title: 'Service Testing', url: 'https://angular.io/guide/testing-services', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'E2E Testing',
            description: 'End-to-end testing with Protractor/Cypress',
            resources: [
              { title: 'E2E Testing', url: 'https://angular.io/guide/testing-components-scenarios', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Test Coverage',
            description: 'Code coverage reporting and analysis',
            resources: [
              { title: 'Code Coverage', url: 'https://angular.io/guide/testing-code-coverage', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 2
          }
        ]
      },
      {
        id: 'angular-state-management',
        title: '🔥 Interview HOT! State Management & RxJS',
        description: 'Advanced state management patterns with RxJS and NgRx',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 25,
        position: { x: 400, y: 300 },
        connections: ['angular-performance'],
        miniTopics: [
          {
            title: 'RxJS Operators',
            description: 'map, filter, switchMap, combineLatest, etc.',
            resources: [
              { title: 'RxJS Operators', url: 'https://rxjs.dev/guide/operators', type: 'documentation', platform: 'RxJS', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Subject & BehaviorSubject',
            description: 'Managing state with RxJS subjects',
            resources: [
              { title: 'RxJS Subjects', url: 'https://rxjs.dev/guide/subject', type: 'documentation', platform: 'RxJS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'NgRx Store',
            description: 'Redux pattern implementation for Angular',
            resources: [
              { title: 'NgRx Store', url: 'https://ngrx.io/guide/store', type: 'documentation', platform: 'NgRx', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Effects & Side Effects',
            description: 'Handling async operations with NgRx Effects',
            resources: [
              { title: 'NgRx Effects', url: 'https://ngrx.io/guide/effects', type: 'documentation', platform: 'NgRx', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'State Architecture',
            description: 'Designing scalable state management architecture',
            resources: [
              { title: 'State Management Patterns', url: 'https://blog.angular.io/managing-state-in-angular-applications-22b75ef5625f', type: 'article', platform: 'Angular Blog', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Enterprise State Management',
          description: 'Build a complex application with NgRx state management',
          difficulty: 'advanced',
          deliverables: ['NgRx store setup', 'Actions and reducers', 'Effects for async operations', 'State selectors'],
          estimatedTime: 30
        }
      },
      {
        id: 'angular-performance',
        title: '⚡ Performance & Optimization',
        description: 'Performance optimization techniques and best practices',
        category: 'specialization',
        difficulty: 'advanced',
        estimatedTime: 15,
        position: { x: 250, y: 550 },
        connections: [],
        miniTopics: [
          {
            title: 'Change Detection Optimization',
            description: 'OnPush strategy, manual change detection',
            resources: [
              { title: 'Change Detection', url: 'https://angular.io/guide/change-detection', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Lazy Loading & Code Splitting',
            description: 'Reducing bundle size and improving load times',
            resources: [
              { title: 'Lazy Loading', url: 'https://angular.io/guide/lazy-loading-ngmodules', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Bundle Analysis',
            description: 'Analyzing and optimizing bundle size',
            resources: [
              { title: 'Bundle Budgets', url: 'https://angular.io/guide/build#configuring-size-budgets', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Memory Leaks Prevention',
            description: 'Avoiding common memory leak patterns',
            resources: [
              { title: 'Performance', url: 'https://angular.io/guide/performance', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Ahead-of-Time Compilation',
            description: 'AOT compilation benefits and usage',
            resources: [
              { title: 'AOT', url: 'https://angular.io/guide/aot-compiler', type: 'documentation', platform: 'Angular', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'High-Performance Angular App',
          description: 'Optimize a large Angular application for performance',
          difficulty: 'advanced',
          deliverables: ['Bundle analysis', 'Lazy loading implementation', 'Change detection optimization', 'Performance monitoring'],
          estimatedTime: 30
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'angular-components', to: 'angular-forms', type: 'related', strength: 0.8 },
      { from: 'angular-routing', to: 'angular-state-management', type: 'related', strength: 0.6 },
      { from: 'angular-forms', to: 'angular-testing', type: 'related', strength: 0.7 },
      { from: 'angular-http', to: 'angular-performance', type: 'related', strength: 0.6 }
    ];

    const skillPath = [
      'angular-fundamentals',
      'angular-components',
      'angular-services',
      'angular-routing',
      'angular-forms',
      'angular-http',
      'angular-testing',
      'angular-performance'
    ];

    return { nodes, edges, skillPath };
  }

  private generateTestingKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'testing-basics',
        title: 'Testing Fundamentals',
        description: 'Understanding different types of software testing',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 10,
        position: { x: 200, y: 100 },
        connections: ['unit-testing', 'integration-testing'],
        miniTopics: [
          {
            title: 'Why Testing Matters',
            description: 'Benefits and importance of testing',
            resources: [
              { title: 'Testing Overview', url: 'https://martinfowler.com/bliki/TestPyramid.html', type: 'documentation', platform: 'Martin Fowler', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Testing Pyramid',
            description: 'Unit, integration, and end-to-end testing',
            resources: [
              { title: 'Testing Pyramid', url: 'https://martinfowler.com/articles/practical-test-pyramid.html', type: 'documentation', platform: 'Martin Fowler', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'TDD vs BDD',
            description: 'Test-driven development and behavior-driven development',
            resources: [
              { title: 'TDD vs BDD', url: 'https://www.agilealliance.org/glossary/tdd/', type: 'documentation', platform: 'Agile Alliance', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'unit-testing',
        title: 'Unit Testing with Jest',
        description: 'Writing and running unit tests with Jest',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 100, y: 250 },
        connections: ['testing-react'],
        miniTopics: [
          {
            title: 'Jest Setup',
            description: 'Installing and configuring Jest',
            resources: [
              { title: 'Jest Getting Started', url: 'https://jestjs.io/docs/getting-started', type: 'documentation', platform: 'Jest', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Writing Tests',
            description: 'describe, it, expect, matchers',
            resources: [
              { title: 'Jest API', url: 'https://jestjs.io/docs/api', type: 'documentation', platform: 'Jest', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Mocking',
            description: 'Mocking functions, modules, and API calls',
            resources: [
              { title: 'Jest Mocking', url: 'https://jestjs.io/docs/mock-functions', type: 'documentation', platform: 'Jest', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Test Coverage',
            description: 'Measuring and improving test coverage',
            resources: [
              { title: 'Jest Coverage', url: 'https://jestjs.io/docs/configuration#collectcoverage-boolean', type: 'documentation', platform: 'Jest', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Tested Utility Functions',
          description: 'Create a utility library with comprehensive unit tests',
          difficulty: 'intermediate',
          deliverables: ['Unit tests for all functions', 'Mock implementations', 'Test coverage >80%', 'CI/CD integration'],
          estimatedTime: 12
        }
      },
      {
        id: 'integration-testing',
        title: 'Integration Testing',
        description: 'Testing component interactions and API endpoints',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 12,
        position: { x: 300, y: 250 },
        connections: ['e2e-testing'],
        miniTopics: [
          {
            title: 'Integration Test Setup',
            description: 'Setting up integration tests for applications',
            resources: [
              { title: 'Integration Testing Guide', url: 'https://martinfowler.com/bliki/IntegrationTest.html', type: 'documentation', platform: 'Martin Fowler', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'API Testing',
            description: 'Testing REST API endpoints',
            resources: [
              { title: 'API Testing with Jest', url: 'https://jestjs.io/docs/asynchronous', type: 'documentation', platform: 'Jest', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Database Testing',
            description: 'Testing database operations and queries',
            resources: [
              { title: 'Database Testing', url: 'https://martinfowler.com/bliki/IntegrationTest.html', type: 'documentation', platform: 'Martin Fowler', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'testing-basics', to: 'unit-testing', type: 'related', strength: 0.9 },
      { from: 'unit-testing', to: 'integration-testing', type: 'related', strength: 0.8 },
      { from: 'integration-testing', to: 'testing-react', type: 'related', strength: 0.7 },
      { from: 'testing-react', to: 'e2e-testing', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['testing-basics', 'unit-testing', 'integration-testing', 'testing-react', 'e2e-testing'];

    return { nodes, edges, skillPath };
  }
  private generateMobileKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'mobile-basics',
        title: 'Mobile Development Fundamentals',
        description: 'Understanding mobile app development concepts',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 200, y: 100 },
        connections: ['react-native-basics', 'mobile-ui'],
        miniTopics: [
          {
            title: 'Mobile Platforms',
            description: 'iOS vs Android vs Cross-platform development',
            resources: [
              { title: 'Mobile Development Overview', url: 'https://developer.android.com/guide', type: 'documentation', platform: 'Android', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Mobile UI/UX Principles',
            description: 'Design principles for mobile interfaces',
            resources: [
              { title: 'Material Design', url: 'https://material.io/design', type: 'documentation', platform: 'Google', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Mobile Development Tools',
            description: 'IDEs, emulators, and development environments',
            resources: [
              { title: 'React Native Setup', url: 'https://reactnative.dev/docs/environment-setup', type: 'tutorial', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'react-native-basics',
        title: 'React Native Fundamentals',
        description: 'Building mobile apps with React Native',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 100, y: 250 },
        connections: ['react-native-navigation', 'react-native-api'],
        miniTopics: [
          {
            title: 'React Native Setup',
            description: 'Installing Expo CLI and creating first app',
            resources: [
              { title: 'Expo Getting Started', url: 'https://docs.expo.dev/get-started/installation/', type: 'tutorial', platform: 'Expo', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Core Components',
            description: 'View, Text, Image, ScrollView, FlatList',
            resources: [
              { title: 'React Native Components', url: 'https://reactnative.dev/docs/components-and-apis', type: 'documentation', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Styling in React Native',
            description: 'StyleSheet, Flexbox, responsive design',
            resources: [
              { title: 'React Native Styling', url: 'https://reactnative.dev/docs/style', type: 'documentation', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'State Management',
            description: 'useState, useEffect, Context API in React Native',
            resources: [
              { title: 'React Native State', url: 'https://reactnative.dev/docs/state', type: 'documentation', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'React Native Todo App',
          description: 'Build a mobile todo application with add, edit, delete, and local storage functionality',
          difficulty: 'intermediate',
          deliverables: ['Cross-platform UI', 'Local data persistence', 'Navigation between screens', 'Platform-specific features'],
          estimatedTime: 18
        }
      },
      {
        id: 'mobile-ui',
        title: 'Mobile UI Components',
        description: 'Building polished mobile user interfaces',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 300, y: 250 },
        connections: ['react-native-navigation'],
        miniTopics: [
          {
            title: 'Touchable Components',
            description: 'TouchableOpacity, TouchableHighlight, Pressable',
            resources: [
              { title: 'React Native Touchable', url: 'https://reactnative.dev/docs/touchableopacity', type: 'documentation', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Form Inputs',
            description: 'TextInput, Picker, Switch, Slider components',
            resources: [
              { title: 'React Native Inputs', url: 'https://reactnative.dev/docs/textinput', type: 'documentation', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Lists and Grids',
            description: 'FlatList, SectionList, and performance optimization',
            resources: [
              { title: 'React Native Lists', url: 'https://reactnative.dev/docs/flatlist', type: 'documentation', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Animations',
            description: 'Animated API and LayoutAnimation',
            resources: [
              { title: 'React Native Animation', url: 'https://reactnative.dev/docs/animated', type: 'documentation', platform: 'React Native', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'mobile-ui', to: 'react-native-navigation', type: 'related', strength: 0.7 }
    ];

    const skillPath = ['mobile-basics', 'react-native-basics', 'mobile-ui'];

    return { nodes, edges, skillPath };
  }
  private generateDevOpsKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'devops-basics',
        title: 'DevOps Fundamentals',
        description: 'Understanding DevOps culture and practices',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 10,
        position: { x: 200, y: 100 },
        connections: ['ci-cd-basics', 'infrastructure-as-code'],
        miniTopics: [
          {
            title: 'What is DevOps?',
            description: 'DevOps culture, principles, and benefits',
            resources: [
              { title: 'DevOps Guide', url: 'https://aws.amazon.com/devops/what-is-devops/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'CI/CD Concepts',
            description: 'Continuous Integration and Continuous Deployment',
            resources: [
              { title: 'CI/CD Explained', url: 'https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment', type: 'documentation', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Version Control in DevOps',
            description: 'Git workflows and branching strategies',
            resources: [
              { title: 'Git Flow', url: 'https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow', type: 'tutorial', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'ci-cd-basics',
        title: 'CI/CD Pipelines',
        description: 'Building automated deployment pipelines',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 100, y: 250 },
        connections: ['monitoring-logging'],
        miniTopics: [
          {
            title: 'GitHub Actions',
            description: 'Creating CI/CD workflows with GitHub Actions',
            resources: [
              { title: 'GitHub Actions Guide', url: 'https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions', type: 'tutorial', platform: 'GitHub', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Testing in CI',
            description: 'Running automated tests in CI pipelines',
            resources: [
              { title: 'CI Testing Strategies', url: 'https://martinfowler.com/articles/continuousIntegration.html', type: 'documentation', platform: 'Martin Fowler', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Deployment Strategies',
            description: 'Blue-green, canary, and rolling deployments',
            resources: [
              { title: 'Deployment Strategies', url: 'https://martinfowler.com/bliki/BlueGreenDeployment.html', type: 'documentation', platform: 'Martin Fowler', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Environment Management',
            description: 'Development, staging, and production environments',
            resources: [
              { title: 'Environment Strategy', url: 'https://martinfowler.com/articles/branching.html', type: 'documentation', platform: 'Martin Fowler', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'CI/CD Pipeline Setup',
          description: 'Set up a complete CI/CD pipeline for a web application with automated testing and deployment',
          difficulty: 'intermediate',
          deliverables: ['GitHub Actions workflow', 'Automated testing', 'Docker containerization', 'Deployment to staging/production'],
          estimatedTime: 20
        }
      },
      {
        id: 'infrastructure-as-code',
        title: 'Infrastructure as Code',
        description: 'Managing infrastructure with code',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 300, y: 250 },
        connections: ['container-orchestration'],
        miniTopics: [
          {
            title: 'Terraform Basics',
            description: 'Infrastructure provisioning with Terraform',
            resources: [
              { title: 'Terraform Getting Started', url: 'https://developer.hashicorp.com/terraform/tutorials/aws-get-started', type: 'tutorial', platform: 'Terraform', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'CloudFormation',
            description: 'AWS infrastructure as code',
            resources: [
              { title: 'CloudFormation Guide', url: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/Userguide/aws-resource-ref.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Configuration Management',
            description: 'Ansible and Puppet for server configuration',
            resources: [
              { title: 'Ansible Getting Started', url: 'https://docs.ansible.com/ansible/latest/getting_started/index.html', type: 'tutorial', platform: 'Ansible', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'devops-basics', to: 'ci-cd-basics', type: 'related', strength: 0.9 },
      { from: 'ci-cd-basics', to: 'infrastructure-as-code', type: 'related', strength: 0.8 },
      { from: 'infrastructure-as-code', to: 'container-orchestration', type: 'related', strength: 0.7 },
      { from: 'container-orchestration', to: 'monitoring-logging', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['devops-basics', 'ci-cd-basics', 'infrastructure-as-code', 'container-orchestration', 'monitoring-logging'];

    return { nodes, edges, skillPath };
  }

  private generateCybersecurityKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'cyber-basics',
        title: 'Cybersecurity Fundamentals',
        description: 'Core concepts of information security',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: ['web-security', 'network-security'],
        miniTopics: [
          {
            title: 'CIA Triad',
            description: 'Confidentiality, Integrity, Availability',
            resources: [
              { title: 'CIA Triad', url: 'https://www.csoonline.com/article/567965/the-cia-triad-confidentiality-integrity-and-availability.html', type: 'documentation', platform: 'CSO Online', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Common Threats',
            description: 'Malware, phishing, social engineering',
            resources: [
              { title: 'Cyber Threats', url: 'https://www.cisa.gov/topics/cyber-threats-and-advisories', type: 'documentation', platform: 'CISA', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Security Principles',
            description: 'Defense in depth, least privilege, fail-safe defaults',
            resources: [
              { title: 'Security Principles', url: 'https://owasp.org/www-project-top-ten/', type: 'documentation', platform: 'OWASP', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Risk Management',
            description: 'Identifying and mitigating security risks',
            resources: [
              { title: 'Risk Management', url: 'https://www.nist.gov/cyberframework/risk-management-framework', type: 'documentation', platform: 'NIST', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'web-security',
        title: 'Web Application Security',
        description: 'Securing web applications and APIs',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 100, y: 250 },
        connections: ['authentication-security'],
        miniTopics: [
          {
            title: 'OWASP Top 10',
            description: 'Most critical web application security risks',
            resources: [
              { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', type: 'documentation', platform: 'OWASP', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'XSS Prevention',
            description: 'Cross-site scripting attacks and defenses',
            resources: [
              { title: 'XSS Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', type: 'documentation', platform: 'OWASP', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'SQL Injection',
            description: 'Preventing SQL injection attacks',
            resources: [
              { title: 'SQL Injection Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html', type: 'documentation', platform: 'OWASP', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'CSRF Protection',
            description: 'Cross-site request forgery prevention',
            resources: [
              { title: 'CSRF Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Origin_Resource_Sharing_Cheat_Sheet.html', type: 'documentation', platform: 'OWASP', isFree: true }
            ],
            estimatedTime: 4
          }
        ],
        projectMilestone: {
          title: 'Secure Web Application',
          description: 'Build a web application implementing OWASP security best practices',
          difficulty: 'intermediate',
          deliverables: ['Input validation & sanitization', 'Authentication & authorization', 'HTTPS configuration', 'Security headers'],
          estimatedTime: 20
        }
      },
      {
        id: 'network-security',
        title: 'Network Security',
        description: 'Securing network infrastructure and communications',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 300, y: 250 },
        connections: ['encryption-crypto'],
        miniTopics: [
          {
            title: 'Firewalls & IDS',
            description: 'Network firewalls and intrusion detection systems',
            resources: [
              { title: 'Network Security Basics', url: 'https://www.cisco.com/c/en/us/products/security/firewalls/what-is-a-firewall.html', type: 'documentation', platform: 'Cisco', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'VPN & Secure Tunneling',
            description: 'Virtual private networks and secure connections',
            resources: [
              { title: 'VPN Security', url: 'https://www.nist.gov/itl/applied-cybersecurity/nice/resources/virtual-private-networks-vpn', type: 'documentation', platform: 'NIST', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Secure Protocols',
            description: 'HTTPS, SSH, TLS, and secure communication',
            resources: [
              { title: 'Transport Layer Security', url: 'https://www.cloudflare.com/learning/ssl/transport-layer-security-tls/', type: 'documentation', platform: 'Cloudflare', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Network Segmentation',
            description: 'Isolating network segments for security',
            resources: [
              { title: 'Network Segmentation', url: 'https://www.csoonline.com/article/3333458/what-is-network-segmentation.html', type: 'documentation', platform: 'CSO Online', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'cyber-basics', to: 'web-security', type: 'related', strength: 0.9 },
      { from: 'web-security', to: 'network-security', type: 'related', strength: 0.8 },
      { from: 'network-security', to: 'authentication-security', type: 'related', strength: 0.7 },
      { from: 'authentication-security', to: 'encryption-crypto', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['cyber-basics', 'web-security', 'network-security', 'authentication-security', 'encryption-crypto'];

    return { nodes, edges, skillPath };
  }

  private generateLinuxKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'linux-basics',
        title: 'Linux Fundamentals',
        description: 'Core Linux concepts and command line operations',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 20,
        position: { x: 200, y: 100 },
        connections: ['linux-file-system', 'linux-processes'],
        miniTopics: [
          {
            title: 'Basic Commands',
            description: 'ls, cd, pwd, mkdir, rm, cp, mv',
            resources: [
              { title: 'Linux Command Line Basics', url: 'https://ubuntu.com/desktop/tutorial/command-line-for-beginners', type: 'tutorial', platform: 'Ubuntu', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'File Permissions',
            description: 'chmod, chown, file permissions system',
            resources: [
              { title: 'Linux File Permissions', url: 'https://www.linux.com/training-tutorials/understanding-linux-file-permissions/', type: 'tutorial', platform: 'Linux.com', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Text Processing',
            description: 'grep, sed, awk, pipes and redirection',
            resources: [
              { title: 'Text Processing Commands', url: 'https://www.gnu.org/software/gawk/manual/gawk.html', type: 'documentation', platform: 'GNU', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Package Management',
            description: 'apt, yum, pacman package managers',
            resources: [
              { title: 'Package Management', url: 'https://wiki.archlinux.org/title/Pacman', type: 'documentation', platform: 'Arch Linux', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Linux System Administration Basics',
          description: 'Set up a Linux environment and perform basic system administration tasks',
          difficulty: 'beginner',
          deliverables: ['User management', 'File system navigation', 'Package installation', 'Basic scripting'],
          estimatedTime: 15
        }
      },
      {
        id: 'linux-file-system',
        title: 'Linux File System',
        description: 'Understanding the Linux file system hierarchy',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 10,
        position: { x: 100, y: 250 },
        connections: ['linux-scripting'],
        miniTopics: [
          {
            title: 'File System Hierarchy',
            description: '/, /home, /var, /etc, /usr directory structure',
            resources: [
              { title: 'Linux File System', url: 'https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html', type: 'documentation', platform: 'Linux Foundation', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Mounting File Systems',
            description: 'mount, umount, fstab configuration',
            resources: [
              { title: 'Mounting File Systems', url: 'https://wiki.archlinux.org/title/File_systems', type: 'documentation', platform: 'Arch Linux', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Disk Management',
            description: 'df, du, fdisk disk utilities',
            resources: [
              { title: 'Disk Management', url: 'https://www.tecmint.com/linux-disk-management/', type: 'tutorial', platform: 'TecMint', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'linux-scripting',
        title: 'Bash Scripting',
        description: 'Writing shell scripts for automation',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 300, y: 250 },
        connections: [],
        miniTopics: [
          {
            title: 'Script Basics',
            description: 'Shebang, variables, conditionals, loops',
            resources: [
              { title: 'Bash Scripting Tutorial', url: 'https://linuxconfig.org/bash-scripting-tutorial-for-beginners', type: 'tutorial', platform: 'LinuxConfig', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Functions & Error Handling',
            description: 'Function definitions, exit codes, traps',
            resources: [
              { title: 'Advanced Bash Scripting', url: 'https://tldp.org/LDP/abs/html/', type: 'documentation', platform: 'TLDP', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Cron Jobs & Automation',
            description: 'Scheduled tasks and system automation',
            resources: [
              { title: 'Cron Jobs', url: 'https://wiki.archlinux.org/title/Cron', type: 'documentation', platform: 'Arch Linux', isFree: true }
            ],
            estimatedTime: 7
          }
        ],
        projectMilestone: {
          title: 'System Automation Scripts',
          description: 'Create bash scripts for system monitoring, backup, and maintenance tasks',
          difficulty: 'intermediate',
          deliverables: ['Backup script', 'System monitoring', 'Log rotation', 'Automated deployment'],
          estimatedTime: 25
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'linux-basics', to: 'linux-file-system', type: 'related', strength: 0.9 },
      { from: 'linux-file-system', to: 'linux-processes', type: 'related', strength: 0.8 },
      { from: 'linux-processes', to: 'linux-scripting', type: 'related', strength: 0.7 }
    ];

    const skillPath = ['linux-basics', 'linux-file-system', 'linux-processes', 'linux-scripting'];

    return { nodes, edges, skillPath };
  }
  private generateAgileKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'agile-basics',
        title: 'Agile Fundamentals',
        description: 'Understanding Agile principles and methodologies',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: ['scrum-framework', 'kanban-method'],
        miniTopics: [
          {
            title: 'Agile Manifesto',
            description: 'The four values and twelve principles of Agile',
            resources: [
              { title: 'Agile Manifesto', url: 'https://agilemanifesto.org/', type: 'documentation', platform: 'Agile Manifesto', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Waterfall vs Agile',
            description: 'Traditional vs iterative development approaches',
            resources: [
              { title: 'Agile vs Waterfall', url: 'https://www.atlassian.com/agile/agile-vs-waterfall', type: 'documentation', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Agile Mindset',
            description: 'Cultural aspects and team collaboration',
            resources: [
              { title: 'Agile Mindset', url: 'https://www.agilealliance.org/agile101/agile-glossary/agile-mindset/', type: 'documentation', platform: 'Agile Alliance', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'User Stories',
            description: 'Writing effective user stories and acceptance criteria',
            resources: [
              { title: 'User Stories', url: 'https://www.atlassian.com/agile/project-management/user-stories', type: 'tutorial', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'scrum-framework',
        title: 'Scrum Framework',
        description: 'Complete Scrum methodology and ceremonies',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 100, y: 250 },
        connections: ['scrum-master'],
        miniTopics: [
          {
            title: 'Scrum Roles',
            description: 'Product Owner, Scrum Master, Development Team',
            resources: [
              { title: 'Scrum Guide', url: 'https://scrumguides.org/scrum-guide.html', type: 'documentation', platform: 'Scrum.org', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Scrum Events',
            description: 'Sprint Planning, Daily Scrum, Sprint Review, Retrospective',
            resources: [
              { title: 'Scrum Events', url: 'https://scrumguides.org/scrum-guide.html#events', type: 'documentation', platform: 'Scrum.org', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Scrum Artifacts',
            description: 'Product Backlog, Sprint Backlog, Increment',
            resources: [
              { title: 'Scrum Artifacts', url: 'https://scrumguides.org/scrum-guide.html#artifacts', type: 'documentation', platform: 'Scrum.org', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Sprint Planning',
            description: 'Planning sprints and estimating work',
            resources: [
              { title: 'Sprint Planning', url: 'https://www.atlassian.com/agile/scrum/sprint-planning', type: 'tutorial', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Sprint Simulation',
          description: 'Run a complete sprint cycle with planning, execution, review, and retrospective',
          difficulty: 'intermediate',
          deliverables: ['Sprint backlog creation', 'Daily standups', 'Sprint review presentation', 'Retrospective report'],
          estimatedTime: 20
        }
      },
      {
        id: 'kanban-method',
        title: 'Kanban Method',
        description: 'Visual workflow management and continuous delivery',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 300, y: 250 },
        connections: [],
        miniTopics: [
          {
            title: 'Kanban Principles',
            description: 'Visualize work, limit WIP, manage flow, continuous improvement',
            resources: [
              { title: 'Kanban Guide', url: 'https://kanban.university/kanban-guide/', type: 'tutorial', platform: 'Kanban University', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Work in Progress Limits',
            description: 'Setting and managing WIP limits effectively',
            resources: [
              { title: 'WIP Limits', url: 'https://www.atlassian.com/agile/kanban/wip-limits', type: 'tutorial', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Lead Time vs Cycle Time',
            description: 'Measuring and improving delivery performance',
            resources: [
              { title: 'Lead vs Cycle Time', url: 'https://www.atlassian.com/agile/project-management/metrics', type: 'documentation', platform: 'Atlassian', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Cumulative Flow Diagrams',
            description: 'Visualizing workflow and identifying bottlenecks',
            resources: [
              { title: 'CFD Guide', url: 'https://kanbanize.com/kanban-resources/getting-started/cumulative-flow-diagram', type: 'tutorial', platform: 'Kanbanize', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'agile-basics', to: 'scrum-framework', type: 'related', strength: 0.9 },
      { from: 'agile-basics', to: 'kanban-method', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['agile-basics', 'scrum-framework', 'kanban-method'];

    return { nodes, edges, skillPath };
  }

  private generateAlgorithmKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'algorithm-basics',
        title: 'Algorithm Fundamentals',
        description: 'Core algorithmic concepts and problem-solving approaches',
        category: 'foundation',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 200, y: 100 },
        connections: ['data-structures', 'sorting-algorithms'],
        miniTopics: [
          {
            title: 'Algorithm Analysis',
            description: 'Time complexity (Big O), space complexity',
            resources: [
              { title: 'Big O Notation', url: 'https://www.bigocheatsheet.com/', type: 'documentation', platform: 'Big O Cheat Sheet', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Problem Solving Approaches',
            description: 'Divide and conquer, greedy algorithms, dynamic programming',
            resources: [
              { title: 'Algorithm Paradigms', url: 'https://www.geeksforgeeks.org/fundamentals-of-algorithms/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Recursion',
            description: 'Understanding and implementing recursive solutions',
            resources: [
              { title: 'Recursion Tutorial', url: 'https://www.geeksforgeeks.org/recursion/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Algorithm Design',
            description: 'Steps for designing efficient algorithms',
            resources: [
              { title: 'Algorithm Design Techniques', url: 'https://www.geeksforgeeks.org/design-and-analysis-of-algorithms/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Algorithm Implementation',
          description: 'Implement and analyze common algorithms from scratch',
          difficulty: 'intermediate',
          deliverables: ['Binary search implementation', 'Sorting algorithms', 'Complexity analysis', 'Performance comparison'],
          estimatedTime: 20
        }
      },
      {
        id: 'data-structures',
        title: 'Data Structures',
        description: 'Essential data structures for efficient programming',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 30,
        position: { x: 100, y: 250 },
        connections: ['graph-algorithms'],
        miniTopics: [
          {
            title: 'Arrays & Linked Lists',
            description: 'Dynamic arrays, singly/doubly linked lists',
            resources: [
              { title: 'Data Structures', url: 'https://www.geeksforgeeks.org/data-structures/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Stacks & Queues',
            description: 'LIFO, FIFO data structures and their applications',
            resources: [
              { title: 'Stacks and Queues', url: 'https://www.geeksforgeeks.org/stack-data-structure/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Trees & Binary Search Trees',
            description: 'Tree traversals, BST operations, balancing',
            resources: [
              { title: 'Binary Search Trees', url: 'https://www.geeksforgeeks.org/binary-search-tree-data-structure/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Hash Tables',
            description: 'Hash functions, collision resolution, applications',
            resources: [
              { title: 'Hashing', url: 'https://www.geeksforgeeks.org/hashing-data-structure/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Heaps & Priority Queues',
            description: 'Binary heaps, heap operations, applications',
            resources: [
              { title: 'Heap Data Structure', url: 'https://www.geeksforgeeks.org/heap-data-structure/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 2
          }
        ]
      },
      {
        id: 'sorting-algorithms',
        title: 'Sorting Algorithms',
        description: 'Comparison and non-comparison based sorting techniques',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 300, y: 250 },
        connections: ['search-algorithms'],
        miniTopics: [
          {
            title: 'Basic Sorting',
            description: 'Bubble sort, insertion sort, selection sort',
            resources: [
              { title: 'Sorting Algorithms', url: 'https://www.geeksforgeeks.org/sorting-algorithms/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Efficient Sorting',
            description: 'Merge sort, quick sort, heap sort',
            resources: [
              { title: 'Advanced Sorting', url: 'https://www.geeksforgeeks.org/merge-sort/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Non-Comparison Sorting',
            description: 'Counting sort, radix sort, bucket sort',
            resources: [
              { title: 'Non-Comparison Sorts', url: 'https://www.geeksforgeeks.org/counting-sort/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Stability & In-Place Sorting',
            description: 'Sorting algorithm properties and trade-offs',
            resources: [
              { title: 'Sorting Properties', url: 'https://www.geeksforgeeks.org/stability-in-sorting-algorithms/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Sorting Algorithm Visualizer',
          description: 'Create a visual representation of different sorting algorithms with performance comparison',
          difficulty: 'advanced',
          deliverables: ['Multiple sorting implementations', 'Visualization component', 'Performance metrics', 'Interactive controls'],
          estimatedTime: 30
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'algorithm-basics', to: 'data-structures', type: 'related', strength: 0.9 },
      { from: 'data-structures', to: 'sorting-algorithms', type: 'related', strength: 0.8 },
      { from: 'sorting-algorithms', to: 'search-algorithms', type: 'related', strength: 0.7 },
      { from: 'search-algorithms', to: 'graph-algorithms', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['algorithm-basics', 'data-structures', 'sorting-algorithms', 'search-algorithms', 'graph-algorithms'];

    return { nodes, edges, skillPath };
  }
  private generateMicroservicesKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'ms-fundamentals',
        title: 'Microservices Fundamentals',
        description: 'Architecture, service boundaries, monolith vs microservices',
        category: 'foundation',
        difficulty: 'intermediate',
        estimatedTime: 10,
        connections: ['ms-api-design', 'ms-comm', 'ms-auth'],
        miniTopics: [
          { title: 'Microservice vs Monolith', description: 'Pros, cons, trade-offs', estimatedTime: 3, resources: [{title: 'Microservices Guide', url: 'https://microservices.io/', type: 'documentation', platform: 'Microservices.io', isFree: true}] }
        ],
        position: { x: 200, y: 100 },
      },
      {
        id: 'ms-api-design',
        title: '🔥 Interview HOT! API Design (REST/gRPC)',
        description: 'REST, gRPC, OpenAPI, error handling, API gateway',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 10,
        connections: ['ms-comm'],
        miniTopics: [
          { title: 'API Gateway', description: 'Centralizing APIs', estimatedTime: 2, resources: [{title: 'API Gateway', url: 'https://microservices.io/patterns/apigateway.html', type: 'documentation', platform: 'Microservices.io', isFree: true}] }
        ],
        position: { x: 400, y: 100 },
      },
      {
        id: 'ms-comm',
        title: '🔥 Interview HOT! Communication & Messaging',
        description: 'Sync, async messaging, message brokers, TTL, retries',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 7,
        connections: ['ms-auth', 'ms-adv'],
        miniTopics: [
          { title: 'Queues', description: 'RabbitMQ, Kafka, SQS', estimatedTime: 3, resources: [{title:'RabbitMQ Docs',url:'https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html',type:'tutorial',platform:'RabbitMQ',isFree:true}] }
        ],
        position: { x: 600, y: 100 },
      },
      {
        id: 'ms-auth',
        title: '🔥 Interview HOT! Auth/Security',
        description: 'JWT, OAuth2, API keys, service-to-service auth',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 7,
        connections: ['ms-adv'],
        miniTopics: [
          { title: 'JWT', description: 'Token-based auth', estimatedTime: 2, resources: [{title:'JWT Intro', url:'https://jwt.io/introduction',type:'documentation',platform:'JWT.io',isFree:true}] }
        ],
        position: { x: 800, y: 100 },
      },
      {
        id: 'ms-adv',
        title: 'Advanced: Resilience, Tracing, Deploy',
        description: 'Circuit breaker, distributed tracing, deploy & monitoring',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 10,
        connections: ['ms-project'],
        miniTopics: [
          { title: 'Tracing', description: 'Jaeger, Zipkin for distributed tracing.', estimatedTime: 3, resources: [{title:'Jaeger Docs',url:'https://www.jaegertracing.io/docs/1.41/',type:'documentation',platform:'Jaeger',isFree:true}] }
        ],
        position: { x: 1000, y: 100 },
      },
      {
        id: 'ms-project',
        title: 'Deploy a Microservices Project',
        description: 'End-to-end project: build, secure, communicate, and deploy simple microservices',
        category: 'project',
        difficulty: 'intermediate',
        estimatedTime: 20,
        connections: [],
        miniTopics: [],
        position: { x: 1200, y: 100 },
      },
    ];
    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'ms-fundamentals', to: 'ms-api-design', type: 'related', strength: 0.9 },
      { from: 'ms-api-design', to: 'ms-comm', type: 'related', strength: 0.8 },
      { from: 'ms-comm', to: 'ms-auth', type: 'related', strength: 0.7 },
      { from: 'ms-auth', to: 'ms-adv', type: 'related', strength: 0.8 },
      { from: 'ms-adv', to: 'ms-project', type: 'related', strength: 0.9 }
    ];
    const skillPath = ['ms-fundamentals', 'ms-api-design', 'ms-comm', 'ms-auth', 'ms-adv', 'ms-project'];
    return { nodes, edges, skillPath };
  }

  private generateEnhancedGenericKnowledgeGraph(targetSkill: string, currentSkills: Set<string>): KnowledgeGraphData {
    // Enhanced generic graph with curated resources for unknown skills
    const skill = targetSkill.toLowerCase();

    // Try to categorize the skill and provide relevant resources
    let category = 'foundation';
    let difficulty = 'intermediate' as const;
    let curatedResources: any[] = [];

    // Categorize based on keywords
    if (skill.includes('design') || skill.includes('ui') || skill.includes('ux')) {
      category = 'core';
      curatedResources = [
        { title: 'Figma Design Tutorial', url: 'https://www.youtube.com/results?search_query=figma+tutorial', type: 'tutorial', platform: 'YouTube', isFree: true },
        { title: 'UI/UX Design Principles', url: 'https://www.nngroup.com/articles/ten-usability-heuristics/', type: 'documentation', platform: 'NNGroup', isFree: true },
        { title: 'Design Systems', url: 'https://www.designsystems.com/', type: 'documentation', platform: 'Design Systems', isFree: true }
      ];
    } else if (skill.includes('analysis') || skill.includes('analytics') || skill.includes('business')) {
      category = 'advanced';
      curatedResources = [
        { title: 'Business Analysis Fundamentals', url: 'https://www.iiba.org/business-analysis-resources/', type: 'documentation', platform: 'IIBA', isFree: true },
        { title: 'Requirements Gathering', url: 'https://www.agilealliance.org/glossary/requirements/', type: 'documentation', platform: 'Agile Alliance', isFree: true },
        { title: 'Data Analysis Methods', url: 'https://www.coursera.org/specializations/google-data-analytics', type: 'course', platform: 'Coursera', isFree: true }
      ];
    } else if (skill.includes('communication') || skill.includes('presentation') || skill.includes('leadership')) {
      category = 'specialization';
      curatedResources = [
        { title: 'Technical Writing', url: 'https://developers.google.com/tech-writing', type: 'course', platform: 'Google', isFree: true },
        { title: 'Presentation Skills', url: 'https://www.youtube.com/results?search_query=technical+presentation+skills', type: 'tutorial', platform: 'YouTube', isFree: true },
        { title: 'Leadership in Tech', url: 'https://www.atlassian.com/blog/leadership', type: 'article', platform: 'Atlassian', isFree: true }
      ];
    } else {
      // Default technical skill resources
      curatedResources = [
        { title: `${targetSkill} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + ' official documentation')}`, type: 'documentation', platform: 'Google', isFree: true },
        { title: `${targetSkill} Tutorials`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' tutorial for beginners')}`, type: 'tutorial', platform: 'YouTube', isFree: true },
        { title: `${targetSkill} Best Practices`, url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + ' best practices')}`, type: 'documentation', platform: 'Google', isFree: true }
      ];
    }

    const nodes: KnowledgeNode[] = [
      {
        id: `${skill}-introduction`,
        title: `${targetSkill} Introduction`,
        description: `Understanding the fundamentals of ${targetSkill}`,
        category: category as any,
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: [`${skill}-core-concepts`],
        miniTopics: [
          {
            title: `What is ${targetSkill}?`,
            description: `Core concepts and importance of ${targetSkill}`,
            resources: curatedResources.slice(0, 2),
            estimatedTime: 6
          },
          {
            title: `${targetSkill} Basics`,
            description: `Fundamental principles and terminology`,
            resources: curatedResources.slice(1, 3),
            estimatedTime: 9
          }
        ],
        projectMilestone: {
          title: `${targetSkill} Practice Project`,
          description: `Build a simple project to understand ${targetSkill} basics`,
          difficulty: 'beginner',
          deliverables: ['Basic implementation', 'Core concepts application', 'Documentation'],
          estimatedTime: 12
        }
      },
      {
        id: `${skill}-core-concepts`,
        title: `${targetSkill} Core Concepts`,
        description: `Advanced concepts and practical applications`,
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 200, y: 250 },
        connections: [`${skill}-advanced`],
        miniTopics: [
          {
            title: `Advanced ${targetSkill} Features`,
            description: `Exploring advanced capabilities and techniques`,
            resources: [
              { title: `Advanced ${targetSkill}`, url: `https://www.google.com/search?q=${encodeURIComponent('advanced ' + targetSkill)}`, type: 'documentation', platform: 'Google', isFree: true },
              { title: `${targetSkill} Deep Dive`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' advanced tutorial')}`, type: 'tutorial', platform: 'YouTube', isFree: true }
            ],
            estimatedTime: 15
          },
          {
            title: `${targetSkill} Best Practices`,
            description: `Industry standards and recommended approaches`,
            resources: [
              { title: `${targetSkill} Best Practices`, url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + ' best practices guide')}`, type: 'documentation', platform: 'Google', isFree: true },
              { title: `${targetSkill} Case Studies`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' case studies')}`, type: 'tutorial', platform: 'YouTube', isFree: true }
            ],
            estimatedTime: 10
          }
        ],
        projectMilestone: {
          title: `${targetSkill} Intermediate Project`,
          description: `Apply intermediate ${targetSkill} concepts in a practical project`,
          difficulty: 'intermediate',
          deliverables: ['Advanced features implementation', 'Best practices application', 'Performance optimization'],
          estimatedTime: 20
        }
      },
      {
        id: `${skill}-advanced`,
        title: `${targetSkill} Advanced`,
        description: `Expert-level ${targetSkill} concepts and mastery`,
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 35,
        position: { x: 200, y: 400 },
        connections: [],
        miniTopics: [
          {
            title: `${targetSkill} Architecture`,
            description: `System design and architectural patterns`,
            resources: [
              { title: `${targetSkill} Architecture`, url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + ' system architecture')}`, type: 'documentation', platform: 'Google', isFree: true },
              { title: `${targetSkill} Design Patterns`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' design patterns')}`, type: 'tutorial', platform: 'YouTube', isFree: true }
            ],
            estimatedTime: 20
          },
          {
            title: `${targetSkill} Performance & Scaling`,
            description: `Optimization techniques and scalability considerations`,
            resources: [
              { title: `${targetSkill} Performance`, url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + ' performance optimization')}`, type: 'documentation', platform: 'Google', isFree: true },
              { title: `${targetSkill} Scaling`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' scaling techniques')}`, type: 'tutorial', platform: 'YouTube', isFree: true }
            ],
            estimatedTime: 15
          }
        ],
        projectMilestone: {
          title: `${targetSkill} Advanced Project`,
          description: `Build a professional-grade project showcasing expert ${targetSkill} skills`,
          difficulty: 'advanced',
          deliverables: ['Complex architecture', 'Performance optimization', 'Scalability implementation', 'Production-ready code'],
          estimatedTime: 40
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: `${skill}-introduction`, to: `${skill}-core-concepts`, type: 'related', strength: 0.9 },
      { from: `${skill}-core-concepts`, to: `${skill}-advanced`, type: 'related', strength: 0.8 }
    ];

    const skillPath = [`${skill}-introduction`, `${skill}-core-concepts`, `${skill}-advanced`];

    return { nodes, edges, skillPath };
  }
  private generateJavaScriptKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'html-basics',
        title: 'HTML Basics',
        description: 'Core HTML elements and structure',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 8,
        position: { x: 100, y: 100 },
        connections: ['css-basics'],
        miniTopics: [
          {
            title: 'HTML Document Structure',
            description: 'DOCTYPE, html, head, body elements',
            resources: [
              { title: 'MDN HTML Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 2
          },
          {
            title: 'Semantic HTML',
            description: 'header, nav, main, section, article, aside, footer',
            resources: [
              { title: 'HTML Semantic Elements', url: 'https://www.w3schools.com/html/html5_semantic_elements.asp', type: 'tutorial', platform: 'W3Schools', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Forms & Input Elements',
            description: 'input, textarea, select, button elements',
            resources: [
              { title: 'HTML Forms Guide', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'css-basics',
        title: 'CSS Basics',
        description: 'Styling web pages with CSS',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 300, y: 100 },
        connections: ['javascript-basics', 'responsive-design'],
        miniTopics: [
          {
            title: 'CSS Selectors',
            description: 'Element, class, ID selectors',
            resources: [
              { title: 'CSS Selectors', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Selectors', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Box Model',
            description: 'margin, border, padding, content',
            resources: [
              { title: 'CSS Box Model', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Flexbox Layout',
            description: 'Modern CSS layout system',
            resources: [
              { title: 'Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', type: 'tutorial', platform: 'CSS-Tricks', isFree: true }
            ],
            estimatedTime: 5
          }
        ]
      },
      {
        id: 'responsive-design',
        title: 'Responsive Design',
        description: 'Mobile-first responsive web design',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 8,
        position: { x: 500, y: 100 },
        connections: ['javascript-basics'],
        miniTopics: [
          {
            title: 'Media Queries',
            description: 'CSS media queries for responsive design',
            resources: [
              { title: 'Media Queries', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Mobile-First Design',
            description: 'Designing for mobile devices first',
            resources: [
              { title: 'Mobile-First CSS', url: 'https://www.youtube.com/watch?v=8KE2rKvjzBI', type: 'tutorial', platform: 'YouTube', isFree: true }
            ],
            estimatedTime: 5
          }
        ]
      },

      // Core Layer
      {
        id: 'javascript-basics',
        title: 'JavaScript Fundamentals',
        description: 'Core JavaScript programming concepts',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 25,
        position: { x: 200, y: 250 },
        connections: ['dom-manipulation', 'async-js', 'react-basics'],
        miniTopics: [
          {
            title: 'Variables & Data Types',
            description: 'var, let, const, primitive types, objects',
            resources: [
              { title: 'JavaScript Variables', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Variables', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Functions & Scope',
            description: 'Function declarations, expressions, closures',
            resources: [
              { title: 'Functions', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Functions', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Arrays & Objects',
            description: 'Working with arrays and object manipulation',
            resources: [
              { title: 'Arrays', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Arrays', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Control Flow',
            description: 'if/else, loops, switch statements',
            resources: [
              { title: 'Control Flow', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/conditionals', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 7
          }
        ],
        projectMilestone: {
          title: 'JavaScript Calculator',
          description: 'Build a fully functional calculator with JavaScript',
          difficulty: 'beginner',
          deliverables: ['Basic arithmetic operations', 'Clear/reset functionality', 'Input validation', 'Responsive design'],
          estimatedTime: 8
        }
      },
      {
        id: 'dom-manipulation',
        title: 'DOM Manipulation',
        description: 'Interacting with the Document Object Model',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 12,
        position: { x: 100, y: 400 },
        connections: ['event-handling', 'react-basics'],
        miniTopics: [
          {
            title: 'Selecting Elements',
            description: 'getElementById, querySelector, getElementsByClassName',
            resources: [
              { title: 'Document.querySelector()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Creating & Modifying Elements',
            description: 'createElement, appendChild, innerHTML, textContent',
            resources: [
              { title: 'Node Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Node', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Traversing the DOM',
            description: 'parentNode, childNodes, nextSibling, previousSibling',
            resources: [
              { title: 'DOM Traversal', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Traversing_an_HTML_table_with_JavaScript_and_DOM_interfaces', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'event-handling',
        title: 'Event Handling',
        description: 'Handling user interactions and events',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 8,
        position: { x: 300, y: 400 },
        connections: ['async-js'],
        miniTopics: [
          {
            title: 'Event Listeners',
            description: 'addEventListener, removeEventListener',
            resources: [
              { title: 'EventTarget.addEventListener()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Event Object',
            description: 'Event properties and methods',
            resources: [
              { title: 'Event Interface', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Event', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 2
          },
          {
            title: 'Event Propagation',
            description: 'Bubbling and capturing phases',
            resources: [
              { title: 'Event Propagation', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Interactive Todo App',
          description: 'Build a todo application with add, edit, delete, and mark complete functionality',
          difficulty: 'intermediate',
          deliverables: ['Add/delete todos', 'Mark complete/incomplete', 'Local storage persistence', 'Filter by status'],
          estimatedTime: 12
        }
      },
      {
        id: 'async-js',
        title: 'Asynchronous JavaScript',
        description: 'Promises, async/await, and AJAX',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 500, y: 400 },
        connections: ['react-basics'],
        miniTopics: [
          {
            title: 'Promises',
            description: 'Promise constructor, then(), catch(), finally()',
            resources: [
              { title: 'Promise', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Async/Await',
            description: 'async functions and await expressions',
            resources: [
              { title: 'async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Fetch API',
            description: 'Making HTTP requests with fetch()',
            resources: [
              { title: 'Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Weather Dashboard',
          description: 'Build a weather app that fetches data from a weather API and displays current conditions',
          difficulty: 'intermediate',
          deliverables: ['API integration', 'Error handling', 'Loading states', 'Geolocation support'],
          estimatedTime: 15
        }
      },

      // Advanced Layer
      {
        id: 'react-basics',
        title: 'React Fundamentals',
        description: 'Building user interfaces with React',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 200, y: 550 },
        connections: ['react-hooks', 'react-router'],
        miniTopics: [
          {
            title: 'JSX Syntax',
            description: 'JavaScript XML for React components',
            resources: [
              { title: 'Introducing JSX', url: 'https://react.dev/learn/writing-markup-with-jsx', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Components & Props',
            description: 'Creating reusable components with props',
            resources: [
              { title: 'Your First Component', url: 'https://react.dev/learn/your-first-component', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'State & Lifecycle',
            description: 'useState hook and component lifecycle',
            resources: [
              { title: 'State: A Component\'s Memory', url: 'https://react.dev/learn/state-a-components-memory', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Conditional Rendering',
            description: 'Rendering different UI based on conditions',
            resources: [
              { title: 'Conditional Rendering', url: 'https://react.dev/learn/conditional-rendering', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Lists & Keys',
            description: 'Rendering lists and using keys for performance',
            resources: [
              { title: 'Rendering Lists', url: 'https://react.dev/learn/render-and-commit', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Task Management App',
          description: 'Build a full-featured task management application with React',
          difficulty: 'intermediate',
          deliverables: ['Add/edit/delete tasks', 'Categories and tags', 'Search and filter', 'Data persistence', 'Responsive design'],
          estimatedTime: 25
        }
      },
      {
        id: 'react-hooks',
        title: 'React Hooks',
        description: 'Advanced state management with hooks',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 15,
        position: { x: 100, y: 700 },
        connections: ['react-router'],
        miniTopics: [
          {
            title: 'useEffect Hook',
            description: 'Managing side effects in functional components',
            resources: [
              { title: 'useEffect', url: 'https://react.dev/reference/react/useEffect', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'useContext Hook',
            description: 'Sharing state between components without prop drilling',
            resources: [
              { title: 'useContext', url: 'https://react.dev/reference/react/useContext', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Custom Hooks',
            description: 'Creating reusable logic with custom hooks',
            resources: [
              { title: 'Building Your Own Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks', type: 'documentation', platform: 'React', isFree: true }
            ],
            estimatedTime: 7
          }
        ]
      },
      {
        id: 'react-router',
        title: 'React Router',
        description: 'Client-side routing for React applications',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 10,
        position: { x: 300, y: 700 },
        connections: ['fullstack-project'],
        miniTopics: [
          {
            title: 'Basic Routing',
            description: 'Setting up routes and navigation',
            resources: [
              { title: 'React Router Tutorial', url: 'https://reactrouter.com/en/main/start/tutorial', type: 'tutorial', platform: 'React Router', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Nested Routes',
            description: 'Creating nested route structures',
            resources: [
              { title: 'Nested Routes', url: 'https://reactrouter.com/en/main/start/concepts#nested-routes', type: 'documentation', platform: 'React Router', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Protected Routes',
            description: 'Implementing authentication-based routing',
            resources: [
              { title: 'Protected Routes', url: 'https://ui.dev/react-router-protected-routes', type: 'tutorial', platform: 'ui.dev', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },

      // Project Layer
      {
        id: 'fullstack-project',
        title: 'Full-Stack Application',
        description: 'Complete MERN stack application',
        category: 'project',
        difficulty: 'advanced',
        estimatedTime: 60,
        position: { x: 200, y: 850 },
        connections: [],
        miniTopics: [],
        projectMilestone: {
          title: 'MERN Stack Social Media App',
          description: 'Build a complete social media application with React frontend, Node.js/Express backend, and MongoDB database',
          difficulty: 'advanced',
          deliverables: ['User authentication & authorization', 'Post creation & interaction', 'Real-time notifications', 'File upload handling', 'Responsive design', 'API documentation'],
          estimatedTime: 60
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'css-basics', to: 'responsive-design', type: 'related', strength: 0.8 },
      { from: 'responsive-design', to: 'javascript-basics', type: 'related', strength: 0.6 },
      { from: 'event-handling', to: 'async-js', type: 'related', strength: 0.7 },
      { from: 'dom-manipulation', to: 'react-basics', type: 'related', strength: 0.8 },
      { from: 'react-basics', to: 'react-hooks', type: 'related', strength: 1 },
      { from: 'react-basics', to: 'react-router', type: 'related', strength: 0.8 },
      { from: 'react-hooks', to: 'react-router', type: 'related', strength: 0.6 },
      { from: 'react-router', to: 'fullstack-project', type: 'related', strength: 1 }
    ];

    const skillPath = ['html-basics', 'css-basics', 'responsive-design', 'javascript-basics', 'dom-manipulation', 'event-handling', 'async-js', 'react-basics', 'react-hooks', 'react-router', 'fullstack-project'];

    return { nodes, edges, skillPath };
  }
  private generatePythonKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'python-basics',
        title: 'Python Fundamentals',
        description: 'Core Python programming concepts',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 25,
        position: { x: 200, y: 100 },
        connections: ['python-data-structures', 'python-oop'],
        miniTopics: [
          {
            title: 'Variables & Data Types',
            description: 'Variables, strings, numbers, booleans',
            resources: [
              { title: 'Python Variables', url: 'https://docs.python.org/3/tutorial/introduction.html#using-python-as-a-calculator', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Control Flow',
            description: 'if/elif/else, loops, break/continue',
            resources: [
              { title: 'Control Flow', url: 'https://docs.python.org/3/tutorial/controlflow.html', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Functions',
            description: 'Defining and calling functions',
            resources: [
              { title: 'Functions', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Error Handling',
            description: 'Try/except blocks and exception handling',
            resources: [
              { title: 'Errors and Exceptions', url: 'https://docs.python.org/3/tutorial/errors.html', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 7
          }
        ],
        projectMilestone: {
          title: 'Command Line Calculator',
          description: 'Build a calculator that runs in the terminal',
          difficulty: 'beginner',
          deliverables: ['Basic arithmetic operations', 'Input validation', 'Error handling', 'User-friendly interface'],
          estimatedTime: 6
        }
      },
      {
        id: 'python-data-structures',
        title: 'Data Structures',
        description: 'Lists, tuples, dictionaries, sets',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 100, y: 250 },
        connections: ['python-file-io', 'python-modules'],
        miniTopics: [
          {
            title: 'Lists & List Comprehension',
            description: 'Creating, modifying, and iterating over lists',
            resources: [
              { title: 'Lists', url: 'https://docs.python.org/3/tutorial/datastructures.html#more-on-lists', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Dictionaries',
            description: 'Key-value data structures',
            resources: [
              { title: 'Dictionaries', url: 'https://docs.python.org/3/tutorial/datastructures.html#dictionaries', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Tuples & Sets',
            description: 'Immutable sequences and unique collections',
            resources: [
              { title: 'Tuples and Sequences', url: 'https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 5
          }
        ]
      },
      {
        id: 'python-oop',
        title: 'Object-Oriented Programming',
        description: 'Classes, objects, inheritance, polymorphism',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 300, y: 250 },
        connections: ['python-file-io', 'python-web-dev'],
        miniTopics: [
          {
            title: 'Classes & Objects',
            description: 'Defining classes and creating instances',
            resources: [
              { title: 'Classes', url: 'https://docs.python.org/3/tutorial/classes.html', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Inheritance',
            description: 'Creating subclass relationships',
            resources: [
              { title: 'Inheritance', url: 'https://docs.python.org/3/tutorial/classes.html#inheritance', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Special Methods',
            description: '__init__, __str__, __repr__ methods',
            resources: [
              { title: 'Special Methods', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 6
          }
        ],
        projectMilestone: {
          title: 'Bank Account System',
          description: 'Create a banking system with accounts, transactions, and balance management',
          difficulty: 'intermediate',
          deliverables: ['Account classes', 'Transaction handling', 'Balance calculations', 'Input validation'],
          estimatedTime: 15
        }
      },
      {
        id: 'python-web-development',
        title: 'Web Development with Python',
        description: 'Building web applications using Flask/Django',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 35,
        position: { x: 200, y: 400 },
        connections: ['python-data-analysis'],
        miniTopics: [
          {
            title: 'Flask Framework',
            description: 'Lightweight web framework for Python',
            resources: [
              { title: 'Flask Documentation', url: 'https://flask.palletsprojects.com/en/2.3.x/', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 12
          },
          {
            title: 'Django Framework',
            description: 'Full-featured web framework for Python',
            resources: [
              { title: 'Django Documentation', url: 'https://docs.djangoproject.com/en/4.2/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 15
          },
          {
            title: 'REST APIs with Flask/Django',
            description: 'Building RESTful APIs',
            resources: [
              { title: 'Django REST Framework', url: 'https://www.django-rest-framework.org/', type: 'documentation', platform: 'DRF', isFree: true }
            ],
            estimatedTime: 8
          }
        ],
        projectMilestone: {
          title: 'Full-Stack Blog Application',
          description: 'Build a complete blog with user authentication, posts, comments, and admin panel',
          difficulty: 'advanced',
          deliverables: ['User authentication', 'CRUD operations', 'Database models', 'API endpoints', 'Frontend templates'],
          estimatedTime: 30
        }
      },
      {
        id: 'python-data-analysis',
        title: 'Data Analysis & Visualization',
        description: 'Analyzing and visualizing data with pandas and matplotlib',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 28,
        position: { x: 400, y: 400 },
        connections: ['python-automation'],
        miniTopics: [
          {
            title: 'Pandas for Data Analysis',
            description: 'Data manipulation and analysis with pandas',
            resources: [
              { title: 'Pandas Documentation', url: 'https://pandas.pydata.org/docs/', type: 'documentation', platform: 'Pandas', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Data Visualization',
            description: 'Creating charts and plots with matplotlib/seaborn',
            resources: [
              { title: 'Matplotlib Tutorial', url: 'https://matplotlib.org/stable/tutorials/index.html', type: 'tutorial', platform: 'Matplotlib', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Data Cleaning & Processing',
            description: 'Handling missing data, outliers, and data transformation',
            resources: [
              { title: 'Data Cleaning Guide', url: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/03_subset_data.html', type: 'tutorial', platform: 'Pandas', isFree: true }
            ],
            estimatedTime: 10
          }
        ],
        projectMilestone: {
          title: 'Data Analysis Dashboard',
          description: 'Create a comprehensive data analysis project with multiple datasets and visualizations',
          difficulty: 'intermediate',
          deliverables: ['Data cleaning', 'Statistical analysis', 'Interactive visualizations', 'Insights report'],
          estimatedTime: 25
        }
      },
      {
        id: 'python-automation',
        title: 'Python Automation',
        description: 'Automating tasks with Python scripts',
        category: 'specialization',
        difficulty: 'intermediate',
        estimatedTime: 22,
        position: { x: 300, y: 550 },
        connections: [],
        miniTopics: [
          {
            title: 'File System Operations',
            description: 'Reading, writing, and organizing files',
            resources: [
              { title: 'Python File Operations', url: 'https://docs.python.org/3/tutorial/inputoutput.html', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Web Scraping',
            description: 'Extracting data from websites',
            resources: [
              { title: 'Beautiful Soup', url: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc/', type: 'documentation', platform: 'Beautiful Soup', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'API Integration',
            description: 'Working with REST APIs and external services',
            resources: [
              { title: 'Requests Library', url: 'https://requests.readthedocs.io/en/latest/', type: 'documentation', platform: 'Requests', isFree: true }
            ],
            estimatedTime: 8
          }
        ],
        projectMilestone: {
          title: 'Task Automation Suite',
          description: 'Build a collection of automation scripts for common tasks',
          difficulty: 'intermediate',
          deliverables: ['File organizer', 'Web scraper', 'API client', 'Email automation', 'Report generator'],
          estimatedTime: 20
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'python-basics', to: 'python-data-structures', type: 'related', strength: 1 },
      { from: 'python-basics', to: 'python-oop', type: 'related', strength: 1 },
      { from: 'python-data-structures', to: 'python-web-development', type: 'related', strength: 0.7 },
      { from: 'python-data-structures', to: 'python-data-analysis', type: 'related', strength: 0.9 },
      { from: 'python-oop', to: 'python-web-development', type: 'related', strength: 1 },
      { from: 'python-web-development', to: 'python-automation', type: 'related', strength: 0.8 },
      { from: 'python-data-analysis', to: 'python-automation', type: 'related', strength: 0.6 }
    ];

    const skillPath = ['python-basics', 'python-data-structures', 'python-oop', 'python-web-development', 'python-data-analysis', 'python-automation'];

    return { nodes, edges, skillPath };
  }
  private generateMachineLearningKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'ml-math-foundations',
        title: 'Mathematics for ML',
        description: 'Linear Algebra, Calculus, Statistics',
        category: 'foundation',
        difficulty: 'intermediate',
        estimatedTime: 40,
        position: { x: 200, y: 100 },
        connections: ['ml-python-data', 'ml-statistics'],
        miniTopics: [
          {
            title: 'Linear Algebra',
            description: 'Vectors, matrices, eigenvalues',
            resources: [
              { title: 'Linear Algebra Review', url: 'https://cs229.stanford.edu/section/cs229-linalg.pdf', type: 'documentation', platform: 'Stanford', isFree: true }
            ],
            estimatedTime: 15
          },
          {
            title: 'Calculus',
            description: 'Derivatives, gradients, optimization',
            resources: [
              { title: 'Calculus for ML', url: 'https://cs229.stanford.edu/section/cs229-multivariable-calculus.pdf', type: 'documentation', platform: 'Stanford', isFree: true }
            ],
            estimatedTime: 15
          },
          {
            title: 'Probability',
            description: 'Distributions, Bayes theorem',
            resources: [
              { title: 'Probability Review', url: 'https://cs229.stanford.edu/section/cs229-probability.pdf', type: 'documentation', platform: 'Stanford', isFree: true }
            ],
            estimatedTime: 10
          }
        ]
      },
      {
        id: 'ml-statistics',
        title: 'Statistics for ML',
        description: 'Hypothesis testing, confidence intervals',
        category: 'foundation',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 400, y: 100 },
        connections: ['ml-supervised-learning'],
        miniTopics: [
          {
            title: 'Descriptive Statistics',
            description: 'Mean, median, variance, standard deviation',
            resources: [
              { title: 'Statistics Fundamentals', url: 'https://www.coursera.org/learn/statistics-for-data-science-python', type: 'course', platform: 'Coursera', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Inferential Statistics',
            description: 'Hypothesis testing, p-values',
            resources: [
              { title: 'Statistical Inference', url: 'https://www.khanacademy.org/math/statistics-probability', type: 'course', platform: 'Khan Academy', isFree: true }
            ],
            estimatedTime: 12
          }
        ]
      },
      {
        id: 'ml-python-data',
        title: 'Python for Data Science',
        description: 'NumPy, Pandas, Matplotlib, Scikit-learn',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 30,
        position: { x: 100, y: 250 },
        connections: ['ml-supervised-learning', 'ml-unsupervised-learning'],
        miniTopics: [
          {
            title: 'NumPy Arrays',
            description: 'Array operations, broadcasting',
            resources: [
              { title: 'NumPy Tutorial', url: 'https://numpy.org/doc/stable/user/quickstart.html', type: 'tutorial', platform: 'NumPy', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Pandas DataFrames',
            description: 'Data manipulation and analysis',
            resources: [
              { title: 'Pandas Tutorial', url: 'https://pandas.pydata.org/docs/getting_started/index.html', type: 'tutorial', platform: 'Pandas', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Matplotlib Visualization',
            description: 'Creating charts and plots',
            resources: [
              { title: 'Matplotlib Tutorial', url: 'https://matplotlib.org/stable/tutorials/index.html', type: 'tutorial', platform: 'Matplotlib', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'Scikit-learn Basics',
            description: 'Machine learning with scikit-learn',
            resources: [
              { title: 'Scikit-learn Tutorial', url: 'https://scikit-learn.org/stable/tutorial/index.html', type: 'tutorial', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Iris Classification',
          description: 'Build a machine learning model to classify iris flowers',
          difficulty: 'intermediate',
          deliverables: ['Data exploration', 'Model training', 'Accuracy evaluation', 'Visualization'],
          estimatedTime: 12
        }
      },
      {
        id: 'ml-supervised-learning',
        title: 'Supervised Learning',
        description: 'Regression and classification algorithms',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 300, y: 250 },
        connections: ['ml-deep-learning'],
        miniTopics: [
          {
            title: 'Linear Regression',
            description: 'Simple and multiple linear regression',
            resources: [
              { title: 'Linear Regression', url: 'https://scikit-learn.org/stable/modules/linear_model.html', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Logistic Regression',
            description: 'Binary and multiclass classification',
            resources: [
              { title: 'Logistic Regression', url: 'https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'Decision Trees',
            description: 'Tree-based classification and regression',
            resources: [
              { title: 'Decision Trees', url: 'https://scikit-learn.org/stable/modules/tree.html', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 10
          }
        ]
      },
      {
        id: 'ml-unsupervised-learning',
        title: 'Unsupervised Learning',
        description: 'Clustering and dimensionality reduction',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 500, y: 250 },
        connections: ['ml-deep-learning'],
        miniTopics: [
          {
            title: 'K-Means Clustering',
            description: 'Partitioning data into k clusters',
            resources: [
              { title: 'K-Means', url: 'https://scikit-learn.org/stable/modules/clustering.html#k-means', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Principal Component Analysis',
            description: 'Dimensionality reduction technique',
            resources: [
              { title: 'PCA', url: 'https://scikit-learn.org/stable/modules/decomposition.html#pca', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'DBSCAN',
            description: 'Density-based clustering algorithm',
            resources: [
              { title: 'DBSCAN', url: 'https://scikit-learn.org/stable/modules/clustering.html#dbscan', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 5
          }
        ]
      },
      {
        id: 'ml-deep-learning',
        title: 'Deep Learning',
        description: 'Neural networks with TensorFlow/PyTorch',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 40,
        position: { x: 300, y: 400 },
        connections: [],
        miniTopics: [
          {
            title: 'Neural Network Basics',
            description: 'Neurons, layers, activation functions',
            resources: [
              { title: 'Neural Networks', url: 'https://www.coursera.org/learn/neural-networks-deep-learning', type: 'course', platform: 'Coursera', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Convolutional Neural Networks',
            description: 'CNNs for image processing',
            resources: [
              { title: 'CNN Course', url: 'https://www.coursera.org/learn/convolutional-neural-networks', type: 'course', platform: 'Coursera', isFree: true }
            ],
            estimatedTime: 15
          },
          {
            title: 'Recurrent Neural Networks',
            description: 'RNNs for sequential data',
            resources: [
              { title: 'RNN Tutorial', url: 'https://www.coursera.org/learn/nlp-sequence-models', type: 'course', platform: 'Coursera', isFree: true }
            ],
            estimatedTime: 15
          }
        ],
        projectMilestone: {
          title: 'Image Classification CNN',
          description: 'Build a convolutional neural network for CIFAR-10 image classification',
          difficulty: 'advanced',
          deliverables: ['CNN architecture design', 'Data preprocessing', 'Model training and optimization', 'Performance evaluation'],
          estimatedTime: 35
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'ml-math-foundations', to: 'ml-python-data', type: 'related', strength: 1 },
      { from: 'ml-math-foundations', to: 'ml-statistics', type: 'related', strength: 0.9 },
      { from: 'ml-statistics', to: 'ml-supervised-learning', type: 'related', strength: 0.8 },
      { from: 'ml-python-data', to: 'ml-supervised-learning', type: 'related', strength: 1 },
      { from: 'ml-python-data', to: 'ml-unsupervised-learning', type: 'related', strength: 1 },
      { from: 'ml-supervised-learning', to: 'ml-deep-learning', type: 'related', strength: 0.9 },
      { from: 'ml-unsupervised-learning', to: 'ml-deep-learning', type: 'related', strength: 0.7 }
    ];

    const skillPath = ['ml-math-foundations', 'ml-statistics', 'ml-python-data', 'ml-supervised-learning', 'ml-unsupervised-learning', 'ml-deep-learning'];

    return { nodes, edges, skillPath };
  }
  private generateAIKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'ai-fundamentals',
        title: 'AI Fundamentals',
        description: 'Core concepts of Artificial Intelligence and intelligent systems',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 20,
        position: { x: 200, y: 100 },
        connections: ['ai-search-algorithms', 'ai-knowledge-representation'],
        miniTopics: [
          {
            title: 'What is AI?',
            description: 'Definition, history, and types of artificial intelligence',
            resources: [
              { title: 'AI Definition', url: 'https://www.coursera.org/articles/what-is-artificial-intelligence', type: 'documentation', platform: 'Coursera', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Turing Test',
            description: 'Measuring machine intelligence and consciousness',
            resources: [
              { title: 'Turing Test Explained', url: 'https://plato.stanford.edu/entries/turing-test/', type: 'documentation', platform: 'Stanford', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'AI Ethics',
            description: 'Responsible AI development and deployment',
            resources: [
              { title: 'AI Ethics Guidelines', url: 'https://www.partnershiponai.org/tenets/', type: 'documentation', platform: 'Partnership on AI', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'AI Applications',
            description: 'Real-world uses of artificial intelligence',
            resources: [
              { title: 'AI Use Cases', url: 'https://www.mckinsey.com/business-functions/mckinsey-digital/our-insights/an-executives-guide-to-ai', type: 'documentation', platform: 'McKinsey', isFree: true }
            ],
            estimatedTime: 8
          }
        ]
      },
      {
        id: 'ai-search-algorithms',
        title: 'Search Algorithms',
        description: 'Problem-solving and optimization algorithms in AI',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 100, y: 250 },
        connections: ['ai-machine-learning', 'ai-reinforcement-learning'],
        miniTopics: [
          {
            title: 'Uninformed Search',
            description: 'Breadth-first, depth-first, and uniform cost search',
            resources: [
              { title: 'Search Algorithms', url: 'https://www.geeksforgeeks.org/search-algorithms-in-ai/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Informed Search',
            description: 'A* algorithm, greedy best-first search, heuristic functions',
            resources: [
              { title: 'A* Algorithm', url: 'https://www.redblobgames.com/pathfinding/a-star/introduction.html', type: 'tutorial', platform: 'Red Blob Games', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Adversarial Search',
            description: 'Minimax algorithm and alpha-beta pruning for games',
            resources: [
              { title: 'Minimax Algorithm', url: 'https://www.geeksforgeeks.org/minimax-algorithm-in-game-theory/', type: 'tutorial', platform: 'GeeksforGeeks', isFree: true }
            ],
            estimatedTime: 7
          }
        ],
        projectMilestone: {
          title: 'Pathfinding Visualizer',
          description: 'Implement A* pathfinding algorithm with visualization for maze solving',
          difficulty: 'intermediate',
          deliverables: ['A* implementation', 'Heuristic functions', 'Visualization interface', 'Performance comparison'],
          estimatedTime: 20
        }
      },
      {
        id: 'ai-knowledge-representation',
        title: 'Knowledge Representation',
        description: 'How AI systems represent and reason about knowledge',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 22,
        position: { x: 300, y: 250 },
        connections: ['ai-expert-systems', 'ai-natural-language'],
        miniTopics: [
          {
            title: 'Semantic Networks',
            description: 'Graph-based knowledge representation',
            resources: [
              { title: 'Semantic Networks', url: 'https://www.sciencedirect.com/topics/computer-science/semantic-network', type: 'documentation', platform: 'ScienceDirect', isFree: false }
            ],
            estimatedTime: 6
          },
          {
            title: 'Ontologies',
            description: 'Formal representation of knowledge domains',
            resources: [
              { title: 'Ontology Development', url: 'https://protege.stanford.edu/', type: 'practice', platform: 'Stanford', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Logic-Based Systems',
            description: 'First-order logic and automated reasoning',
            resources: [
              { title: 'Automated Reasoning', url: 'https://www.coursera.org/learn/automated-reasoning', type: 'course', platform: 'Coursera', isFree: true }
            ],
            estimatedTime: 8
          }
        ]
      },
      {
        id: 'ai-machine-learning',
        title: 'Machine Learning in AI',
        description: 'Statistical learning methods and pattern recognition',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 35,
        position: { x: 100, y: 400 },
        connections: ['ai-computer-vision', 'ai-deep-learning'],
        miniTopics: [
          {
            title: 'Supervised Learning',
            description: 'Classification and regression algorithms',
            resources: [
              { title: 'Supervised Learning', url: 'https://scikit-learn.org/stable/supervised_learning.html', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 12
          },
          {
            title: 'Unsupervised Learning',
            description: 'Clustering and dimensionality reduction',
            resources: [
              { title: 'Unsupervised Learning', url: 'https://scikit-learn.org/stable/modules/unsupervised_learning.html', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Model Evaluation',
            description: 'Cross-validation, metrics, and overfitting prevention',
            resources: [
              { title: 'Model Evaluation', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html', type: 'documentation', platform: 'Scikit-learn', isFree: true }
            ],
            estimatedTime: 13
          }
        ],
        projectMilestone: {
          title: 'AI Classification System',
          description: 'Build a complete machine learning pipeline for classification with model comparison and deployment',
          difficulty: 'advanced',
          deliverables: ['Data preprocessing', 'Model training', 'Evaluation metrics', 'Model deployment', 'API integration'],
          estimatedTime: 30
        }
      },
      {
        id: 'ai-natural-language',
        title: 'Natural Language Processing',
        description: 'AI systems that understand and generate human language',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 30,
        position: { x: 300, y: 400 },
        connections: ['ai-computer-vision', 'ai-ethics-deployment'],
        miniTopics: [
          {
            title: 'Text Processing',
            description: 'Tokenization, stemming, lemmatization, and text cleaning',
            resources: [
              { title: 'NLTK Library', url: 'https://www.nltk.org/', type: 'documentation', platform: 'NLTK', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Language Models',
            description: 'Statistical and neural language models',
            resources: [
              { title: 'Transformers', url: 'https://huggingface.co/docs/transformers/index', type: 'documentation', platform: 'Hugging Face', isFree: true }
            ],
            estimatedTime: 12
          },
          {
            title: 'NLP Applications',
            description: 'Sentiment analysis, named entity recognition, machine translation',
            resources: [
              { title: 'spaCy', url: 'https://spacy.io/', type: 'documentation', platform: 'spaCy', isFree: true }
            ],
            estimatedTime: 10
          }
        ],
        projectMilestone: {
          title: 'Chatbot with NLP',
          description: 'Create an intelligent chatbot using NLP techniques and conversational AI',
          difficulty: 'advanced',
          deliverables: ['Intent recognition', 'Entity extraction', 'Response generation', 'Conversation flow', 'Integration with messaging platforms'],
          estimatedTime: 35
        }
      },
      {
        id: 'ai-computer-vision',
        title: 'Computer Vision',
        description: 'AI systems that can see and interpret visual information',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 25,
        position: { x: 400, y: 550 },
        connections: [],
        miniTopics: [
          {
            title: 'Image Processing',
            description: 'Basic image manipulation and feature extraction',
            resources: [
              { title: 'OpenCV', url: 'https://docs.opencv.org/', type: 'documentation', platform: 'OpenCV', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Convolutional Neural Networks',
            description: 'CNNs for image classification and object detection',
            resources: [
              { title: 'CNN Tutorial', url: 'https://cs231n.github.io/convolutional-networks/', type: 'tutorial', platform: 'Stanford', isFree: true }
            ],
            estimatedTime: 12
          },
          {
            title: 'Object Detection',
            description: 'Identifying and locating objects in images',
            resources: [
              { title: 'YOLO Paper', url: 'https://arxiv.org/abs/1506.02640', type: 'documentation', platform: 'arXiv', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Image Classification System',
          description: 'Build a CNN model to classify images using transfer learning',
          difficulty: 'advanced',
          deliverables: ['Data preprocessing', 'Model training', 'Evaluation metrics', 'Deployment'],
          estimatedTime: 30
        }
      },
      {
        id: 'ai-ethics-deployment',
        title: 'AI Ethics & Deployment',
        description: 'Responsible AI development and production deployment',
        category: 'specialization',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 500, y: 400 },
        connections: [],
        miniTopics: [
          {
            title: 'AI Ethics',
            description: 'Bias, fairness, transparency, and accountability in AI',
            resources: [
              { title: 'AI Ethics Guidelines', url: 'https://www.partnershiponai.org/tenets/', type: 'documentation', platform: 'Partnership on AI', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Model Deployment',
            description: 'Deploying AI models to production environments',
            resources: [
              { title: 'MLOps Guide', url: 'https://ml-ops.org/', type: 'documentation', platform: 'MLOps', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Model Monitoring',
            description: 'Monitoring model performance and drift in production',
            resources: [
              { title: 'Model Monitoring', url: 'https://christophergs.com/machine%20learning/2019/03/17/how-to-monitor-machine-learning-models/', type: 'documentation', platform: 'Christopher Samiullah', isFree: true }
            ],
            estimatedTime: 6
          }
        ],
        projectMilestone: {
          title: 'Responsible AI System',
          description: 'Deploy an AI model with comprehensive monitoring and bias detection',
          difficulty: 'advanced',
          deliverables: ['Bias audit', 'Monitoring dashboard', 'Drift detection', 'Ethical considerations report'],
          estimatedTime: 35
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'ai-fundamentals', to: 'ai-search-algorithms', type: 'related', strength: 1 },
      { from: 'ai-fundamentals', to: 'ai-knowledge-representation', type: 'related', strength: 1 },
      { from: 'ai-search-algorithms', to: 'ai-machine-learning', type: 'related', strength: 0.9 },
      { from: 'ai-knowledge-representation', to: 'ai-natural-language', type: 'related', strength: 0.9 },
      { from: 'ai-machine-learning', to: 'ai-natural-language', type: 'related', strength: 0.7 },
      { from: 'ai-machine-learning', to: 'ai-computer-vision', type: 'related', strength: 0.8 },
      { from: 'ai-natural-language', to: 'ai-computer-vision', type: 'related', strength: 0.6 },
      { from: 'ai-natural-language', to: 'ai-ethics-deployment', type: 'related', strength: 0.8 }
    ];

    const skillPath = ['ai-fundamentals', 'ai-search-algorithms', 'ai-knowledge-representation', 'ai-machine-learning', 'ai-natural-language'];

    return { nodes, edges, skillPath };
  }
  private generateAWSKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'aws-cloud-concepts',
        title: 'Cloud Computing Concepts',
        description: 'Understanding cloud computing fundamentals',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 10,
        position: { x: 200, y: 100 },
        connections: ['aws-iam', 'aws-ec2'],
        miniTopics: [
          {
            title: 'Cloud vs Traditional Computing',
            description: 'Benefits and differences of cloud computing',
            resources: [
              { title: 'What is Cloud Computing?', url: 'https://aws.amazon.com/what-is-cloud-computing/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'AWS Global Infrastructure',
            description: 'Regions, Availability Zones, Edge Locations',
            resources: [
              { title: 'AWS Global Infrastructure', url: 'https://aws.amazon.com/about-aws/global-infrastructure/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'AWS Service Categories',
            description: 'Compute, Storage, Database, Networking services',
            resources: [
              { title: 'AWS Services Overview', url: 'https://aws.amazon.com/products/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'aws-iam',
        title: 'Identity & Access Management',
        description: 'Managing users, groups, roles, and permissions',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 100, y: 250 },
        connections: ['aws-ec2', 'aws-s3'],
        miniTopics: [
          {
            title: 'IAM Users & Groups',
            description: 'Creating and managing IAM users and groups',
            resources: [
              { title: 'IAM Users', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'IAM Policies',
            description: 'Creating and attaching policies',
            resources: [
              { title: 'IAM Policies', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'IAM Roles',
            description: 'Using roles for service-to-service access',
            resources: [
              { title: 'IAM Roles', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'aws-ec2',
        title: 'EC2 (Elastic Compute Cloud)',
        description: 'Virtual servers in the cloud',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 300, y: 250 },
        connections: ['aws-s3', 'aws-vpc'],
        miniTopics: [
          {
            title: 'EC2 Instances',
            description: 'Launching and managing EC2 instances',
            resources: [
              { title: 'EC2 User Guide', url: 'https://docs.aws.amazon.com/ec2/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Security Groups',
            description: 'Configuring firewall rules for instances',
            resources: [
              { title: 'Security Groups', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Key Pairs & SSH',
            description: 'Connecting to EC2 instances securely',
            resources: [
              { title: 'EC2 Key Pairs', url: 'https://docs.aws.amazon.com/ec2/latest/userguide/ec2-key-pairs.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Instance Types',
            description: 'Choosing the right instance type',
            resources: [
              { title: 'Instance Types', url: 'https://docs.aws.amazon.com/ec2/latest/userguide/instance-types.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Deploy Web App on EC2',
          description: 'Launch an EC2 instance and deploy a simple web application',
          difficulty: 'intermediate',
          deliverables: ['EC2 instance setup', 'Security group configuration', 'Web server installation', 'Application deployment'],
          estimatedTime: 20
        }
      },
      {
        id: 'aws-s3',
        title: 'S3 (Simple Storage Service)',
        description: 'Object storage service for any amount of data',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 500, y: 250 },
        connections: ['aws-lambda'],
        miniTopics: [
          {
            title: 'S3 Buckets',
            description: 'Creating and managing S3 buckets',
            resources: [
              { title: 'S3 User Guide', url: 'https://docs.aws.amazon.com/s3/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'S3 Objects',
            description: 'Uploading, downloading, and managing objects',
            resources: [
              { title: 'Working with Objects', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingObjects.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'S3 Permissions',
            description: 'Bucket policies and access control',
            resources: [
              { title: 'S3 Access Control', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'aws-vpc',
        title: 'VPC (Virtual Private Cloud)',
        description: 'Isolated cloud resources and networking',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 200, y: 400 },
        connections: ['aws-rds'],
        miniTopics: [
          {
            title: 'VPC Basics',
            description: 'Creating and configuring VPCs',
            resources: [
              { title: 'VPC User Guide', url: 'https://docs.aws.amazon.com/vpc/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Subnets',
            description: 'Public and private subnets',
            resources: [
              { title: 'VPC Subnets', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Internet Gateways & NAT',
            description: 'Connecting VPCs to the internet',
            resources: [
              { title: 'Internet Gateways', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Route Tables',
            description: 'Controlling traffic flow in VPCs',
            resources: [
              { title: 'Route Tables', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'aws-rds',
        title: 'RDS (Relational Database Service)',
        description: 'Managed relational databases in the cloud',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 500, y: 250 },
        connections: ['aws-lambda'],
        miniTopics: [
          {
            title: 'RDS Fundamentals',
            description: 'Understanding managed database services',
            resources: [
              { title: 'What is Amazon RDS?', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Database Engines',
            description: 'MySQL, PostgreSQL, Oracle, SQL Server support',
            resources: [
              { title: 'DB Engine Features', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'RDS Configuration',
            description: 'Instance types, storage, backups, security',
            resources: [
              { title: 'RDS Best Practices', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/best-practices.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'High Availability',
            description: 'Multi-AZ deployments and read replicas',
            resources: [
              { title: 'RDS Multi-AZ', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          }
        ],
        projectMilestone: {
          title: 'RDS Database Setup',
          description: 'Set up a highly available PostgreSQL database with automated backups and monitoring',
          difficulty: 'intermediate',
          deliverables: ['RDS instance creation', 'Security group configuration', 'Backup strategy', 'Monitoring setup', 'Connection from EC2'],
          estimatedTime: 20
        }
      },
      {
        id: 'aws-lambda',
        title: 'Lambda (Serverless Computing)',
        description: 'Run code without provisioning servers',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 400, y: 400 },
        connections: ['aws-api-gateway'],
        miniTopics: [
          {
            title: 'Lambda Functions',
            description: 'Creating and deploying Lambda functions',
            resources: [
              { title: 'Lambda Developer Guide', url: 'https://docs.aws.amazon.com/lambda/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Event Sources',
            description: 'Triggers for Lambda functions',
            resources: [
              { title: 'Lambda Event Sources', url: 'https://docs.aws.amazon.com/lambda/latest/dg/invoking-lambda-function.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Environment Variables',
            description: 'Configuring Lambda environment variables',
            resources: [
              { title: 'Lambda Environment Variables', url: 'https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Monitoring & Logging',
            description: 'CloudWatch integration for Lambda',
            resources: [
              { title: 'Lambda Monitoring', url: 'https://docs.aws.amazon.com/lambda/latest/dg/monitoring-functions.html', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 2
          }
        ],
        projectMilestone: {
          title: 'Serverless Image Resizer',
          description: 'Build a serverless function that resizes images uploaded to S3',
          difficulty: 'intermediate',
          deliverables: ['Lambda function', 'S3 triggers', 'Image processing', 'Error handling'],
          estimatedTime: 18
        }
      },
      {
        id: 'aws-api-gateway',
        title: 'API Gateway',
        description: 'Create, publish, and manage APIs',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 12,
        position: { x: 300, y: 550 },
        connections: [],
        miniTopics: [
          {
            title: 'Creating REST APIs',
            description: 'Building RESTful APIs with API Gateway',
            resources: [
              { title: 'API Gateway Developer Guide', url: 'https://docs.aws.amazon.com/apigateway/', type: 'documentation', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'API Gateway + Lambda',
            description: 'Integrating API Gateway with Lambda functions',
            resources: [
              { title: 'API Gateway Tutorial', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/getting-started.html', type: 'tutorial', platform: 'AWS', isFree: true }
            ],
            estimatedTime: 6
          }
        ],
        projectMilestone: {
          title: 'Serverless REST API',
          description: 'Build a complete serverless REST API with API Gateway and Lambda',
          difficulty: 'advanced',
          deliverables: ['API Gateway setup', 'Lambda integration', 'CORS configuration', 'Request/response mapping'],
          estimatedTime: 25
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'aws-cloud-concepts', to: 'aws-iam', type: 'related', strength: 0.8 },
      { from: 'aws-cloud-concepts', to: 'aws-ec2', type: 'related', strength: 1 },
      { from: 'aws-iam', to: 'aws-ec2', type: 'related', strength: 1 },
      { from: 'aws-iam', to: 'aws-s3', type: 'related', strength: 0.9 },
      { from: 'aws-ec2', to: 'aws-s3', type: 'related', strength: 0.7 },
      { from: 'aws-ec2', to: 'aws-vpc', type: 'related', strength: 0.8 },
      { from: 'aws-s3', to: 'aws-lambda', type: 'related', strength: 0.9 },
      { from: 'aws-vpc', to: 'aws-rds', type: 'related', strength: 0.6 },
      { from: 'aws-lambda', to: 'aws-api-gateway', type: 'related', strength: 1 }
    ];

    const skillPath = ['aws-cloud-concepts', 'aws-iam', 'aws-ec2', 'aws-s3', 'aws-vpc', 'aws-lambda', 'aws-api-gateway'];

    return { nodes, edges, skillPath };
  }
  private generateDockerKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'docker-basics',
        title: 'Docker Fundamentals',
        description: 'Container basics and Docker commands',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 200, y: 100 },
        connections: ['docker-images', 'docker-containers'],
        miniTopics: [
          {
            title: 'What are Containers?',
            description: 'Understanding containerization vs virtualization',
            resources: [
              { title: 'Docker Overview', url: 'https://docs.docker.com/get-started/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Installing Docker',
            description: 'Setting up Docker on your system',
            resources: [
              { title: 'Install Docker', url: 'https://docs.docker.com/get-docker/', type: 'tutorial', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 2
          },
          {
            title: 'Docker CLI Basics',
            description: 'Basic Docker commands and operations',
            resources: [
              { title: 'Docker CLI Reference', url: 'https://docs.docker.com/engine/reference/commandline/cli/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 7
          }
        ],
        projectMilestone: {
          title: 'Hello World Container',
          description: 'Run your first Docker container with a simple hello world application',
          difficulty: 'beginner',
          deliverables: ['Docker installation', 'Pull hello-world image', 'Run container', 'Basic commands'],
          estimatedTime: 4
        }
      },
      {
        id: 'docker-images',
        title: 'Docker Images',
        description: 'Creating and managing Docker images',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 100, y: 250 },
        connections: ['docker-containers', 'dockerfile'],
        miniTopics: [
          {
            title: 'Docker Hub',
            description: 'Finding and using pre-built images',
            resources: [
              { title: 'Docker Hub', url: 'https://hub.docker.com/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Image Layers',
            description: 'Understanding Docker image architecture',
            resources: [
              { title: 'Image Layers', url: 'https://docs.docker.com/develop/dev-best-practices/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Image Commands',
            description: 'build, pull, push, tag, rmi commands',
            resources: [
              { title: 'Docker Images', url: 'https://docs.docker.com/engine/reference/commandline/images/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Image Optimization',
            description: 'Best practices for smaller, faster images',
            resources: [
              { title: 'Dockerfile Best Practices', url: 'https://docs.docker.com/develop/dev-best-practices/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'docker-containers',
        title: 'Docker Containers',
        description: 'Running and managing containers',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 300, y: 250 },
        connections: ['docker-networking', 'docker-volumes'],
        miniTopics: [
          {
            title: 'Container Lifecycle',
            description: 'create, start, stop, restart, remove',
            resources: [
              { title: 'Container Commands', url: 'https://docs.docker.com/engine/reference/commandline/container/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Container Logs',
            description: 'Viewing container output and debugging',
            resources: [
              { title: 'Container Logs', url: 'https://docs.docker.com/engine/reference/commandline/logs/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 2
          },
          {
            title: 'Container Shell Access',
            description: 'Executing commands inside running containers',
            resources: [
              { title: 'docker exec', url: 'https://docs.docker.com/engine/reference/commandline/exec/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Container Resource Limits',
            description: 'CPU and memory limits for containers',
            resources: [
              { title: 'Runtime Options', url: 'https://docs.docker.com/config/containers/resource_constraints/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Containerized Web Server',
          description: 'Run an Apache or Nginx web server in a Docker container',
          difficulty: 'beginner',
          deliverables: ['Pull web server image', 'Run container with port mapping', 'Serve static content', 'Container management'],
          estimatedTime: 8
        }
      },
      {
        id: 'dockerfile',
        title: 'Dockerfile',
        description: 'Creating custom Docker images',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 200, y: 400 },
        connections: ['docker-compose', 'multi-stage-builds'],
        miniTopics: [
          {
            title: 'Basic Dockerfile Instructions',
            description: 'FROM, RUN, COPY, ADD, CMD, ENTRYPOINT',
            resources: [
              { title: 'Dockerfile Reference', url: 'https://docs.docker.com/engine/reference/builder/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'WORKDIR & ENV',
            description: 'Setting working directory and environment variables',
            resources: [
              { title: 'Dockerfile Best Practices', url: 'https://docs.docker.com/develop/dev-best-practices/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: '.dockerignore',
            description: 'Excluding files from Docker builds',
            resources: [
              { title: '.dockerignore', url: 'https://docs.docker.com/engine/reference/builder/#dockerignore-file', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 2
          },
          {
            title: 'Building Images',
            description: 'Using docker build command effectively',
            resources: [
              { title: 'docker build', url: 'https://docs.docker.com/engine/reference/commandline/build/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Custom Node.js App Image',
          description: 'Create a Dockerfile for a Node.js application and build a custom image',
          difficulty: 'intermediate',
          deliverables: ['Dockerfile creation', 'Multi-stage build', 'Image optimization', 'Container testing'],
          estimatedTime: 15
        }
      },
      {
        id: 'docker-compose',
        title: 'Docker Compose',
        description: 'Multi-container applications',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 100, y: 550 },
        connections: ['docker-swarm'],
        miniTopics: [
          {
            title: 'Compose File Structure',
            description: 'version, services, volumes, networks',
            resources: [
              { title: 'Compose File Reference', url: 'https://docs.docker.com/compose/compose-file/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Multi-Container Setup',
            description: 'Defining services and their relationships',
            resources: [
              { title: 'Getting Started with Compose', url: 'https://docs.docker.com/compose/gettingstarted/', type: 'tutorial', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Environment Variables',
            description: 'Using .env files and variable substitution',
            resources: [
              { title: 'Environment Variables', url: 'https://docs.docker.com/compose/environment-variables/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Compose Commands',
            description: 'up, down, logs, exec, scale commands',
            resources: [
              { title: 'Compose CLI', url: 'https://docs.docker.com/compose/reference/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Full-Stack App with Compose',
          description: 'Set up a complete application stack with React frontend, Node.js API, and MongoDB using Docker Compose',
          difficulty: 'advanced',
          deliverables: ['Multi-service docker-compose.yml', 'Network configuration', 'Volume management', 'Environment setup'],
          estimatedTime: 25
        }
      },
      {
        id: 'docker-swarm',
        title: 'Docker Swarm',
        description: 'Container orchestration with Swarm',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 25,
        position: { x: 200, y: 700 },
        connections: [],
        miniTopics: [
          {
            title: 'Swarm Mode',
            description: 'Initializing and managing Docker Swarm',
            resources: [
              { title: 'Swarm Mode', url: 'https://docs.docker.com/engine/swarm/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Services & Stacks',
            description: 'Deploying services and stacks in Swarm',
            resources: [
              { title: 'Swarm Services', url: 'https://docs.docker.com/engine/swarm/services/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Load Balancing',
            description: 'Routing mesh and service discovery',
            resources: [
              { title: 'Swarm Load Balancing', url: 'https://docs.docker.com/engine/swarm/ingress/', type: 'documentation', platform: 'Docker', isFree: true }
            ],
            estimatedTime: 7
          }
        ],
        projectMilestone: {
          title: 'Swarm Cluster Deployment',
          description: 'Deploy a multi-node Docker Swarm cluster and run a distributed application',
          difficulty: 'advanced',
          deliverables: ['Swarm initialization', 'Service deployment', 'Load balancing setup', 'Cluster management'],
          estimatedTime: 35
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: 'docker-basics', to: 'docker-images', type: 'related', strength: 1 },
      { from: 'docker-basics', to: 'docker-containers', type: 'related', strength: 1 },
      { from: 'docker-images', to: 'docker-containers', type: 'related', strength: 0.9 },
      { from: 'docker-images', to: 'dockerfile', type: 'related', strength: 1 },
      { from: 'docker-containers', to: 'docker-networking', type: 'related', strength: 0.8 },
      { from: 'docker-containers', to: 'docker-volumes', type: 'related', strength: 0.8 },
      { from: 'dockerfile', to: 'docker-compose', type: 'related', strength: 1 },
      { from: 'dockerfile', to: 'multi-stage-builds', type: 'related', strength: 0.7 },
      { from: 'docker-compose', to: 'docker-swarm', type: 'related', strength: 0.9 }
    ];

    const skillPath = ['docker-basics', 'docker-images', 'docker-containers', 'dockerfile', 'docker-compose', 'docker-swarm'];

    return { nodes, edges, skillPath };
  }
  private generateGenericKnowledgeGraph(targetSkill: string, currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-basics`,
        title: `${targetSkill} Fundamentals`,
        description: `Core concepts and basics of ${targetSkill}`,
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 20,
        position: { x: 200, y: 100 },
        connections: [`${targetSkill.toLowerCase().replace(/\s+/g, '-')}-intermediate`],
        miniTopics: [
          {
            title: `Introduction to ${targetSkill}`,
            description: `Understanding what ${targetSkill} is and why it's important`,
            resources: [
              {
                title: `${targetSkill} Documentation`,
                url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + ' documentation')}`,
                type: 'documentation',
                platform: 'Google',
                isFree: true
              }
            ],
            estimatedTime: 8
          },
          {
            title: `Basic ${targetSkill} Concepts`,
            description: `Fundamental concepts and terminology`,
            resources: [
              {
                title: `${targetSkill} Tutorial`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' tutorial')}`,
                type: 'tutorial',
                platform: 'YouTube',
                isFree: true
              }
            ],
            estimatedTime: 12
          }
        ],
        projectMilestone: {
          title: `${targetSkill} Practice Project`,
          description: `Build a basic project to apply your ${targetSkill} knowledge`,
          difficulty: 'beginner',
          deliverables: ['Basic implementation', 'Understanding of core concepts', 'Simple functionality'],
          estimatedTime: 15
        }
      },
      {
        id: `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-intermediate`,
        title: `${targetSkill} Intermediate`,
        description: `Advanced concepts and practical applications`,
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 30,
        position: { x: 200, y: 250 },
        connections: [`${targetSkill.toLowerCase().replace(/\s+/g, '-')}-advanced`],
        miniTopics: [
          {
            title: `Advanced ${targetSkill} Features`,
            description: `Exploring advanced capabilities and features`,
            resources: [
              {
                title: `Advanced ${targetSkill}`,
                url: `https://www.google.com/search?q=${encodeURIComponent('advanced ' + targetSkill)}`,
                type: 'documentation',
                platform: 'Google',
                isFree: true
              }
            ],
            estimatedTime: 15
          },
          {
            title: `${targetSkill} Best Practices`,
            description: `Industry best practices and patterns`,
            resources: [
              {
                title: `${targetSkill} Best Practices`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' best practices')}`,
                type: 'tutorial',
                platform: 'YouTube',
                isFree: true
              }
            ],
            estimatedTime: 15
          }
        ],
        projectMilestone: {
          title: `Intermediate ${targetSkill} Project`,
          description: `Build a more complex project showcasing intermediate skills`,
          difficulty: 'intermediate',
          deliverables: ['Advanced features', 'Best practices implementation', 'Real-world application'],
          estimatedTime: 25
        }
      },
      {
        id: `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-advanced`,
        title: `${targetSkill} Advanced`,
        description: `Expert-level concepts and professional applications`,
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 40,
        position: { x: 200, y: 400 },
        connections: [],
        miniTopics: [
          {
            title: `Expert ${targetSkill} Techniques`,
            description: `Advanced techniques and methodologies`,
            resources: [
              {
                title: `Expert ${targetSkill}`,
                url: `https://www.google.com/search?q=${encodeURIComponent('expert ' + targetSkill)}`,
                type: 'documentation',
                platform: 'Google',
                isFree: true
              }
            ],
            estimatedTime: 20
          },
          {
            title: `${targetSkill} Architecture`,
            description: `System design and architecture patterns`,
            resources: [
              {
                title: `${targetSkill} Architecture`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + ' architecture')}`,
                type: 'tutorial',
                platform: 'YouTube',
                isFree: true
              }
            ],
            estimatedTime: 20
          }
        ],
        projectMilestone: {
          title: `Advanced ${targetSkill} Project`,
          description: `Build a professional-grade project demonstrating expert-level skills`,
          difficulty: 'advanced',
          deliverables: ['Complex architecture', 'Performance optimization', 'Scalability considerations', 'Professional standards'],
          estimatedTime: 40
        }
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
      { from: `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-basics`, to: `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-intermediate`, type: 'related', strength: 1 },
      { from: `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-intermediate`, to: `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-advanced`, type: 'related', strength: 1 }
    ];

    const skillPath = [`${targetSkill.toLowerCase().replace(/\s+/g, '-')}-basics`, `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-intermediate`, `${targetSkill.toLowerCase().replace(/\s+/g, '-')}-advanced`];

    return { nodes, edges, skillPath };
  }

  // Additional knowledge graph methods for uncategorized skills
  private generateCommunicationKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'communication-fundamentals',
        title: 'Communication Fundamentals',
        description: 'Understanding effective communication principles',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 10,
        position: { x: 200, y: 100 },
        connections: ['verbal-communication', 'written-communication'],
        miniTopics: [
          {
            title: 'Communication Models',
            description: 'Understanding sender-receiver models',
            resources: [
              { title: 'Communication Theory', url: 'https://en.wikipedia.org/wiki/Communication_theory', type: 'documentation', platform: 'Wikipedia', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Active Listening',
            description: 'Techniques for effective listening',
            resources: [
              { title: 'Active Listening Skills', url: 'https://www.skillsyouneed.com/ips/active-listening.html', type: 'documentation', platform: 'SkillsYouNeed', isFree: true }
            ],
            estimatedTime: 6
          }
        ]
      },
      {
        id: 'verbal-communication',
        title: 'Verbal Communication',
        description: 'Speaking effectively in various contexts',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 100, y: 250 },
        connections: ['presentation-skills'],
        miniTopics: [
          {
            title: 'Public Speaking',
            description: 'Delivering presentations confidently',
            resources: [
              { title: 'Public Speaking Tips', url: 'https://www.toastmasters.org/', type: 'tutorial', platform: 'Toastmasters', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Meeting Facilitation',
            description: 'Leading effective meetings',
            resources: [
              { title: 'Meeting Facilitation Guide', url: 'https://www.sessionlab.com/blog/meeting-facilitation/', type: 'documentation', platform: 'SessionLab', isFree: true }
            ],
            estimatedTime: 7
          }
        ]
      }
    ];

    return {
      nodes,
      edges: [
        { from: 'communication-fundamentals', to: 'verbal-communication', type: 'related', strength: 1 },
        { from: 'verbal-communication', to: 'written-communication', type: 'related', strength: 0.7 }
      ],
      skillPath: ['communication-fundamentals', 'verbal-communication']
    };
  }

  private generateBusinessKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'business-fundamentals',
        title: 'Business Fundamentals',
        description: 'Core business concepts and principles',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 200, y: 100 },
        connections: ['marketing-basics', 'sales-techniques'],
        miniTopics: [
          {
            title: 'Business Models',
            description: 'Understanding different business models',
            resources: [
              { title: 'Business Model Canvas', url: 'https://www.strategyzer.com/canvas/business-model-canvas', type: 'tutorial', platform: 'Strategyzer', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Market Analysis',
            description: 'Basic market research techniques',
            resources: [
              { title: 'Market Research Methods', url: 'https://www.questionpro.com/blog/market-research-methods/', type: 'documentation', platform: 'QuestionPro', isFree: true }
            ],
            estimatedTime: 6
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
    ];

    return {
      nodes,
      edges,
      skillPath: ['business-fundamentals']
    };
  }

  private generateFinanceKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'finance-basics',
        title: 'Financial Literacy',
        description: 'Understanding financial concepts and budgeting',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: ['accounting-principles'],
        miniTopics: [
          {
            title: 'Budgeting',
            description: 'Creating and managing budgets',
            resources: [
              { title: 'Budgeting Basics', url: 'https://www.nerdwallet.com/article/finance/how-to-budget', type: 'documentation', platform: 'NerdWallet', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Financial Planning',
            description: 'Long-term financial planning',
            resources: [
              { title: 'Financial Planning Guide', url: 'https://www.investopedia.com/articles/pf/12/financial-planning.asp', type: 'documentation', platform: 'Investopedia', isFree: true }
            ],
            estimatedTime: 10
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
    ];

    return {
      nodes,
      edges,
      skillPath: ['finance-basics']
    };
  }

  private generateWritingKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'writing-fundamentals',
        title: 'Writing Fundamentals',
        description: 'Essential writing skills and techniques',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 200, y: 100 },
        connections: ['technical-writing'],
        miniTopics: [
          {
            title: 'Grammar and Style',
            description: 'Writing clearly and correctly',
            resources: [
              { title: 'Grammarly Writing Guide', url: 'https://www.grammarly.com/blog/category/writing-guide/', type: 'documentation', platform: 'Grammarly', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Content Structure',
            description: 'Organizing written content effectively',
            resources: [
              { title: 'Content Writing Tips', url: 'https://blog.hubspot.com/marketing/content-writing-tips', type: 'documentation', platform: 'HubSpot', isFree: true }
            ],
            estimatedTime: 6
          }
        ]
      }
    ];

    const edges: { from: string; to: string; type: 'related'; strength: number; }[] = [
    ];

    return {
      nodes,
      edges,
      skillPath: ['writing-fundamentals']
    };
  }
  private generateDesignKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'design-principles',
        title: 'Design Principles',
        description: 'Fundamental principles of visual design',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: ['ui-design', 'ux-research'],
        miniTopics: [
          {
            title: 'Color Theory',
            description: 'Understanding color relationships and psychology',
            resources: [
              { title: 'Color Theory Basics', url: 'https://www.interaction-design.org/literature/topics/color-theory', type: 'documentation', platform: 'Interaction Design Foundation', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Typography',
            description: 'Font selection and text hierarchy',
            resources: [
              { title: 'Typography Guide', url: 'https://www.smashingmagazine.com/2010/12/best-practices-for-hierarchical-typography/', type: 'documentation', platform: 'Smashing Magazine', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Layout and Composition',
            description: 'Arranging elements effectively',
            resources: [
              { title: 'Layout Principles', url: 'https://www.canva.com/learn/design-elements-principles/', type: 'documentation', platform: 'Canva', isFree: true }
            ],
            estimatedTime: 5
          }
        ]
      },
      {
        id: 'ui-design',
        title: 'UI Design',
        description: 'Creating user interfaces',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 100, y: 250 },
        connections: ['prototyping'],
        miniTopics: [
          {
            title: 'Interface Design Patterns',
            description: 'Common UI patterns and components',
            resources: [
              { title: 'UI Patterns', url: 'https://ui-patterns.com/', type: 'documentation', platform: 'UI Patterns', isFree: true }
            ],
            estimatedTime: 10
          },
          {
            title: 'Design Systems',
            description: 'Creating consistent design languages',
            resources: [
              { title: 'Design Systems Handbook', url: 'https://www.designsystems.com/', type: 'documentation', platform: 'Design Systems', isFree: true }
            ],
            estimatedTime: 10
          }
        ]
      }
    ];

    return {
      nodes,
      edges: [
        { from: 'design-principles', to: 'ui-design', type: 'related', strength: 1 },
        { from: 'ui-design', to: 'ux-research', type: 'related', strength: 0.8 }
      ],
      skillPath: ['design-principles', 'ui-design']
    };
  }
  private generateKubernetesKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'docker-basics',
        title: 'Docker Fundamentals',
        description: 'Container basics required for Kubernetes',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: ['k8s-architecture', 'k8s-pods'],
        miniTopics: [
          {
            title: 'Container Concepts',
            description: 'Images, containers, Dockerfile',
            resources: [
              { title: 'Docker Overview', url: 'https://docs.docker.com/get-started/', type: 'tutorial', platform: 'Docker Docs', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Docker Commands',
            description: 'Build, run, manage containers',
            resources: [
              { title: 'Docker CLI Reference', url: 'https://docs.docker.com/engine/reference/commandline/cli/', type: 'documentation', platform: 'Docker Docs', isFree: true }
            ],
            estimatedTime: 9
          }
        ]
      },
      {
        id: 'k8s-architecture',
        title: 'Kubernetes Architecture',
        description: 'Understanding K8s components and concepts',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 200, y: 250 },
        connections: ['k8s-pods', 'k8s-services'],
        miniTopics: [
          {
            title: 'Control Plane Components',
            description: 'API Server, etcd, Controller Manager, Scheduler',
            resources: [
              { title: 'Kubernetes Components', url: 'https://kubernetes.io/docs/concepts/overview/components/', type: 'documentation', platform: 'Kubernetes', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Cluster Architecture',
            description: 'Nodes, pods, namespaces',
            resources: [
              { title: 'Cluster Architecture', url: 'https://kubernetes.io/docs/concepts/architecture/', type: 'documentation', platform: 'Kubernetes', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'kubectl Basics',
            description: 'Command-line interface for Kubernetes',
            resources: [
              { title: 'kubectl Cheat Sheet', url: 'https://kubernetes.io/docs/reference/kubectl/cheatsheet/', type: 'documentation', platform: 'Kubernetes', isFree: true }
            ],
            estimatedTime: 5
          }
        ]
      },
      {
        id: 'k8s-pods',
        title: 'Pods & Workloads',
        description: 'Managing applications with pods and deployments',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 100, y: 400 },
        connections: ['k8s-services', 'k8s-storage'],
        miniTopics: [
          {
            title: 'Pod Lifecycle',
            description: 'Creating, managing, and monitoring pods',
            resources: [
              { title: 'Pods', url: 'https://kubernetes.io/docs/concepts/workloads/pods/', type: 'documentation', platform: 'Kubernetes', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Deployments',
            description: 'Rolling updates and scaling applications',
            resources: [
              { title: 'Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/', type: 'documentation', platform: 'Kubernetes', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'ConfigMaps & Secrets',
            description: 'Managing configuration and sensitive data',
            resources: [
              { title: 'ConfigMaps', url: 'https://kubernetes.io/docs/concepts/configuration/configmap/', type: 'documentation', platform: 'Kubernetes', isFree: true }
            ],
            estimatedTime: 5
          }
        ],
        projectMilestone: {
          title: 'Deploy Multi-tier App',
          description: 'Deploy a web application with database using Kubernetes manifests',
          difficulty: 'intermediate',
          deliverables: ['Pod configurations', 'Service definitions', 'ConfigMaps', 'Basic networking'],
          estimatedTime: 20
        }
      }
    ];

    return {
      nodes,
      edges: [
        { from: 'docker-basics', to: 'k8s-architecture', type: 'related', strength: 1 },
        { from: 'k8s-architecture', to: 'k8s-pods', type: 'related', strength: 1 },
        { from: 'k8s-pods', to: 'k8s-services', type: 'related', strength: 0.9 },
        { from: 'docker-basics', to: 'k8s-pods', type: 'related', strength: 0.7 }
      ],
      skillPath: ['docker-basics', 'k8s-architecture', 'k8s-pods']
    };
  }

  private generateExpressKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'nodejs-basics',
        title: 'Node.js Fundamentals',
        description: 'Core Node.js concepts for backend development',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 18,
        position: { x: 200, y: 100 },
        connections: ['express-basics', 'npm-modules'],
        miniTopics: [
          {
            title: 'Node.js Runtime',
            description: 'Understanding Node.js event loop and architecture',
            resources: [
              { title: 'Node.js Guide', url: 'https://nodejs.org/en/docs/guides/', type: 'documentation', platform: 'Node.js', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Modules & require()',
            description: 'CommonJS modules, importing/exporting',
            resources: [
              { title: 'Modules', url: 'https://nodejs.org/docs/latest-v18.x/api/modules.html', type: 'documentation', platform: 'Node.js', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'File System Operations',
            description: 'Reading/writing files asynchronously',
            resources: [
              { title: 'File System', url: 'https://nodejs.org/docs/latest-v18.x/api/fs.html', type: 'documentation', platform: 'Node.js', isFree: true }
            ],
            estimatedTime: 6
          }
        ]
      },
      {
        id: 'express-basics',
        title: 'Express.js Fundamentals',
        description: 'Building web applications with Express',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 22,
        position: { x: 200, y: 250 },
        connections: ['express-middleware', 'express-routing'],
        miniTopics: [
          {
            title: 'Express Setup',
            description: 'Installing and configuring Express applications',
            resources: [
              { title: 'Express Getting Started', url: 'https://expressjs.com/en/starter/hello-world.html', type: 'tutorial', platform: 'Express.js', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Basic Routing',
            description: 'GET, POST, PUT, DELETE routes',
            resources: [
              { title: 'Basic Routing', url: 'https://expressjs.com/en/guide/routing.html', type: 'documentation', platform: 'Express.js', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Request/Response Objects',
            description: 'Handling HTTP requests and responses',
            resources: [
              { title: 'Request', url: 'https://expressjs.com/en/4x/api.html#req', type: 'documentation', platform: 'Express.js', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Error Handling',
            description: 'Express error handling patterns',
            resources: [
              { title: 'Error Handling', url: 'https://expressjs.com/en/guide/error-handling.html', type: 'documentation', platform: 'Express.js', isFree: true }
            ],
            estimatedTime: 6
          }
        ],
        projectMilestone: {
          title: 'REST API with Express',
          description: 'Build a complete REST API for a blog or task management system',
          difficulty: 'intermediate',
          deliverables: ['CRUD operations', 'Input validation', 'Error handling', 'API documentation'],
          estimatedTime: 18
        }
      },
      {
        id: 'express-middleware',
        title: 'Express Middleware',
        description: 'Authentication, logging, and custom middleware',
        category: 'advanced',
        difficulty: 'intermediate',
        estimatedTime: 16,
        position: { x: 100, y: 400 },
        connections: ['database-integration'],
        miniTopics: [
          {
            title: 'Built-in Middleware',
            description: 'express.json(), express.static(), etc.',
            resources: [
              { title: 'Using Middleware', url: 'https://expressjs.com/en/guide/using-middleware.html', type: 'documentation', platform: 'Express.js', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Authentication Middleware',
            description: 'JWT, sessions, passport.js',
            resources: [
              { title: 'Passport.js', url: 'http://www.passportjs.org/', type: 'documentation', platform: 'Passport.js', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Custom Middleware',
            description: 'Writing reusable middleware functions',
            resources: [
              { title: 'Writing Middleware', url: 'https://expressjs.com/en/guide/writing-middleware.html', type: 'documentation', platform: 'Express.js', isFree: true }
            ],
            estimatedTime: 5
          }
        ]
      }
    ];

    return {
      nodes,
      edges: [
        { from: 'nodejs-basics', to: 'express-basics', type: 'related', strength: 1 },
        { from: 'nodejs-basics', to: 'npm-modules', type: 'related', strength: 0.8 },
        { from: 'express-basics', to: 'express-middleware', type: 'related', strength: 1 },
        { from: 'express-basics', to: 'express-routing', type: 'related', strength: 0.9 },
        { from: 'express-middleware', to: 'database-integration', type: 'related', strength: 0.8 }
      ],
      skillPath: ['nodejs-basics', 'express-basics', 'express-middleware']
    };
  }
  private generateFlaskKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'python-web-basics',
        title: 'Python Web Basics',
        description: 'HTTP, web servers, and Python web frameworks',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 200, y: 100 },
        connections: ['flask-setup', 'flask-routing'],
        miniTopics: [
          {
            title: 'HTTP & Web Servers',
            description: 'Understanding HTTP protocol and web server concepts',
            resources: [
              { title: 'HTTP Basics', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'WSGI Protocol',
            description: 'Web Server Gateway Interface for Python',
            resources: [
              { title: 'WSGI Specification', url: 'https://wsgi.readthedocs.io/en/latest/', type: 'documentation', platform: 'WSGI', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Virtual Environments',
            description: 'Python virtual environments for project isolation',
            resources: [
              { title: 'Virtual Environments', url: 'https://docs.python.org/3/tutorial/venv.html', type: 'documentation', platform: 'Python', isFree: true }
            ],
            estimatedTime: 6
          }
        ]
      },
      {
        id: 'flask-setup',
        title: 'Flask Setup & Configuration',
        description: 'Installing and configuring Flask applications',
        category: 'core',
        difficulty: 'beginner',
        estimatedTime: 12,
        position: { x: 200, y: 250 },
        connections: ['flask-routing', 'flask-templates'],
        miniTopics: [
          {
            title: 'Flask Installation',
            description: 'Installing Flask and setting up a basic app',
            resources: [
              { title: 'Flask Installation', url: 'https://flask.palletsprojects.com/en/2.3.x/installation/', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Application Factory',
            description: 'Creating Flask applications with factory pattern',
            resources: [
              { title: 'Application Factories', url: 'https://flask.palletsprojects.com/en/2.3.x/patterns/appfactories/', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Configuration Management',
            description: 'Managing Flask app configurations',
            resources: [
              { title: 'Configuration Handling', url: 'https://flask.palletsprojects.com/en/2.3.x/config/', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'flask-routing',
        title: 'Flask Routing & Views',
        description: 'URL routing, view functions, and HTTP methods',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 18,
        position: { x: 100, y: 400 },
        connections: ['flask-database', 'flask-authentication'],
        miniTopics: [
          {
            title: 'Basic Routing',
            description: 'Defining routes and view functions',
            resources: [
              { title: 'Routing', url: 'https://flask.palletsprojects.com/en/2.3.x/quickstart/#routing', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'URL Variables',
            description: 'Dynamic URL routing with variables',
            resources: [
              { title: 'URL Variables', url: 'https://flask.palletsprojects.com/en/2.3.x/quickstart/#variable-rules', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'HTTP Methods',
            description: 'GET, POST, PUT, DELETE methods in Flask',
            resources: [
              { title: 'HTTP Methods', url: 'https://flask.palletsprojects.com/en/2.3.x/quickstart/#http-methods', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Error Handling',
            description: 'Custom error pages and error handlers',
            resources: [
              { title: 'Error Handling', url: 'https://flask.palletsprojects.com/en/2.3.x/errorhandling/', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 4
          }
        ],
        projectMilestone: {
          title: 'Flask Blog API',
          description: 'Build a REST API for a blog with CRUD operations for posts and comments',
          difficulty: 'intermediate',
          deliverables: ['Route definitions', 'Request/response handling', 'Error handling', 'API documentation'],
          estimatedTime: 20
        }
      },
      {
        id: 'flask-templates',
        title: 'Flask Templates & Forms',
        description: 'Jinja2 templates and WTForms for user input',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 300, y: 400 },
        connections: ['flask-database', 'flask-deployment'],
        miniTopics: [
          {
            title: 'Jinja2 Templates',
            description: 'Template rendering with Jinja2',
            resources: [
              { title: 'Templates', url: 'https://flask.palletsprojects.com/en/2.3.x/templating/', type: 'documentation', platform: 'Flask', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Template Inheritance',
            description: 'Base templates and template extending',
            resources: [
              { title: 'Template Inheritance', url: 'https://jinja.palletsprojects.com/en/3.1.x/templates/#template-inheritance', type: 'documentation', platform: 'Jinja2', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'WTForms Integration',
            description: 'Form handling with Flask-WTF',
            resources: [
              { title: 'Flask-WTF', url: 'https://flask-wtf.readthedocs.io/en/1.0.x/', type: 'documentation', platform: 'Flask-WTF', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Form Validation',
            description: 'Client and server-side form validation',
            resources: [
              { title: 'Form Validation', url: 'https://flask-wtf.readthedocs.io/en/1.0.x/quickstart/#validating-forms', type: 'documentation', platform: 'Flask-WTF', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      }
    ];

    return {
      nodes,
      edges: [
        { from: 'python-web-basics', to: 'flask-setup', type: 'related', strength: 1 },
        { from: 'flask-setup', to: 'flask-routing', type: 'related', strength: 1 },
        { from: 'flask-setup', to: 'flask-templates', type: 'related', strength: 1 },
        { from: 'flask-routing', to: 'flask-templates', type: 'related', strength: 0.8 }
      ],
      skillPath: ['python-web-basics', 'flask-setup', 'flask-routing', 'flask-templates']
    };
  }
  private generateDjangoKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'django-basics',
        title: 'Django Fundamentals',
        description: 'MVC pattern, Django project structure, and core concepts',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 20,
        position: { x: 200, y: 100 },
        connections: ['django-models', 'django-views'],
        miniTopics: [
          {
            title: 'Django Installation',
            description: 'Installing Django and creating a project',
            resources: [
              { title: 'Getting Started', url: 'https://docs.djangoproject.com/en/4.2/intro/tutorial01/', type: 'tutorial', platform: 'Django', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Project Structure',
            description: 'Understanding Django apps and project layout',
            resources: [
              { title: 'Project Structure', url: 'https://docs.djangoproject.com/en/4.2/intro/tutorial01/#creating-a-project', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Settings & Configuration',
            description: 'Django settings.py and configuration management',
            resources: [
              { title: 'Settings', url: 'https://docs.djangoproject.com/en/4.2/topics/settings/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Django Admin',
            description: 'Built-in admin interface for data management',
            resources: [
              { title: 'Admin Interface', url: 'https://docs.djangoproject.com/en/4.2/intro/tutorial02/#introducing-the-django-admin', type: 'tutorial', platform: 'Django', isFree: true }
            ],
            estimatedTime: 4
          }
        ]
      },
      {
        id: 'django-models',
        title: 'Django Models & ORM',
        description: 'Database models, migrations, and Django ORM',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 100, y: 250 },
        connections: ['django-views', 'django-templates'],
        miniTopics: [
          {
            title: 'Model Definition',
            description: 'Creating Django models with fields and relationships',
            resources: [
              { title: 'Models', url: 'https://docs.djangoproject.com/en/4.2/topics/db/models/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Database Migrations',
            description: 'Creating and applying database schema changes',
            resources: [
              { title: 'Migrations', url: 'https://docs.djangoproject.com/en/4.2/topics/migrations/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'QuerySets & Managers',
            description: 'Querying data with Django ORM',
            resources: [
              { title: 'QuerySets', url: 'https://docs.djangoproject.com/en/4.2/topics/db/queries/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'Model Relationships',
            description: 'Foreign keys, many-to-many, and one-to-one relationships',
            resources: [
              { title: 'Relationships', url: 'https://docs.djangoproject.com/en/4.2/topics/db/examples/many_to_many/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 4
          }
        ],
        projectMilestone: {
          title: 'Django Blog Models',
          description: 'Create a complete blog data model with users, posts, categories, and comments',
          difficulty: 'intermediate',
          deliverables: ['User model', 'Post model with relationships', 'Database migrations', 'Admin interface setup'],
          estimatedTime: 18
        }
      },
      {
        id: 'django-views',
        title: 'Django Views & URLs',
        description: 'Function-based and class-based views, URL configuration',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 300, y: 250 },
        connections: ['django-templates', 'django-forms'],
        miniTopics: [
          {
            title: 'Function-Based Views',
            description: 'Creating views as Python functions',
            resources: [
              { title: 'Views', url: 'https://docs.djangoproject.com/en/4.2/topics/http/views/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Class-Based Views',
            description: 'Using Django generic views and mixins',
            resources: [
              { title: 'Class-Based Views', url: 'https://docs.djangoproject.com/en/4.2/topics/class-based-views/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'URL Configuration',
            description: 'URL patterns and path converters',
            resources: [
              { title: 'URL Dispatcher', url: 'https://docs.djangoproject.com/en/4.2/topics/http/urls/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'View Decorators',
            description: 'Using decorators for authentication and permissions',
            resources: [
              { title: 'Decorators', url: 'https://docs.djangoproject.com/en/4.2/topics/http/decorators/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 3
          }
        ]
      },
      {
        id: 'django-templates',
        title: 'Django Templates',
        description: 'Template language, context processors, and template inheritance',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 15,
        position: { x: 200, y: 400 },
        connections: ['django-forms', 'django-deployment'],
        miniTopics: [
          {
            title: 'Template Syntax',
            description: 'Variables, tags, filters, and template language',
            resources: [
              { title: 'Templates', url: 'https://docs.djangoproject.com/en/4.2/topics/templates/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Template Inheritance',
            description: 'Base templates and template extending',
            resources: [
              { title: 'Template Inheritance', url: 'https://docs.djangoproject.com/en/4.2/ref/templates/language/#template-inheritance', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Context Processors',
            description: 'Adding common data to all templates',
            resources: [
              { title: 'Context Processors', url: 'https://docs.djangoproject.com/en/4.2/ref/templates/api/#using-context-processors', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 3
          },
          {
            title: 'Static Files',
            description: 'Managing CSS, JavaScript, and media files',
            resources: [
              { title: 'Static Files', url: 'https://docs.djangoproject.com/en/4.2/howto/static-files/', type: 'documentation', platform: 'Django', isFree: true }
            ],
            estimatedTime: 3
          }
        ],
        projectMilestone: {
          title: 'Django Blog Frontend',
          description: 'Create templates for a blog with posts, categories, and user profiles',
          difficulty: 'intermediate',
          deliverables: ['Base templates', 'Post templates', 'Navigation', 'Static file management'],
          estimatedTime: 15
        }
      }
    ];

    return {
      nodes,
      edges: [
        { from: 'django-basics', to: 'django-models', type: 'related', strength: 1 },
        { from: 'django-basics', to: 'django-views', type: 'related', strength: 1 },
        { from: 'django-models', to: 'django-templates', type: 'related', strength: 0.9 },
        { from: 'django-views', to: 'django-templates', type: 'related', strength: 1 },
        { from: 'django-models', to: 'django-views', type: 'related', strength: 0.8 }
      ],
      skillPath: ['django-basics', 'django-models', 'django-views', 'django-templates']
    };
  }
  private generateReactKnowledgeGraph(currentSkills: Set<string>): KnowledgeGraphData {
    const nodes: KnowledgeNode[] = [
      {
        id: 'javascript-fundamentals',
        title: 'JavaScript Fundamentals',
        description: 'Core JavaScript concepts required for React',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 20,
        position: { x: 200, y: 100 },
        connections: ['html-css-basics', 'react-basics'],
        miniTopics: [
          {
            title: 'Variables & Data Types',
            description: 'Understanding JavaScript variables, strings, numbers',
            resources: [
              { title: 'JavaScript Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps', type: 'tutorial', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 5
          },
          {
            title: 'Functions & Scope',
            description: 'Function declarations, arrow functions, closures',
            resources: [
              { title: 'JavaScript Functions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions', type: 'documentation', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'ES6+ Features',
            description: 'Modern JavaScript: destructuring, promises, async/await',
            resources: [
              { title: 'ES6 Tutorial', url: 'https://www.javascripttutorial.net/es6/', type: 'tutorial', platform: 'JavaScript Tutorial', isFree: true }
            ],
            estimatedTime: 7
          }
        ]
      },
      {
        id: 'html-css-basics',
        title: 'HTML & CSS for React',
        description: 'Essential HTML and CSS knowledge',
        category: 'foundation',
        difficulty: 'beginner',
        estimatedTime: 15,
        position: { x: 400, y: 100 },
        connections: ['react-basics'],
        miniTopics: [
          {
            title: 'HTML Structure',
            description: 'Semantic HTML, document structure',
            resources: [
              { title: 'HTML Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML', type: 'tutorial', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'CSS Fundamentals',
            description: 'Selectors, box model, flexbox',
            resources: [
              { title: 'CSS Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps', type: 'tutorial', platform: 'MDN', isFree: true }
            ],
            estimatedTime: 9
          }
        ]
      },
      {
        id: 'react-basics',
        title: 'React Fundamentals',
        description: 'Core React concepts and components',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 25,
        position: { x: 200, y: 250 },
        connections: ['react-hooks', 'react-state'],
        miniTopics: [
          {
            title: 'JSX Syntax',
            description: 'Writing JSX, component structure',
            resources: [
              { title: 'Introducing JSX', url: 'https://react.dev/learn/writing-markup-with-jsx', type: 'tutorial', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 4
          },
          {
            title: 'Components & Props',
            description: 'Creating components, passing props',
            resources: [
              { title: 'Components and Props', url: 'https://react.dev/learn/passing-props-to-a-component', type: 'tutorial', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'Component Lifecycle',
            description: 'Mounting, updating, unmounting',
            resources: [
              { title: 'React Lifecycle', url: 'https://react.dev/learn/react-developer-tools', type: 'documentation', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Conditional Rendering',
            description: 'Rendering components based on state',
            resources: [
              { title: 'Conditional Rendering', url: 'https://react.dev/learn/conditional-rendering', type: 'tutorial', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 7
          }
        ],
        projectMilestone: {
          title: 'Todo App with React',
          description: 'Build a complete todo application with add, edit, delete, and filter functionality',
          difficulty: 'intermediate',
          deliverables: ['Component architecture', 'State management', 'Event handling', 'UI styling'],
          estimatedTime: 15
        }
      },
      {
        id: 'react-hooks',
        title: '🔥 Interview HOT! Advanced Hooks',
        description: 'Modern React state management with hooks',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 20,
        position: { x: 100, y: 400 },
        connections: ['react-advanced'],
        miniTopics: [
          {
            title: 'useState Hook',
            description: 'Managing component state',
            resources: [
              { title: 'Using the State Hook', url: 'https://react.dev/reference/react/useState', type: 'documentation', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'useEffect Hook',
            description: 'Handling side effects and lifecycle',
            resources: [
              { title: 'Using the Effect Hook', url: 'https://react.dev/reference/react/useEffect', type: 'documentation', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 7
          },
          {
            title: 'Custom Hooks',
            description: 'Creating reusable hook logic',
            resources: [
              { title: 'Building Your Own Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks', type: 'tutorial', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 7
          }
        ]
      },
      {
        id: 'react-state',
        title: '🔥 Interview HOT! State & useEffect',
        description: 'Advanced state management patterns',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 25,
        position: { x: 300, y: 400 },
        connections: ['react-advanced'],
        miniTopics: [
          {
            title: 'Context API',
            description: 'React context for global state',
            resources: [
              { title: 'Context', url: 'https://react.dev/reference/react/createContext', type: 'documentation', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 8
          },
          {
            title: 'State Lifting',
            description: 'Sharing state between components',
            resources: [
              { title: 'Lifting State Up', url: 'https://react.dev/learn/sharing-state-between-components', type: 'tutorial', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 6
          },
          {
            title: 'Performance Optimization',
            description: 'Memoization, lazy loading',
            resources: [
              { title: 'Optimizing Performance', url: 'https://react.dev/learn/render-and-commit', type: 'documentation', platform: 'React Docs', isFree: true }
            ],
            estimatedTime: 11
          }
        ],
        projectMilestone: {
          title: 'E-commerce Product Catalog',
          description: 'Build a product catalog with shopping cart, filtering, and search',
          difficulty: 'advanced',
          deliverables: ['Complex state management', 'Performance optimization', 'Advanced component patterns', 'API integration'],
          estimatedTime: 25
        }
      }
    ];

    return {
      nodes,
      edges: [
        { from: 'javascript-fundamentals', to: 'html-css-basics', type: 'related', strength: 0.8 },
        { from: 'javascript-fundamentals', to: 'react-basics', type: 'related', strength: 1 },
        { from: 'html-css-basics', to: 'react-basics', type: 'related', strength: 1 },
        { from: 'react-basics', to: 'react-hooks', type: 'related', strength: 1 },
        { from: 'react-basics', to: 'react-state', type: 'related', strength: 0.9 },
        { from: 'react-hooks', to: 'react-advanced', type: 'related', strength: 0.8 },
        { from: 'react-state', to: 'react-advanced', type: 'related', strength: 0.8 }
      ],
      skillPath: ['javascript-fundamentals', 'html-css-basics', 'react-basics', 'react-hooks', 'react-state']
    };
  }
}

// Enhanced skill extraction from job descriptions using advanced pattern matching
function extractSkillsFromDescription(description: string): string[] {
  if (!description) return [];

  const lowerText = description.toLowerCase();
  const found = new Set<string>();

  // Extract text from specific sections
  const sections = extractSectionsFromJobDescription(description);

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
        // More strict filtering
        if (cleaned.length > 1 && cleaned.length < 30 && !cleaned.match(/^\d+$/)) {
          found.add(cleaned);
        }
      });
    }
  }
  
  // Remove common non-technical words that might have slipped through
  const nonTechnicalWords = [
    'minimum', 'maximum', 'years', 'experience', 'knowledge', 'understanding',
    'ability', 'skills', 'required', 'preferred', 'strong', 'excellent',
    'hours', 'length', 'time', 'week', 'month', 'year', 'day',
    'must', 'have', 'should', 'will', 'can', 'need', 'want'
  ];
  
  nonTechnicalWords.forEach(word => found.delete(word));

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

  // Known technical skill keywords to look for
  const technicalKeywords = [
    // Programming languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    // Frameworks
    'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring', 'laravel', 'rails',
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'dynamodb', 'elasticsearch',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
    // Tools
    'git', 'jira', 'figma', 'postman', 'graphql', 'rest', 'api', 'microservices',
    // AI/ML
    'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy',
    // Frontend
    'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'redux',
    // Mobile
    'ios', 'android', 'flutter', 'react native',
    // Testing
    'jest', 'mocha', 'cypress', 'selenium', 'pytest', 'testing',
    // Other
    'linux', 'bash', 'agile', 'scrum'
  ];

  // Look for bullet points and numbered lists
  const bulletPoints = sectionText.split(/[•\-\*\d+\.]\s*/).filter(item => item.trim().length > 0);

  for (const bullet of bulletPoints) {
    if (bullet.length < 150) { // Skip very long bullets
      const bulletLower = bullet.toLowerCase();
      
      // Only extract if the bullet contains technical keywords
      const hasTechnicalContent = technicalKeywords.some(keyword => bulletLower.includes(keyword));
      
      if (hasTechnicalContent) {
        // Extract only words that match technical patterns
        const skillMatches = bullet.match(/\b[a-z][a-z\s\-\+#\.]+[a-z]\b/gi);
        if (skillMatches) {
          skillMatches.forEach(match => {
            const cleaned = match.toLowerCase().trim();
            
            // Filter out common English words and non-technical terms
            const commonWords = [
              'minimum', 'maximum', 'years', 'experience', 'knowledge', 'understanding',
              'ability', 'skills', 'required', 'preferred', 'strong', 'excellent',
              'good', 'working', 'proficient', 'familiar', 'expertise', 'background',
              'degree', 'bachelor', 'master', 'education', 'certification', 'certified',
              'team', 'work', 'environment', 'development', 'software', 'application',
              'system', 'design', 'implementation', 'integration', 'testing', 'deployment',
              'hours', 'length', 'time', 'week', 'month', 'year', 'day',
              'must', 'have', 'should', 'will', 'can', 'able', 'need', 'want',
              'plus', 'bonus', 'nice', 'ideal', 'looking', 'seeking', 'hiring',
              'position', 'role', 'job', 'opportunity', 'career', 'company', 'organization'
            ];
            
            // Only add if it's a technical keyword or contains technical terms
            const isTechnical = technicalKeywords.some(keyword => cleaned.includes(keyword));
            const isCommonWord = commonWords.includes(cleaned);
            
            if (isTechnical && !isCommonWord && cleaned.length > 2 && cleaned.length < 30) {
              foundSkills.add(cleaned);
            }
          });
        }
      }
    }
  }
}
// Enhanced skill gap analysis with better context and prioritization
export async function computeSkillGaps(
  resumeSkills: string[],
  jobs: JobItem[],
  topN = 5
): Promise<SkillGapItem[]> {
  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase().trim()));

  const freq = new Map<string, number>();
  const skillContext = new Map<string, string[]>(); // Store which jobs mention each skill
  const skillImportance = new Map<string, number>(); // Track skill importance scores

  // Real-time skill extraction from job descriptions
  for (const job of jobs) {
    let jobSkills = job.skillsRequired || [];

    // If no skills provided, extract from description in real-time
    if (jobSkills.length === 0 && job.description) {
      jobSkills = extractSkillsFromDescription(job.description);
    }

    // Also extract from title if available
    if (job.title) {
      const titleSkills = extractSkillsFromDescription(job.title);
      jobSkills = [...new Set([...jobSkills, ...titleSkills])];
    }

    // Weight skills by job relevance (more relevant jobs get higher weight)
    const jobWeight = job.relevanceScore ? job.relevanceScore / 100 : 1;

    for (const skill of jobSkills) {
      const key = skill.toLowerCase().trim();
      if (!key || resumeSet.has(key)) continue;

      // Weighted frequency based on job relevance
      freq.set(key, (freq.get(key) || 0) + jobWeight);

      // Track skill importance (combine frequency with job relevance)
      const currentImportance = skillImportance.get(key) || 0;
      skillImportance.set(key, currentImportance + jobWeight);

      // Track which jobs mention this skill for better context
      if (!skillContext.has(key)) {
        skillContext.set(key, []);
      }
      const context = skillContext.get(key)!;
      if (job.title && !context.includes(job.title)) {
        context.push(job.title);
      }
    }
  }

  // Sort by importance score (frequency weighted by job relevance)
  const entries = Array.from(skillImportance.entries()).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, topN);

  const maxImportance = top[0]?.[1] || 1;
  const totalJobs = jobs.length;
  const relevantJobs = jobs.filter(job => (job.relevanceScore || 0) >= 30).length;

  // Initialize knowledge graph for learning paths
  const knowledgeGraph = new KnowledgeGraph();

  // Use Promise.all to generate learning paths in parallel
  const gapsWithPaths = await Promise.all(
    top.map(async ([skill, importanceScore], index) => {
      const rawFreq = freq.get(skill) || 0;
      const ratio = importanceScore / maxImportance;

      let priority: "high" | "medium" | "low" = "low";

      // Enhanced priority calculation
      if (index === 0 || ratio >= 0.8 || importanceScore >= relevantJobs * 0.6) {
        priority = "high";
      } else if (ratio >= 0.4 || importanceScore >= relevantJobs * 0.3) {
        priority = "medium";
      }

      const context = skillContext.get(skill) || [];
      const contextText = context.length > 0
        ? ` Required for roles like: ${context.slice(0, 2).join(", ")}.`
        : "";

      // Calculate percentage based on raw frequency
      const percentage = ((rawFreq / totalJobs) * 100).toFixed(1);
      const reason = `Missing in ${Math.round(rawFreq)} relevant job${Math.round(rawFreq) !== 1 ? 's' : ''} (${percentage}% of positions).${contextText}`;

      // Generate learning path using knowledge graph (now async)
      const learningPath = await knowledgeGraph.generateLearningPath(skill, resumeSkills);

      return {
        skill,
        priority,
        reason,
        learningPath: learningPath || undefined
      };
    })
  );

  return gapsWithPaths;
}