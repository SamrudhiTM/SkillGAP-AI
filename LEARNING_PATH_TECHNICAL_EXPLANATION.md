# Learning Path Generation - Complete Technical Explanation

## 🎯 Overview

Our system generates personalized learning paths using a combination of:
1. **Hardcoded Knowledge Graphs** (50+ skills)
2. **LLM-Generated Dynamic Content** (Groq API with Llama 3.3 70B)
3. **Interview Priority Analysis**
4. **Timeline Distribution Algorithm**

---

## 📚 Part 1: How Learning Paths Are Generated

### Step 1: User Uploads Resume
```
User → Resume (PDF/TXT) → Backend Parser
```

**Technology Used:**
- **pdf-parse** (npm package) - Extracts text from PDF
- **Custom Resume Parser** (`resumeParser.ts`)
- **Skill Normalizer** - Standardizes skill names (React.js → react)

### Step 2: Skill Gap Analysis
```
Resume Skills + Job Descriptions → Skill Gap Engine → Missing Skills
```

**Technology Used:**
- **Regex Pattern Matching** - Extracts skills from job descriptions
- **Frequency Analysis** - Counts skill mentions across jobs
- **Weighted Scoring** - Prioritizes based on job relevance

**Code Location:** `backend/src/services/skillGapEngine.ts`

```typescript
// Example: Skill extraction
const skillPatterns = [
  /\b(javascript|typescript|python|java)\b/gi,
  /\b(react|vue|angular|nodejs)\b/gi,
  // ... 50+ patterns
];
```

### Step 3: Learning Path Generation

For each missing skill, we generate a complete learning path:

#### **Method A: Hardcoded Knowledge Graphs (Primary)**

**Technology:** Pre-built JSON-like structures in TypeScript

**Location:** `backend/src/services/skillGapEngine.ts` (lines 100-8000+)

**Example Structure:**
```typescript
const reactKnowledgeGraph = {
  nodes: [
    {
      id: 'react-basics',
      title: 'React Fundamentals',
      category: 'foundation',
      difficulty: 'beginner',
      estimatedTime: 8,
      miniTopics: [
        {
          title: 'JSX Syntax',
          description: 'Learn JSX templating',
          resources: [
            {
              title: 'Official React Docs',
              url: 'https://react.dev',
              type: 'documentation',
              isFree: true
            }
          ]
        }
      ],
      projectMilestone: {
        title: 'Build a Todo App',
        description: 'Create your first React application',
        deliverables: ['Working app', 'Clean code', 'Documentation']
      }
    }
    // ... 5-10 more nodes
  ],
  edges: [
    { from: 'react-basics', to: 'react-hooks', type: 'prerequisite' }
  ]
};
```

**We have hardcoded knowledge graphs for 50+ skills:**
- JavaScript, TypeScript, Python, Java, C++, Go, Rust
- React, Vue, Angular, Node.js, Express, Django, Flask
- SQL, MongoDB, PostgreSQL, Redis
- AWS, Docker, Kubernetes, Terraform
- Machine Learning, TensorFlow, PyTorch
- And more...

#### **Method B: LLM-Generated Content (Fallback)**

**Technology:** Groq API with Llama 3.3 70B Versatile model

**When Used:** For skills not in our hardcoded database

**Location:** `backend/src/services/llmKnowledgeGraphGenerator.ts`

**API Call:**
```typescript
const response = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content: "You are an expert learning path designer..."
    },
    {
      role: "user",
      content: `Generate a learning path for ${skill}...`
    }
  ],
  temperature: 0.7,
  max_tokens: 4000
});
```

**LLM Generates:**
- 5-7 knowledge nodes
- Sub-topics for each node
- Learning resources (URLs, tutorials)
- Project milestones
- Prerequisites and connections

**Environment Variable:**
```bash
GROQ_API_KEY=your_groq_api_key_here
```

---

## 🔥 Part 2: Interview Hot Topics Detection

### How We Identify "Interview Hot" Topics

**Technology:** Multi-factor scoring algorithm

**Location:** `backend/src/services/skillGapController.ts`

**Factors:**

#### 1. **Hardcoded Critical Skills List**
```typescript
const criticalSkills = [
  'javascript',
  'data structures',
  'algorithms',
  'system design'
];

const highSkills = [
  'react',
  'typescript',
  'python',
  'sql',
  'aws',
  'docker'
];
```

#### 2. **Job Market Frequency**
```typescript
// Skills mentioned in 60%+ of relevant jobs = High Priority
if (skillFrequency >= relevantJobs * 0.6) {
  priority = 'high';
  interviewImportance = 'critical';
}
```

#### 3. **Position in Skill Gap List**
```typescript
// Top 2 missing skills = High Priority
if (index < 2) {
  priority = 'high';
}
```

#### 4. **Salary Impact Analysis**
```typescript
// Skills with high salary correlation
const highSalarySkills = ['aws', 'kubernetes', 'machine learning'];
```

