# Knowledge Graph Generation - Complete Workflow

## 🎯 Overview: From Skill Gap to Knowledge Graph

This document explains **step-by-step** how we generate a knowledge graph after detecting a skill gap.

---

## 📊 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: SKILL GAP DETECTED                                      │
│ Input: "React" (missing skill)                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: KNOWLEDGE GRAPH LOOKUP                                  │
│ Check: Is "React" in hardcoded database?                        │
│                                                                  │
│ File: backend/src/services/skillGapEngine.ts                    │
│ Method: KnowledgeGraph.generateLearningPath()                   │
└────────────┬───────────────────────────┬────────────────────────┘
             │ YES (50+ skills)          │ NO (unknown skill)
             ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│ PATH A: HARDCODED        │   │ PATH B: LLM GENERATION       │
│ Use pre-built graph      │   │ Call Groq API                │
└────────────┬─────────────┘   └────────────┬─────────────────┘
             │                               │
             └───────────────┬───────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: RAW KNOWLEDGE GRAPH DATA                                │
│ Output: { nodes: [...], edges: [...] }                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: GRAPH VALIDATION & ENHANCEMENT                          │
│ - Ensure all nodes connected                                    │
│ - Add missing edges                                             │
│ - Calculate positions                                            │
│ - Validate structure                                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: CATEGORIZATION & ORDERING                               │
│ - Assign categories (foundation/core/advanced)                  │
│ - Determine difficulty levels                                   │
│ - Calculate time estimates                                      │
│ - Create skill path (topological sort)                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: RESOURCE ENRICHMENT                                     │
│ - Add learning resources (URLs)                                 │
│ - Add mini-topics                                               │
│ - Add project milestones                                        │
│ - Add practice exercises                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: FINAL KNOWLEDGE GRAPH                                   │
│ Output: Complete learning path with visualization data          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 STEP 1: Skill Gap Detected

### Input:
```json
{
  "skill": "React",
  "priority": "high",
  "reason": "Required by 15 out of 30 jobs"
}
```

### What Happens:
```typescript
// File: backend/src/services/skillGapController.ts

export async function skillGapHandler(req, res) {
  // 1. Compute skill gaps
  const gaps = await computeSkillGaps(resumeSkills, jobs, topN);
  
  // 2. For each gap, generate learning path
  const prioritizedGaps = await Promise.all(
    gaps.map(async (gap) => {
      // 🔥 THIS IS WHERE KNOWLEDGE GRAPH GENERATION STARTS
      const learningPath = await knowledgeGraph.generateLearningPath(
        gap.skill,      // "React"
        resumeSkills    // ["JavaScript", "HTML", "CSS"]
      );
      
      return { ...gap, learningPath };
    })
  );
}
```

---

## 🔍 STEP 2: Knowledge Graph Lookup

### Decision Point: Hardcoded vs LLM

```typescript
// File: backend/src/services/skillGapEngine.ts

export class KnowledgeGraph {
  async generateLearningPath(skill: string, currentSkills: string[]) {
    const normalizedSkill = skill.toLowerCase().trim();
    
    // 🔍 CHECK: Is skill in our database?
    if (this.hasHardcodedGraph(normalizedSkill)) {
      // ✅ PATH A: Use hardcoded knowledge graph
      return this.getHardcodedGraph(normalizedSkill, currentSkills);
    } else {
      // ✅ PATH B: Generate using LLM
      return this.generateDynamicGraph(skill, currentSkills);
    }
  }
  
  private hasHardcodedGraph(skill: string): boolean {
    const supportedSkills = [
      'react', 'vue', 'angular', 'javascript', 'typescript',
      'python', 'java', 'node.js', 'docker', 'kubernetes',
      'aws', 'mongodb', 'sql', 'machine learning',
      // ... 50+ more skills
    ];
    return supportedSkills.includes(skill);
  }
}
```

---

## 🔍 PATH A: Hardcoded Knowledge Graph

### How Hardcoded Graphs Are Structured

