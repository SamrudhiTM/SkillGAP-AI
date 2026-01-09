import { Router } from "express";
import { skillGapHandler } from "../services/skillGapController";
import { KnowledgeGraph } from "../services/skillGapEngine";
import { LearningTimelineGenerator } from "../services/learningTimelineGenerator";

export const skillsRouter = Router();

// POST /skills/gap
skillsRouter.post("/gap", skillGapHandler);

// POST /skills/learning-path - Get detailed learning path for a specific skill
skillsRouter.post("/learning-path", async (req, res) => {
  const { skill, currentSkills } = req.body;

  if (!skill) {
    return res.status(400).json({
      error: "skill is required"
    });
  }

  try {
    console.log(`🔄 Generating learning path for skill: ${skill}`);
    const knowledgeGraph = new KnowledgeGraph();
    const learningPath = await knowledgeGraph.generateLearningPath(
      skill,
      currentSkills || []
    );

    console.log(`✅ Generated learning path with ${learningPath.knowledgeGraph.nodes.length} knowledge nodes`);
    
    // Validate knowledge graph integrity
    const validationResult = validateKnowledgeGraph(learningPath.knowledgeGraph);
    if (!validationResult.isValid) {
      console.warn(`⚠️ Knowledge graph validation warnings for ${skill}:`, validationResult.warnings);
    }

    res.json({ learningPath, validation: validationResult });
  } catch (error) {
    console.error("Learning path generation error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: "Failed to generate learning path", details: errorMessage });
  }
});

// POST /skills/knowledge-graph - Generate knowledge graph on demand for viewed skill gaps
skillsRouter.post("/knowledge-graph", async (req, res) => {
  const { skills, currentSkills } = req.body;

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({
      error: "skills array is required"
    });
  }

  try {
    console.log(`🔄 Generating knowledge graphs for ${skills.length} skills on demand`);
    const knowledgeGraph = new KnowledgeGraph();
    const results = [];

    for (const skill of skills) {
      try {
        console.log(`📊 Processing skill: ${skill}`);
        const learningPath = await knowledgeGraph.generateLearningPath(
          skill,
          currentSkills || []
        );

        // Validate knowledge graph
        const validationResult = validateKnowledgeGraph(learningPath.knowledgeGraph);
        
        results.push({
          skill,
          learningPath,
          validation: validationResult,
          success: true
        });

        console.log(`✅ Generated knowledge graph for ${skill}: ${learningPath.knowledgeGraph.nodes.length} nodes`);
      } catch (skillError) {
        console.error(`❌ Failed to generate knowledge graph for ${skill}:`, skillError);
        const errorMessage = skillError instanceof Error ? skillError.message : 'Unknown error';
        results.push({
          skill,
          error: errorMessage,
          success: false
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 Successfully generated ${successCount}/${skills.length} knowledge graphs`);

    res.json({ results, summary: { total: skills.length, successful: successCount } });
  } catch (error) {
    console.error("Bulk knowledge graph generation error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: "Failed to generate knowledge graphs", details: errorMessage });
  }
});

// Helper function to validate knowledge graph integrity
function validateKnowledgeGraph(knowledgeGraph: any) {
  const warnings = [];
  const nodeIds = new Set(knowledgeGraph.nodes.map((n: any) => n.id));
  
  // Check for missing node references in connections
  for (const node of knowledgeGraph.nodes) {
    for (const connectionId of node.connections || []) {
      if (!nodeIds.has(connectionId)) {
        warnings.push(`Node ${node.id} references missing connection: ${connectionId}`);
      }
    }
  }
  
  // Check for missing node references in edges
  for (const edge of knowledgeGraph.edges || []) {
    if (!nodeIds.has(edge.from)) {
      warnings.push(`Edge references missing 'from' node: ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      warnings.push(`Edge references missing 'to' node: ${edge.to}`);
    }
  }
  
  // Check for missing node references in skill path
  for (const nodeId of knowledgeGraph.skillPath || []) {
    if (!nodeIds.has(nodeId)) {
      warnings.push(`Skill path references missing node: ${nodeId}`);
    }
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    nodeCount: knowledgeGraph.nodes.length,
    edgeCount: knowledgeGraph.edges?.length || 0
  };
}




// POST /skills/timeline - Generate personalized learning timeline
skillsRouter.post("/timeline", async (req, res) => {
  const { skill, duration, hoursPerWeek, startDate, currentSkills } = req.body;

  if (!skill || !duration) {
    return res.status(400).json({
      error: "skill and duration are required"
    });
  }

  if (!['3-month', '6-month', '12-month'].includes(duration)) {
    return res.status(400).json({
      error: "duration must be '3-month', '6-month', or '12-month'"
    });
  }

  try {
    console.log(`📅 Generating ${duration} timeline for: ${skill}`);
    
    // First, get the learning path
    const knowledgeGraph = new KnowledgeGraph();
    const learningPath = await knowledgeGraph.generateLearningPath(
      skill,
      currentSkills || []
    );

    // Generate timeline
    const timelineGenerator = new LearningTimelineGenerator();
    const timeline = timelineGenerator.generateTimeline(
      learningPath,
      duration,
      hoursPerWeek || 10,
      startDate ? new Date(startDate) : undefined
    );

    console.log(`✅ Generated ${timeline.totalWeeks}-week timeline with ${timeline.weeklyGoals.length} weekly goals`);

    res.json({ timeline });
  } catch (error) {
    console.error("Timeline generation error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: "Failed to generate timeline", details: errorMessage });
  }
});

// POST /skills/timeline/export - Export timeline to calendar format
skillsRouter.post("/timeline/export", async (req, res) => {
  const { skill, duration, hoursPerWeek, startDate, currentSkills } = req.body;

  if (!skill || !duration) {
    return res.status(400).json({
      error: "skill and duration are required"
    });
  }

  try {
    console.log(`📤 Exporting ${duration} timeline for: ${skill}`);
    
    // Generate learning path and timeline
    const knowledgeGraph = new KnowledgeGraph();
    const learningPath = await knowledgeGraph.generateLearningPath(
      skill,
      currentSkills || []
    );

    const timelineGenerator = new LearningTimelineGenerator();
    const timeline = timelineGenerator.generateTimeline(
      learningPath,
      duration,
      hoursPerWeek || 10,
      startDate ? new Date(startDate) : undefined
    );

    // Export to iCal format
    const icalData = timelineGenerator.exportToCalendar(timeline);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${skill}-learning-plan.ics"`);
    res.send(icalData);

    console.log(`✅ Exported timeline to calendar format`);
  } catch (error) {
    console.error("Timeline export error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: "Failed to export timeline", details: errorMessage });
  }
});