**Interview Importance Levels:**
- **Critical**: Data Structures, Algorithms, System Design, JavaScript
- **High**: React, TypeScript, Python, SQL, AWS, Docker
- **Medium**: Angular, Vue, Node.js, MongoDB
- **Low**: Other skills

---

## ⏱️ Part 3: Timeline Distribution

### How Topics Are Divided Into Weeks

**Technology:** Custom distribution algorithm

**Location:** `backend/src/services/learningTimelineGenerator.ts`

### Algorithm Steps:

#### Step 1: Calculate Total Weeks
```typescript
const durationWeeks = {
  '3-month': 12 weeks,
  '6-month': 24 weeks,
  '12-month': 48 weeks
};
```

#### Step 2: Distribute Knowledge Nodes
```typescript
const nodes = learningPath.knowledgeGraph.nodes; // e.g., 6 nodes
const totalWeeks = 12;
const nodesPerWeek = Math.ceil(nodes.length / totalWeeks); // 1 node per 2 weeks

// Week 1-2: Node 1 (Basics)
// Week 3-4: Node 2 (Intermediate)
// Week 5-6: Node 3 (Advanced)
// ...
```

#### Step 3: Assign Topics to Weeks
```typescript
for (let week = 1; week <= totalWeeks; week++) {
  const startIdx = (week - 1) * nodesPerWeek;
  const endIdx = Math.min(startIdx + nodesPerWeek, nodes.length);
  const weekNodes = nodes.slice(startIdx, endIdx);
  
  weeklyGoals.push({
    week,
    topics: weekNodes.map(n => n.title),
    hoursPerWeek: 10,
    miniProject: generateMiniProject(weekNodes)
  });
}
```

#### Step 4: Generate Mini Projects
```typescript
// Difficulty increases with progress
const progress = week / totalWeeks;
const difficulty = progress > 0.66 ? 'advanced' 
                 : progress > 0.33 ? 'intermediate' 
                 : 'beginner';

// Project complexity scales
const estimatedHours = {
  beginner: 3,
  intermediate: 5,
  advanced: 8
};
```

#### Step 5: Add Milestones
```typescript
// Automatic milestones at 25%, 50%, 75%, 100%
if (week === Math.floor(totalWeeks * 0.25)) {
  milestone = '🎯 25% Complete - Foundation Established';
}
```

---

## 🛠️ Technologies Used

### Backend Stack:
1. **Node.js** - Runtime environment
2. **TypeScript** - Type-safe JavaScript
3. **Express.js** - Web framework
4. **Groq API** - LLM for dynamic content generation
   - Model: Llama 3.3 70B Versatile
   - Temperature: 0.7
   - Max Tokens: 4000

### Key Libraries:
1. **pdf-parse** - PDF text extraction
2. **axios** - HTTP requests for job APIs
3. **cors** - Cross-origin resource sharing

### Frontend Stack:
1. **React** - UI framework
2. **TypeScript** - Type safety
3. **D3.js** - Knowledge graph visualization
4. **Vite** - Build tool

### Data Structures:
1. **Hash Maps** - Skill normalization (O(1) lookup)
2. **Graphs** - Knowledge graph representation
3. **Priority Queues** - Skill gap prioritization
4. **LRU Cache** - Performance optimization

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS RESUME                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. RESUME PARSING                                           │
│    - Extract text (pdf-parse)                               │
│    - Parse skills (regex patterns)                          │
│    - Normalize skills (skillNormalizer)                     │
│    Output: ['react', 'python', 'docker']                    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. JOB RECOMMENDATIONS                                      │
│    - Fetch jobs from APIs (Adzuna, JSearch)                │
│    - Match skills (fuzzySkillMatcher)                      │
│    - Calculate relevance scores                             │
│    Output: 30 relevant jobs                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SKILL GAP ANALYSIS                                       │
│    - Extract skills from job descriptions                   │
│    - Compare with resume skills                             │
│    - Calculate frequency & importance                       │
│    - Prioritize gaps (high/medium/low)                     │
│    Output: Top 5 missing skills                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. LEARNING PATH GENERATION (For each skill gap)           │
│                                                              │
│    ┌──────────────────────────────────────────┐            │
│    │ Is skill in hardcoded database?          │            │
│    └──────────┬───────────────────┬────────────┘            │
│               │ YES               │ NO                       │
│               ▼                   ▼                          │
│    ┌──────────────────┐  ┌──────────────────┐             │
│    │ Use Hardcoded    │  │ Call Groq API    │             │
│    │ Knowledge Graph  │  │ (LLM Generation) │             │
│    │ - 50+ skills     │  │ - Llama 3.3 70B  │             │
│    │ - Pre-built      │  │ - Dynamic        │             │
│    └──────────┬───────┘  └────────┬─────────┘             │
│               │                    │                         │
│               └────────┬───────────┘                         │
│                        ▼                                     │
│              ┌──────────────────┐                           │
│              │ Knowledge Graph  │                           │
│              │ - 5-10 nodes     │                           │
│              │ - Connections    │                           │
│              │ - Resources      │                           │
│              │ - Projects       │                           │
│              └────────┬─────────┘                           │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. INTERVIEW PRIORITY DETECTION                             │
│    - Check critical skills list                             │
│    - Analyze job market frequency                           │
│    - Calculate importance score                             │
│    Output: 'critical' | 'high' | 'medium' | 'low'          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. TIMELINE GENERATION (User selects duration)             │
│    - Choose: 3/6/12 months                                  │
│    - Set hours per week: 5-40                               │
│    - Distribute nodes across weeks                          │
│    - Generate mini projects                                 │
│    - Add milestones (25%, 50%, 75%, 100%)                  │
│    - Create checkpoints                                     │
│    Output: Week-by-week learning plan                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. VISUALIZATION                                            │
│    - Interactive knowledge graph (D3.js)                    │
│    - Weekly timeline cards                                  │
│    - Mini project cards                                     │
│    - Progress milestones                                    │
│    - Export to calendar (.ics)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Example: React Learning Path Generation