```typescript
// File: backend/src/services/skillGapEngine.ts (lines 100-8000)

private getHardcodedGraph(skill: string, currentSkills: string[]) {
  
  // Example: React Knowledge Graph
  if (skill === 'react') {
    
    // 1️⃣ DEFINE NODES (Concepts)
    const nodes: KnowledgeNode[] = [
      {
        id: 'react-basics',
        title: 'React Fundamentals',
        description: 'Core concepts of React library',
        category: 'foundation',        // ← Categorization
        difficulty: 'beginner',        // ← Difficulty level
        estimatedTime: 8,              // ← Time estimate (hours)
        position: { x: 200, y: 100 },  // ← Visualization position
        connections: ['react-components', 'jsx-syntax'],  // ← Graph edges
        
        // 2️⃣ SUB-TOPICS (Mini knowledge nodes)
        miniTopics: [
          {
            title: 'JSX Syntax',
            description: 'Learn JSX templating language',
            estimatedTime: 2,
            
            // 3️⃣ RESOURCES (Where to learn)
            resources: [
              {
                title: 'Official React Documentation',
                url: 'https://react.dev/learn',
                type: 'documentation',
                platform: 'React.dev',
                isFree: true
              },
              {
                title: 'React Tutorial for Beginners',
                url: 'https://www.youtube.com/watch?v=...',
                type: 'tutorial',
                platform: 'YouTube',
                isFree: true
              }
            ]
          },
          {
            title: 'Components',
            description: 'Building blocks of React',
            estimatedTime: 3,
            resources: [...]
          }
        ],
        
        // 4️⃣ PROJECT MILESTONE (Practice)
        projectMilestone: {
          title: 'Build a Todo App',
          description: 'Create your first React application',
          difficulty: 'beginner',
          deliverables: [
            'Working React app',
            'Component-based structure',
            'State management',
            'Clean code'
          ],
          estimatedTime: 5
        }
      },
      
      // More nodes...
      {
        id: 'react-hooks',
        title: 'React Hooks',
        category: 'core',
        difficulty: 'intermediate',
        estimatedTime: 10,
        position: { x: 400, y: 100 },
        connections: ['react-basics', 'state-management'],
        miniTopics: [...],
        projectMilestone: {...}
      },
      
      {
        id: 'react-advanced',
        title: 'Advanced React Patterns',
        category: 'advanced',
        difficulty: 'advanced',
        estimatedTime: 12,
        position: { x: 600, y: 100 },
        connections: ['react-hooks', 'performance'],
        miniTopics: [...],
        projectMilestone: {...}
      }
    ];
    
    // 5️⃣ DEFINE EDGES (Relationships)
    const edges = [
      {
        from: 'react-basics',
        to: 'react-hooks',
        type: 'prerequisite',  // Must learn basics before hooks
        strength: 1.0
      },
      {
        from: 'react-hooks',
        to: 'react-advanced',
        type: 'prerequisite',
        strength: 0.9
      },
      {
        from: 'react-hooks',
        to: 'custom-hooks',
        type: 'related',       // Can learn together
        strength: 0.7
      }
    ];
    
    // 6️⃣ DEFINE SKILL PATH (Learning order)
    const skillPath = [
      'react-basics',
      'react-hooks',
      'react-context',
      'react-advanced',
      'react-performance'
    ];
    
    // 7️⃣ RETURN COMPLETE KNOWLEDGE GRAPH
    return {
      skill: 'React',
      totalTime: 40,
      difficulty: 'intermediate',
      nodes: nodes,
      knowledgeGraph: {
        nodes: nodes,
        edges: edges,
        skillPath: skillPath
      },
      roadmap: this.generateRoadmap(nodes),
      milestones: this.generateMilestones(nodes)
    };
  }
}
```

### Categorization Logic (Hardcoded)

```typescript
// How we categorize nodes:

// 1. FOUNDATION (Basics)
category: 'foundation'
- First concepts to learn
- No prerequisites
- Beginner difficulty
- Examples: "React Basics", "JavaScript Fundamentals"

// 2. CORE (Main concepts)
category: 'core'
- Essential features
- Requires foundation
- Intermediate difficulty
- Examples: "React Hooks", "State Management"

// 3. ADVANCED (Expert level)
category: 'advanced'
- Complex patterns
- Requires core knowledge
- Advanced difficulty
- Examples: "Performance Optimization", "Advanced Patterns"

// 4. SPECIALIZATION (Niche topics)
category: 'specialization'
- Specific use cases
- Optional but valuable
- Advanced difficulty
- Examples: "Server-Side Rendering", "React Native"
```

