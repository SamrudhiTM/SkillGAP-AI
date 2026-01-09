import Groq from "groq-sdk";
import { KnowledgeGraphData, KnowledgeNode } from "./skillGapEngine";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateLLMKnowledgeGraph(
  targetSkill: string,
  currentSkills: Set<string>
): Promise<KnowledgeGraphData> {
  console.log(`🤖 Using LLM to generate comprehensive knowledge graph for: ${targetSkill}`);

  const prompt = `You are an expert career advisor and technical educator. Generate a comprehensive, structured learning path for "${targetSkill}".

Current user skills: ${Array.from(currentSkills).join(", ") || "None"}

Create a detailed learning roadmap with 5-7 nodes covering:
1. Prerequisites/Foundation (if needed)
2. Fundamentals
3. Core Concepts
4. Intermediate Topics
5. Advanced Topics
6. Practical Projects
7. Interview Preparation (if technical skill)

For EACH node, provide:
- A clear title
- Detailed description (2-3 sentences)
- Category: foundation, core, advanced, project, or specialization
- Difficulty: beginner, intermediate, or advanced
- Estimated learning time in hours
- 3-5 mini-topics with:
  - Topic title
  - Description
  - 2-3 specific, real resources (YouTube channels, documentation sites, course platforms)
  - Estimated time for that topic
- A project milestone (if applicable)

Return ONLY valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "unique-id",
      "title": "Node Title",
      "description": "Detailed description",
      "category": "foundation|core|advanced|project|specialization",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedTime": 20,
      "miniTopics": [
        {
          "title": "Topic Title",
          "description": "Topic description",
          "resources": [
            {
              "title": "Resource Name",
              "url": "https://actual-url.com",
              "type": "tutorial|documentation|course|practice|article",
              "platform": "Platform Name",
              "isFree": true
            }
          ],
          "estimatedTime": 5
        }
      ],
      "projectMilestone": {
        "title": "Project Title",
        "description": "Project description",
        "difficulty": "beginner|intermediate|advanced",
        "deliverables": ["deliverable1", "deliverable2"],
        "estimatedTime": 15
      }
    }
  ],
  "skillPath": ["node-id-1", "node-id-2", "node-id-3"]
}

IMPORTANT:
- Use REAL, working URLs (YouTube, MDN, official docs, freeCodeCamp, Coursera, etc.)
- Mark interview-critical topics with "🔥 Interview HOT!" prefix
- Ensure logical progression from beginner to advanced
- Include hands-on projects
- Focus on practical, industry-relevant skills
- If user already has prerequisite skills, skip those nodes`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert technical educator who creates comprehensive, structured learning paths. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const llmResponse = JSON.parse(content);

    // Transform LLM response to KnowledgeGraphData format
    const nodes: KnowledgeNode[] = llmResponse.nodes.map((node: any, index: number) => ({
      id: node.id || `${targetSkill.toLowerCase()}-node-${index}`,
      title: node.title,
      description: node.description,
      category: node.category,
      difficulty: node.difficulty,
      estimatedTime: node.estimatedTime,
      position: { x: 200, y: 100 + index * 150 },
      connections: index < llmResponse.nodes.length - 1 ? [llmResponse.nodes[index + 1].id] : [],
      miniTopics: node.miniTopics || [],
      projectMilestone: node.projectMilestone,
    }));

    // Generate edges
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
        type: "related" as const,
        strength: 0.9 - i * 0.1,
      });
    }

    const skillPath = llmResponse.skillPath || nodes.map((n) => n.id);

    console.log(`✅ LLM generated ${nodes.length} nodes for ${targetSkill}`);

    return {
      nodes,
      edges,
      skillPath,
    };
  } catch (error) {
    console.error("❌ LLM knowledge graph generation failed:", error);
    // Fallback to basic generation
    return generateBasicFallback(targetSkill);
  }
}

function generateBasicFallback(targetSkill: string): KnowledgeGraphData {
  console.log(`⚠️ Using basic fallback for ${targetSkill}`);
  
  const nodes: KnowledgeNode[] = [
    {
      id: `${targetSkill.toLowerCase()}-basics`,
      title: `${targetSkill} Fundamentals`,
      description: `Learn the core concepts and fundamentals of ${targetSkill}`,
      category: "foundation",
      difficulty: "beginner",
      estimatedTime: 20,
      position: { x: 200, y: 100 },
      connections: [`${targetSkill.toLowerCase()}-intermediate`],
      miniTopics: [
        {
          title: `Introduction to ${targetSkill}`,
          description: `Getting started with ${targetSkill}`,
          resources: [
            {
              title: `${targetSkill} Official Documentation`,
              url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + " official documentation")}`,
              type: "documentation",
              platform: "Google",
              isFree: true,
            },
          ],
          estimatedTime: 10,
        },
      ],
    },
    {
      id: `${targetSkill.toLowerCase()}-intermediate`,
      title: `${targetSkill} Intermediate`,
      description: `Build practical skills and understanding of ${targetSkill}`,
      category: "core",
      difficulty: "intermediate",
      estimatedTime: 30,
      position: { x: 200, y: 250 },
      connections: [`${targetSkill.toLowerCase()}-advanced`],
      miniTopics: [
        {
          title: `${targetSkill} Best Practices`,
          description: `Industry standards and patterns`,
          resources: [
            {
              title: `${targetSkill} Tutorials`,
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(targetSkill + " tutorial")}`,
              type: "tutorial",
              platform: "YouTube",
              isFree: true,
            },
          ],
          estimatedTime: 15,
        },
      ],
    },
    {
      id: `${targetSkill.toLowerCase()}-advanced`,
      title: `${targetSkill} Advanced`,
      description: `Master advanced concepts and real-world applications`,
      category: "advanced",
      difficulty: "advanced",
      estimatedTime: 40,
      position: { x: 200, y: 400 },
      connections: [],
      miniTopics: [
        {
          title: `${targetSkill} Projects`,
          description: `Build production-ready applications`,
          resources: [
            {
              title: `${targetSkill} Project Ideas`,
              url: `https://www.google.com/search?q=${encodeURIComponent(targetSkill + " project ideas")}`,
              type: "project",
              platform: "Google",
              isFree: true,
            },
          ],
          estimatedTime: 20,
        },
      ],
    },
  ];

  const edges = [
    { from: nodes[0].id, to: nodes[1].id, type: "related" as const, strength: 0.9 },
    { from: nodes[1].id, to: nodes[2].id, type: "related" as const, strength: 0.8 },
  ];

  return {
    nodes,
    edges,
    skillPath: nodes.map((n) => n.id),
  };
}