### Input:
```
Skill: "React"
User Skills: ["JavaScript", "HTML", "CSS"]
```

### Process:

#### 1. Check Hardcoded Database
```typescript
// Found! React has pre-built knowledge graph
const reactPath = knowledgeGraphs.react;
```

#### 2. Knowledge Graph Structure
```
Nodes:
1. React Basics (Foundation, 8h)
   - JSX, Components, Props
   - Project: Todo App
   
2. State & Lifecycle (Core, 10h)
   - useState, useEffect
   - Project: Weather App
   
3. Advanced Hooks (Advanced, 12h)
   - useContext, useReducer, Custom Hooks
   - Project: E-commerce Cart
   
4. Performance (Advanced, 10h)
   - Memoization, Code Splitting
   - Project: Optimized Dashboard

Edges:
- Basics → State (prerequisite)
- State → Hooks (prerequisite)
- Hooks → Performance (builds_on)
```

#### 3. Interview Priority
```typescript
// React is in highSkills list
interviewImportance = 'high';

// Appears in 80% of frontend jobs
priority = 'high';
```

#### 4. Timeline Distribution (3-month plan)
```
Week 1-3: React Basics
  Topics: JSX, Components, Props
  Mini Project: Build a Simple React Application (3h)
  Difficulty: Beginner

Week 4-6: State & Lifecycle
  Topics: useState, useEffect, Event Handling
  Mini Project: Weather Dashboard (5h)
  Difficulty: Intermediate
  Milestone: 🎯 50% Complete

Week 7-9: Advanced Hooks
  Topics: useContext, useReducer, Custom Hooks
  Mini Project: E-commerce Shopping Cart (8h)
  Difficulty: Advanced

Week 10-12: Performance & Best Practices
  Topics: Memoization, Code Splitting, Testing
  Mini Project: Production-Ready App (8h)
  Difficulty: Advanced
  Milestone: 🏆 100% Complete
```

---

## 💾 Data Storage

### Hardcoded Knowledge Graphs:
- **Location:** `backend/src/services/skillGapEngine.ts`
- **Size:** 8000+ lines of TypeScript
- **Format:** Nested objects with type definitions
- **Skills Covered:** 50+

### LLM-Generated Content:
- **API:** Groq Cloud API
- **Model:** Llama 3.3 70B Versatile
- **Cost:** Free tier (limited requests)
- **Fallback:** Used when skill not in database

### Caching:
- **Technology:** LRU Cache (Least Recently Used)
- **Location:** `backend/src/services/skillWeightCache.ts`
- **Purpose:** Cache skill weights and API responses
- **TTL:** 24 hours

---

## 🎓 Summary

### Learning Path Generation Uses:
1. ✅ **Hardcoded Knowledge Graphs** (50+ skills) - Primary method
2. ✅ **Groq API + Llama 3.3 70B** - Dynamic generation for unknown skills
3. ✅ **Regex Pattern Matching** - Skill extraction from jobs
4. ✅ **Frequency Analysis** - Skill importance calculation
5. ✅ **Custom Algorithms** - Timeline distribution, project generation

### Interview Priority Uses:
1. ✅ **Hardcoded Critical Skills List** - Pre-defined important skills
2. ✅ **Job Market Analysis** - Frequency in job postings
3. ✅ **Position-based Priority** - Top missing skills
4. ✅ **Salary Correlation** - High-paying skills

### Timeline Distribution Uses:
1. ✅ **Mathematical Distribution** - Nodes per week calculation
2. ✅ **Progressive Difficulty** - Beginner → Advanced
3. ✅ **Automatic Milestones** - 25%, 50%, 75%, 100%
4. ✅ **Project Generation** - Context-aware mini projects

### Key Technologies:
- **Backend:** Node.js, TypeScript, Express
- **AI:** Groq API (Llama 3.3 70B)
- **Frontend:** React, TypeScript, D3.js
- **Data Structures:** Graphs, Hash Maps, Caches
- **Algorithms:** Frequency analysis, Distribution, Scoring

This system combines **pre-built expert knowledge** with **AI-powered dynamic generation** to create personalized, interview-focused learning paths! 🚀