---

## 🔍 PATH B: LLM-Generated Knowledge Graph

### When Used:
- Skill not in hardcoded database (e.g., "Svelte", "Elixir", "Rust")
- New/emerging technologies
- Niche frameworks

### Technology: Groq API + Llama 3.3 70B

```typescript
// File: backend/src/services/llmKnowledgeGraphGenerator.ts

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY  // From .env file
});

export async function generateLLMKnowledgeGraph(
  skill: string,
  currentSkills: string[]
) {
  
  // 1️⃣ CONSTRUCT PROMPT
  const prompt = `
You are an expert learning path designer. Generate a comprehensive knowledge graph for learning "${skill}".

Current user skills: ${currentSkills.join(', ')}

Generate a JSON knowledge graph with:
1. 5-7 learning nodes (concepts)
2. Each node should have:
   - id, title, description
   - category (foundation/core/advanced/specialization)
   - difficulty (beginner/intermediate/advanced)
   - estimatedTime (hours)
   - 3-5 miniTopics with resources
   - projectMilestone
3. Edges showing prerequisites
4. Ordered skill path

Format as valid JSON.
`;

  // 2️⃣ CALL GROQ API
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",  // ← LLM Model
    messages: [
      {
        role: "system",
        content: "You are an expert at creating structured learning paths."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,      // Creativity level
    max_tokens: 4000,      // Response length
    response_format: { type: "json_object" }  // Force JSON output
  });
  
  // 3️⃣ PARSE LLM RESPONSE
  const rawContent = response.choices[0].message.content;
  const llmGraph = JSON.parse(rawContent);
  
  // 4️⃣ VALIDATE & STRUCTURE
  const knowledgeGraph = {
    nodes: llmGraph.nodes.map(node => ({
      id: node.id,
      title: node.title,
      description: node.description,
      category: node.category,
      difficulty: node.difficulty,
      estimatedTime: node.estimatedTime,
      position: calculatePosition(node),  // Auto-calculate
      connections: extractConnections(node, llmGraph.edges),
      miniTopics: node.miniTopics || [],
      projectMilestone: node.projectMilestone || generateDefaultProject(node)
    })),
    edges: llmGraph.edges || [],
    skillPath: llmGraph.skillPath || []
  };
  
  // 5️⃣ RETURN STRUCTURED GRAPH
  return {
    skill: skill,
    totalTime: calculateTotalTime(knowledgeGraph.nodes),
    difficulty: determineDifficulty(knowledgeGraph.nodes),
    nodes: knowledgeGraph.nodes,
    knowledgeGraph: knowledgeGraph,
    roadmap: generateRoadmap(knowledgeGraph.nodes),
    milestones: generateMilestones(knowledgeGraph.nodes)
  };
}
```

### LLM Response Example:

```json
{
  "nodes": [
    {
      "id": "svelte-basics",
      "title": "Svelte Fundamentals",
      "description": "Core concepts of Svelte framework",
      "category": "foundation",
      "difficulty": "beginner",
      "estimatedTime": 6,
      "miniTopics": [
        {
          "title": "Reactive Declarations",
          "description": "Understanding Svelte's reactivity",
          "resources": [
            {
              "title": "Svelte Tutorial",
              "url": "https://svelte.dev/tutorial",
              "type": "tutorial",
              "isFree": true
            }
          ]
        }
      ],
      "projectMilestone": {
        "title": "Build a Counter App",
        "description": "Create your first Svelte app",
        "deliverables": ["Working app", "Reactive state"]
      }
    }
  ],
  "edges": [
    {
      "from": "svelte-basics",
      "to": "svelte-components",
      "type": "prerequisite"
    }
  ],
  "skillPath": ["svelte-basics", "svelte-components", "svelte-stores"]
}
```

---

## 🔍 STEP 3: Graph Validation & Enhancement

### Ensure All Nodes Connected

```typescript
// File: backend/src/services/skillGapEngine.ts

function ensureAllNodesConnected(
  nodes: KnowledgeNode[],
  edges: Edge[]
): Edge[] {
  
  const enhancedEdges = [...edges];
  const nodeIds = nodes.map(n => n.id);
  
  // 1️⃣ BUILD ADJACENCY LIST
  const adjacencyList = new Map<string, Set<string>>();
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.from)) {
      adjacencyList.set(edge.from, new Set());
    }
    adjacencyList.get(edge.from)!.add(edge.to);
  });
  
  // 2️⃣ FIND ISOLATED NODES (no connections)
  const isolatedNodes = nodes.filter(node => {
    const hasOutgoing = adjacencyList.has(node.id);
    const hasIncoming = edges.some(e => e.to === node.id);
    return !hasOutgoing && !hasIncoming;
  });
  
  // 3️⃣ CONNECT ISOLATED NODES
  isolatedNodes.forEach((node, index) => {
    if (index > 0) {
      // Connect to previous node
      enhancedEdges.push({
        from: nodes[index - 1].id,
        to: node.id,
        type: 'related',
        strength: 0.5
      });
    }
  });
  
  // 4️⃣ ADD EDGES FROM NODE CONNECTIONS
  nodes.forEach(node => {
    node.connections.forEach(targetId => {
      if (nodeIds.includes(targetId)) {
        const edgeExists = enhancedEdges.some(
          e => e.from === node.id && e.to === targetId
        );
        if (!edgeExists) {
          enhancedEdges.push({
            from: node.id,
            to: targetId,
            type: 'related',
            strength: 0.7
          });
        }
      }
    });
  });
  
  return enhancedEdges;
}
```

### Calculate Node Positions

```typescript
// For visualization in D3.js

function calculateNodePositions(nodes: KnowledgeNode[]): KnowledgeNode[] {
  
  // 1️⃣ GROUP BY CATEGORY
  const categories = {
    foundation: nodes.filter(n => n.category === 'foundation'),
    core: nodes.filter(n => n.category === 'core'),
    advanced: nodes.filter(n => n.category === 'advanced'),
    specialization: nodes.filter(n => n.category === 'specialization')
  };
  
  // 2️⃣ ASSIGN POSITIONS (Hierarchical layout)
  const width = 800;
  const height = 600;
  const levelHeight = height / 4;
  
  let yOffset = 100;
  
  Object.entries(categories).forEach(([category, categoryNodes]) => {
    const xSpacing = width / (categoryNodes.length + 1);
    
    categoryNodes.forEach((node, index) => {
      node.position = {
        x: xSpacing * (index + 1),
        y: yOffset
      };
    });
    
    yOffset += levelHeight;
  });
  
  return nodes;
}
```

---

## 🔍 STEP 4: Categorization & Ordering

### Automatic Categorization

```typescript
function categorizeNodes(nodes: KnowledgeNode[]): KnowledgeNode[] {
  
  // 1️⃣ ANALYZE DEPENDENCIES
  const dependencyCount = new Map<string, number>();
  
  nodes.forEach(node => {
    // Count how many nodes depend on this one
    const dependents = nodes.filter(n => 
      n.connections.includes(node.id)
    ).length;
    dependencyCount.set(node.id, dependents);
  });
  
  // 2️⃣ ASSIGN CATEGORIES BASED ON DEPENDENCIES
  return nodes.map(node => {
    const deps = dependencyCount.get(node.id) || 0;
    
    if (deps === 0 || node.connections.length === 0) {
      node.category = 'foundation';  // No dependencies = foundation
    } else if (deps >= 3) {
      node.category = 'core';         // Many dependents = core
    } else if (node.difficulty === 'advanced') {
      node.category = 'advanced';     // High difficulty = advanced
    } else {
      node.category = 'specialization';
    }
    
    return node;
  });
}
```

### Topological Sort (Learning Order)

```typescript
function createSkillPath(
  nodes: KnowledgeNode[],
  edges: Edge[]
): string[] {
  
  // 1️⃣ BUILD GRAPH
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });
  
  edges.filter(e => e.type === 'prerequisite').forEach(edge => {
    graph.get(edge.from)!.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  });
  
  // 2️⃣ TOPOLOGICAL SORT (Kahn's Algorithm)
  const queue: string[] = [];
  const result: string[] = [];
  
  // Start with nodes that have no prerequisites
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    
    graph.get(current)!.forEach(neighbor => {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }
  
  return result;  // Ordered learning path
}
```

---

## 🔍 STEP 5: Resource Enrichment

### Add Learning Resources

```typescript
function enrichWithResources(node: KnowledgeNode): KnowledgeNode {
  
  // If node already has resources, keep them
  if (node.miniTopics && node.miniTopics.length > 0) {
    return node;
  }
  
  // Otherwise, add default resources based on skill
  const skill = node.title.toLowerCase();
  
  node.miniTopics = [
    {
      title: `${node.title} Basics`,
      description: `Learn the fundamentals of ${node.title}`,
      estimatedTime: Math.ceil(node.estimatedTime * 0.4),
      resources: [
        {
          title: `Official ${node.title} Documentation`,
          url: `https://docs.${skill}.dev`,
          type: 'documentation',
          platform: 'Official',
          isFree: true
        },
        {
          title: `${node.title} Tutorial`,
          url: `https://www.youtube.com/results?search_query=${skill}+tutorial`,
          type: 'tutorial',
          platform: 'YouTube',
          isFree: true
        }
      ]
    }
  ];
  
  return node;
}
```

---

## 🔍 STEP 6: Final Knowledge Graph Output

### Complete Structure

```typescript
interface FinalLearningPath {
  skill: string;                    // "React"
  totalTime: number;                // 40 hours
  difficulty: string;               // "intermediate"
  
  // Knowledge Graph
  knowledgeGraph: {
    nodes: KnowledgeNode[];         // 5-10 concepts
    edges: Edge[];                  // Relationships
    skillPath: string[];            // Ordered learning path
  };
  
  // Additional views
  roadmap: RoadmapStep[];           // Linear step-by-step
  milestones: Milestone[];          // Progress markers
  parallelTracks: LearningPath[];   // Related skills
}
```

### Example Final Output:

```json
{
  "skill": "React",
  "totalTime": 40,
  "difficulty": "intermediate",
  "knowledgeGraph": {
    "nodes": [
      {
        "id": "react-basics",
        "title": "React Fundamentals",
        "category": "foundation",
        "difficulty": "beginner",
        "estimatedTime": 8,
        "position": { "x": 200, "y": 100 },
        "connections": ["react-hooks"],
        "miniTopics": [
          {
            "title": "JSX",
            "resources": [
              {
                "title": "React Docs",
                "url": "https://react.dev",
                "isFree": true
              }
            ]
          }
        ],
        "projectMilestone": {
          "title": "Todo App",
          "deliverables": ["Working app", "Clean code"]
        }
      }
    ],
    "edges": [
      {
        "from": "react-basics",
        "to": "react-hooks",
        "type": "prerequisite",
        "strength": 1.0
      }
    ],
    "skillPath": ["react-basics", "react-hooks", "react-advanced"]
  }
}
```

---

## 📊 Summary: Technologies & Techniques

### Technologies Used:
1. ✅ **TypeScript** - Type-safe graph structures
2. ✅ **Groq API** - LLM for dynamic generation (Llama 3.3 70B)
3. ✅ **Graph Algorithms** - Topological sort, DFS/BFS
4. ✅ **D3.js** - Interactive visualization
5. ✅ **JSON** - Data format

### Graph Theory Concepts:
1. ✅ **Nodes & Edges** - Basic graph structure
2. ✅ **Directed Acyclic Graph (DAG)** - No cycles
3. ✅ **Topological Sort** - Learning order
4. ✅ **Connected Components** - Ensure reachability
5. ✅ **Semantic Relationships** - Prerequisite vs related

### Categorization Methods:
1. ✅ **Dependency Analysis** - Count prerequisites
2. ✅ **Difficulty Levels** - Beginner/Intermediate/Advanced
3. ✅ **Category Hierarchy** - Foundation → Core → Advanced
4. ✅ **Time Estimation** - Hours per concept

### Data Sources:
1. ✅ **Hardcoded Graphs** - 50+ pre-built (8000+ lines)
2. ✅ **LLM Generation** - Dynamic for unknown skills
3. ✅ **Resource URLs** - Curated learning materials
4. ✅ **Project Ideas** - Practice milestones

This is a **complete, production-ready knowledge graph generation system**! 🚀
