import React, { useState, useRef, useEffect } from "react";
import { api } from "./api";
import * as d3 from "d3";
import { LearningTimelineView } from "./components/LearningTimelineView";

interface ResumeProfile {
  name?: string;
  email?: string;
  location?: string;
  summary?: string;
  skills: string[];
}

interface JobItem {
  id: string;
  title: string;
  company?: string;
  location?: string;
  url?: string;
  source: string;
  description?: string; // Job description
  skillsRequired: string[];
  missingSkills?: string[]; // Skills required but not in resume
  relevanceScore?: number; // Relevance score 0-100
  matchedSkills?: string[]; // Skills that match resume
  matchCount?: number; // Number of matching skills
}

interface LearningNode {
  id: string;
  type: 'skill' | 'course' | 'project' | 'certification';
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  prerequisites: string[];
  outcomes: string[];
  resources: {
    free: string[];
    paid: string[];
    platforms: string[];
  };
}

interface LearningPath {
  skill: string;
  totalTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nodes: LearningNode[];
  milestones: {
    title: string;
    nodeIds: string[];
    estimatedTime: number;
  }[];
  parallelTracks: LearningPath[];
  roadmap?: any[];
  knowledgeGraph?: {
    nodes?: any[];
    edges?: any[];
    skillPath?: string[];
  };
}

interface WeeklyGoal {
  week: number;
  startDate: string;
  endDate: string;
  topics: string[];
  hoursPerWeek: number;
  miniProject: {
    title: string;
    description: string;
    objectives: string[];
    estimatedHours: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  milestone?: string;
}

interface Checkpoint {
  week: number;
  title: string;
  description: string;
  deliverable: string;
  assessmentCriteria: string[];
}

interface LearningTimeline {
  skill: string;
  duration: '3-month' | '6-month' | '12-month';
  totalWeeks: number;
  totalHours: number;
  hoursPerWeek: number;
  startDate: string;
  endDate: string;
  weeklyGoals: WeeklyGoal[];
  checkpoints: Checkpoint[];
  milestones: {
    week: number;
    title: string;
    achievement: string;
  }[];
  studyRecommendations: {
    bestTimeToStudy: string[];
    studyTechniques: string[];
    practiceProjects: string[];
  };
}

interface SkillGapItem {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
  learningPath?: LearningPath;
}

interface CoursesForSkill {
  skill: string;
  free: CourseCard[];
  paid: CourseCard[];
  certification: CourseCard[];
}

interface CourseCard {
  title: string;
  provider: string;
  url: string;
  credibility?: 'high' | 'medium' | 'standard';
  resumeValue?: 'excellent' | 'good' | 'standard';
  duration?: string;
  cost?: string;
  skills?: string[];
}

type TabType = "profile" | "jobs" | "gaps" | "learning" | "certifications";
type MainSection = "career" | "learning-paths" | "interview-prep";

interface StandaloneLearningPath {
  skill: string;
  data: LearningPath | null;
  loading: boolean;
  expanded: boolean;
}

// Interactive Knowledge Graph Component
const KnowledgeGraphVisualization: React.FC<{
  nodes: any[];
  edges: any[];
  skillPath: string[];
}> = ({ nodes, edges, skillPath }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    try {

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    // Transform edges to D3 format
    const transformedEdges = edges && edges.length > 0 ? edges.map(edge => ({
      source: edge.from,
      target: edge.to,
      type: edge.type,
      strength: edge.strength
    })) : [];

    // Use backend-provided positions if available, otherwise create hierarchical layout
    const hasPositions = nodes.every(node => node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number');

    if (hasPositions) {
      // Use the positions provided by the backend
      nodes.forEach(node => {
        node.x = node.position.x;
        node.y = node.position.y;
        // Allow some movement but keep them reasonably positioned
        node.fx = null;
        node.fy = null;
      });
    } else {
      // Create a hierarchical layout based on prerequisites
      const nodeMap = new Map(nodes.map(node => [node.id, node]));
      const processed = new Set<string>();
      const levels: any[][] = [];

      // Find root nodes (no incoming prerequisites)
      const rootNodes = nodes.filter(node =>
        !transformedEdges.some(edge => edge.target === node.id && edge.type === 'prerequisite')
      );

      // Assign levels based on prerequisites
      const assignLevel = (nodeId: string, level: number = 0) => {
        if (processed.has(nodeId)) return;
        processed.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (!node) return;

        if (!levels[level]) levels[level] = [];
        levels[level].push(node);
        node.level = level;

        // Find nodes that depend on this node (outgoing prerequisites)
        const dependents = transformedEdges
          .filter(edge => edge.source === nodeId && edge.type === 'prerequisite')
          .map(edge => edge.target);

        dependents.forEach(dependentId => assignLevel(dependentId, level + 1));
      };

      // Assign levels starting from root nodes
      rootNodes.forEach(node => assignLevel(node.id));

      // Position nodes based on levels
      const levelHeight = height / Math.max(levels.length, 1);
      levels.forEach((levelNodes, levelIndex) => {
        const levelWidth = width / Math.max(levelNodes.length, 1);
        levelNodes.forEach((node, nodeIndex) => {
          node.x = levelWidth * (nodeIndex + 0.5);
          node.y = levelHeight * (levelIndex + 0.5);
          node.fx = node.x; // Fix position to prevent movement
          node.fy = node.y;
        });
      });
    }

    // Ensure all nodes have positions (fallback for nodes not in hierarchy)
    nodes.forEach((node: any, i: number) => {
      if (!node.x || !node.y) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        node.x = (width / 4) * (col + 1);
        node.y = (height / 4) * (row + 1);
        node.fx = node.x;
        node.fy = node.y;
      }
      // Ensure node has an id
      if (!node.id) node.id = `node-${i}`;
    });

    // Create force simulation with minimal forces since positions are mostly fixed
    const simulation = d3.forceSimulation(nodes);

    // Only add link force if there are edges
    if (transformedEdges.length > 0) {
      simulation.force("link", d3.forceLink(transformedEdges).id((d: any) => d.id).distance(120).strength(0.1));
    }

    simulation
      .force("charge", d3.forceManyBody().strength(-200))
      .force("collision", d3.forceCollide().radius((d: any) => {
        const difficultySizes = { beginner: 40, intermediate: 45, advanced: 50 };
        return difficultySizes[d.difficulty as keyof typeof difficultySizes] || 40;
      }).strength(0.1));

    // Create arrow markers for directed edges
    const defs = svg.append("defs");

    // Green arrow for prerequisites (must-learn-first)
    defs.append("marker")
      .attr("id", "arrow-green")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 55)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#10b981");

    // Orange arrow for related links (can-learn-together)
    defs.append("marker")
      .attr("id", "arrow-orange")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 55)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#f59e0b");

    // Create links (edges) only if there are edges
    let link: any = null;
    if (transformedEdges.length > 0) {
      // Create link groups first
      const linkGroups = svg.append("g")
        .attr("class", "links");

      // Draw edges with different styles based on type
      const prerequisiteLinks = linkGroups.selectAll(".prerequisite-link")
        .data(transformedEdges.filter((d: any) => d.type === 'prerequisite'))
        .enter().append("line")
        .attr("class", "prerequisite-link")
        .attr("stroke", "#10b981")
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 0.9)
        .attr("marker-end", "url(#arrow-green)")
        .style("stroke-dasharray", "none");

      const relatedLinks = linkGroups.selectAll(".related-link")
        .data(transformedEdges.filter((d: any) => d.type === 'related'))
        .enter().append("line")
        .attr("class", "related-link")
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.7)
        .attr("marker-end", "url(#arrow-orange)")
        .style("stroke-dasharray", "8,4");

      // Add edge labels
      const linkLabels = linkGroups.selectAll(".link-label")
        .data(transformedEdges)
        .enter().append("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .attr("dy", -5)
        .attr("font-size", "10px")
        .attr("fill", (d: any) => d.type === 'prerequisite' ? "#ef4444" : "#64748b")
        .attr("font-weight", (d: any) => d.type === 'prerequisite' ? "bold" : "normal")
        .text((d: any) => d.type === 'prerequisite' ? "PREREQUISITE" : "RELATED")
        .style("pointer-events", "none");

      link = { prerequisiteLinks, relatedLinks, linkLabels };
    }

    // Create nodes
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", d => {
        // Size based on difficulty
        const difficultySizes = { beginner: 35, intermediate: 40, advanced: 45 };
        return difficultySizes[d.difficulty as keyof typeof difficultySizes] || 35;
      })
      .attr("fill", d => {
        // Color based on category
        const categoryColors = {
          foundation: "#3b82f6",
          core: "#10b981",
          advanced: "#f59e0b",
          specialization: "#8b5cf6"
        };
        return categoryColors[d.category as keyof typeof categoryColors] || "#64748b";
      })
      .attr("stroke", d => selectedNode?.id === d.id ? "#ef4444" : "#ffffff")
      .attr("stroke-width", d => selectedNode?.id === d.id ? 3 : 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(d);
        // Highlight connected nodes
        d3.selectAll("circle")
          .attr("stroke", (nodeData: any) => {
            if (nodeData.id === d.id) return "#ef4444";
            const isConnected = transformedEdges.some(edge =>
              (edge.source === d.id && edge.target === nodeData.id) ||
              (edge.target === d.id && edge.source === nodeData.id)
            );
            return isConnected ? "#f59e0b" : "#ffffff";
          })
          .attr("stroke-width", (nodeData: any) => {
            if (nodeData.id === d.id) return 3;
            const isConnected = transformedEdges.some(edge =>
              (edge.source === d.id && edge.target === nodeData.id) ||
              (edge.target === d.id && edge.source === nodeData.id)
            );
            return isConnected ? 2 : 1;
          });
      })
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          // Allow some movement but keep it constrained
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          // Constrain movement to reasonable bounds
          const newX = Math.max(50, Math.min(width - 50, event.x));
          const newY = Math.max(50, Math.min(height - 50, event.y));
          d.fx = newX;
          d.fy = newY;
          d.x = newX;
          d.y = newY;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          // Keep the final position
        }));

    // Add step numbers on nodes
    const stepNumbers = svg.append("g")
      .attr("class", "step-numbers")
      .selectAll("circle")
      .data(nodes)
      .enter().append("circle")
      .attr("r", 12)
      .attr("fill", "#ffffff")
      .attr("stroke", "#000000")
      .attr("stroke-width", 2)
      .style("pointer-events", "none");

    const stepLabels = svg.append("g")
      .attr("class", "step-labels")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "#000000")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .text((d, i) => i + 1);

    // Add main labels
    const labels = svg.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2.5em")
      .attr("fill", "#ffffff")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none")
      .text(d => (d.title || d.name || "Concept").length > 15
        ? (d.title || d.name || "Concept").substring(0, 12) + "..."
        : (d.title || d.name || "Concept"))
      .call(d3.drag<SVGTextElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Update positions on simulation tick
    simulation.on("tick", () => {
      // Keep nodes within bounds
      nodes.forEach((d: any) => {
        d.x = Math.max(60, Math.min(width - 60, d.x));
        d.y = Math.max(60, Math.min(height - 60, d.y));
      });

      // Update links if they exist
      if (link) {
        if (link.prerequisiteLinks) {
          link.prerequisiteLinks
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);
        }
        if (link.relatedLinks) {
          link.relatedLinks
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);
        }
        if (link.linkLabels) {
          link.linkLabels
            .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
            .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
        }
      }

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      stepNumbers
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y - 15);

      stepLabels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y - 15);

      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    // Run simulation for a few ticks to stabilize
    for (let i = 0; i < 100; i++) {
      simulation.tick();
    }

    return () => {
      simulation.stop();
    };
  } catch (error) {
    console.error("Error rendering knowledge graph:", error);
    // Show error message in SVG
    const svg = d3.select(svgRef.current);
    if (svg) {
      svg.selectAll("*").remove();
      svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#ef4444")
        .attr("font-size", "16px")
        .text(`Error: ${(error as Error).message || 'Unknown error'}`);
    }
  }
  }, [nodes, edges, selectedNode, dimensions]);

  return (
    <div className="knowledge-graph-visualization">
      <div className="graph-controls">
        <button
          className="reset-btn"
          onClick={() => {
            setSelectedNode(null);
            d3.selectAll("circle").attr("stroke", "#ffffff").attr("stroke-width", 2);
          }}
        >
          Reset View
        </button>
      </div>

      <div className="graph-container">
        {nodes.length > 0 ? (
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            No knowledge graph data available
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="node-detail-panel">
          <div className="node-detail-header">
            <h4>{selectedNode.title || selectedNode.name}</h4>
            <span className="node-meta">
              {selectedNode.category || "concept"}
            </span>
          </div>

          {selectedNode.description && (
            <p className="node-description">{selectedNode.description}</p>
          )}

          {selectedNode.miniTopics && selectedNode.miniTopics.length > 0 && (
            <div className="node-subtopics">
              <h5>Sub-topics:</h5>
              <div className="subtopics-list">
                {selectedNode.miniTopics.map((topic: any, idx: number) => (
                  <div key={idx} className="subtopic-item">
                    <h6>{topic.title}</h6>
                    {topic.description && <p>{topic.description}</p>}
                    {topic.resources && topic.resources.length > 0 && (
                      <div className="subtopic-resources">
                        {topic.resources.slice(0, 2).map((resource: any, rIdx: number) => (
                          <a
                            key={rIdx}
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="resource-link"
                          >
                            {resource.title || "Resource"} {resource.type ? `(${resource.type})` : ""}
                          </a>
                        ))}
                        {topic.resources.length > 2 && (
                          <span className="more-resources">+{topic.resources.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNode.projectMilestone && (
            <div className="node-project">
              <h5>Practice Project:</h5>
              <div className="project-card">
                <h6>{selectedNode.projectMilestone.title}</h6>
                <p>{selectedNode.projectMilestone.description}</p>
                <div className="project-meta">
                  <span>Difficulty: {selectedNode.projectMilestone.difficulty}</span>
                </div>
                {selectedNode.projectMilestone.deliverables && (
                  <ul className="project-deliverables">
                    {selectedNode.projectMilestone.deliverables.map((deliverable: string, idx: number) => (
                      <li key={idx}>{deliverable}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="graph-legend">
        <h5>Legend:</h5>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "#3b82f6" }}></div>
            <span>Foundation</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "#10b981" }}></div>
            <span>Core</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "#f59e0b" }}></div>
            <span>Advanced</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: "#8b5cf6" }}></div>
            <span>Specialization</span>
          </div>
        </div>

        <div className="edge-legend">
          <h6>Learning Path:</h6>
          <div className="edge-types">
            <div className="edge-type">
              <div className="edge-sample prerequisite" style={{ backgroundColor: "#10b981" }}></div>
              <span>📚 Must Learn First (Prerequisites)</span>
            </div>
            <div className="edge-type">
              <div className="edge-sample related" style={{ backgroundColor: "#f59e0b", borderStyle: "dashed" }}></div>
              <span>🔄 Can Learn Together (Related)</span>
            </div>
          </div>
          <div className="step-info">
            <p><strong>Step Numbers:</strong> Follow the numbered sequence for optimal learning order</p>
          </div>
        </div>

        <p className="legend-note">Click nodes to explore details. Drag to rearrange. Red edges show learning order.</p>
      </div>
    </div>
  );
};

const LearningPathCard: React.FC<{
  gap: SkillGapItem;
  currentSkills: string[];
  index: number;
}> = ({ gap, currentSkills, index }) => {
  const [expandedPath, setExpandedPath] = useState<string | null>(
    gap.learningPath?.knowledgeGraph?.nodes?.length ? gap.skill : null
  );
  const [detailedPathData, setDetailedPathData] = useState<LearningPath | null>(gap.learningPath || null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Auto-expand knowledge graphs for skill gaps
  React.useEffect(() => {
    if (gap.learningPath?.knowledgeGraph?.nodes?.length && !expandedPath) {
      setExpandedPath(gap.skill);
      setDetailedPathData(gap.learningPath);
    }
  }, [gap.learningPath, gap.skill, expandedPath]);

  const loadDetailedPath = async () => {
    setLoading(true);
    try {
      console.log("Loading learning path for skill:", gap.skill);
      const response = await api.post("/skills/learning-path", {
        skill: gap.skill,
        currentSkills,
      });

      console.log("API Response:", response);
      const pathData = response.data?.learningPath as LearningPath | undefined;

      if (!pathData) {
        throw new Error("No learning path data received from API");
      }

      // Validate that we have some useful data
      if (!pathData.totalTime && !pathData.roadmap && !pathData.knowledgeGraph) {
        console.warn("Learning path data seems incomplete:", pathData);
      }

      console.log("Setting detailed path data for", gap.skill + ":", {
        hasTotalTime: !!pathData.totalTime,
        hasRoadmap: !!(pathData.roadmap && pathData.roadmap.length > 0),
        hasKnowledgeGraph: !!pathData.knowledgeGraph,
        roadmapLength: pathData.roadmap?.length || 0,
        kgNodes: pathData.knowledgeGraph?.nodes?.length || 0
      });

      setDetailedPathData(pathData);
      setExpandedPath(gap.skill);
      console.log("Successfully loaded detailed learning path for", gap.skill);
    } catch (error: any) {
      console.error("Failed to load detailed learning path:", error);
      console.error("Error details:", error.response?.data || error.message);
      alert(`Failed to load learning path details: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`learning-path-card ${index < 2 ? 'priority-high' : ''}`} data-skill={gap.skill.toLowerCase()}>
      <div className="learning-path-header">
        <h3>{gap.skill}</h3>
        <div className="learning-path-meta">
          <span className={`priority ${gap.priority}`}>
            {gap.priority.toUpperCase()}
          </span>
          {gap.learningPath && (
            <span className="has-roadmap">🗺️ Roadmap Available</span>
          )}
        </div>
      </div>

      <p className="learning-path-description">{gap.reason}</p>


      {/* Only show load button if we don't have knowledge graph data */}
      {gap.learningPath && !gap.learningPath.knowledgeGraph?.nodes?.length && !expandedPath && (
        <button
          className="load-more-btn"
          onClick={loadDetailedPath}
          disabled={loading}
        >
          {loading ? 'Loading Knowledge Graph...' : 'Load Interactive Knowledge Graph'}
        </button>
      )}

      {expandedPath && (
        <div className="learning-path-expanded">
          {loading && !detailedPathData ? (
            <div style={{padding: '2rem', textAlign: 'center'}}>Loading detailed learning path...</div>
          ) : !detailedPathData ? (
            <div className="learning-path-error">
              <h4>Learning Path Unavailable</h4>
              <p>Sorry, we couldn't load the detailed learning path for {gap.skill} at this time.</p>
              <button className="retry-btn" onClick={() => { setExpandedPath(null); setDetailedPathData(null); loadDetailedPath(); }}>Try Again</button>
              <button className="collapse-btn" onClick={() => { setExpandedPath(null); setDetailedPathData(null); }}>Close</button>
            </div>
          ) : (
            <>
              <div className="learning-path-stats">
                <div className="stat">
                  <span className="stat-label">Steps</span>
                  <span className="stat-value">{detailedPathData.nodes?.length || detailedPathData.roadmap?.length || 0}</span>
                </div>
              </div>


                {detailedPathData.knowledgeGraph && detailedPathData.knowledgeGraph.nodes && detailedPathData.knowledgeGraph.nodes.length > 0 && (
                  <div className="learning-path-knowledge-graph">
                    <h4>Interactive Knowledge Graph</h4>
                    <div className="knowledge-graph-description">
                      <p>Click on concept circles to explore sub-topics and resources. Drag nodes to rearrange the graph.</p>
                    </div>
                    <KnowledgeGraphVisualization
                      nodes={detailedPathData.knowledgeGraph.nodes}
                      edges={detailedPathData.knowledgeGraph.edges || []}
                      skillPath={detailedPathData.knowledgeGraph.skillPath || []}
                    />
                  </div>
                )}

              {/* Timeline Section */}
              <div className="timeline-toggle-section">
                <button
                  className="timeline-toggle-btn"
                  onClick={() => setShowTimeline(!showTimeline)}
                >
                  {showTimeline ? '📊 Hide Timeline' : '📅 Show Personalized Timeline'}
                </button>
              </div>

              {showTimeline && (
                <LearningTimelineView
                  skill={gap.skill}
                  currentSkills={currentSkills}
                />
              )}

              <button
                className="collapse-btn"
                onClick={() => {
                  setExpandedPath(null);
                  setDetailedPathData(null);
                  setShowTimeline(false);
                }}
              >
                Collapse Learning Path
              </button>
            </>
          )}
        </div>
      )}

      {!gap.learningPath && (
        <div className="no-path-notice">
          <p>Learning path generation in progress...</p>
        </div>
      )}
    </div>
  );
};

// Standalone Learning Path Card Component (for browsing section)
const StandaloneLearningPathCard: React.FC<{
  path: StandaloneLearningPath;
  index: number;
  onToggle: () => void;
}> = ({ path, index, onToggle }) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const renderKnowledgeGraph = (data: LearningPath) => {
    if (!data.knowledgeGraph?.nodes?.length) return null;

    return (
      <KnowledgeGraphVisualization
        nodes={data.knowledgeGraph.nodes}
        edges={data.knowledgeGraph.edges || []}
        skillPath={data.knowledgeGraph.skillPath || []}
      />
    );
  };

  return (
    <div className="learning-path-card standalone-path-card" data-skill={path.skill.toLowerCase()}>
      <div className="path-header">
        <h3>{path.skill}</h3>
      </div>

      <div className="path-description">
        <p>Interactive learning path with knowledge graph visualization</p>
      </div>

      <div className="path-actions">
        <button
          className={`expand-btn ${path.expanded ? 'expanded' : ''}`}
          onClick={onToggle}
          disabled={path.loading}
        >
          {path.loading ? '⏳ Loading...' : (path.expanded ? '🔽 Collapse' : '🔍 Explore Path')}
        </button>
      </div>

      {path.expanded && path.data && (
        <>
          <div className="learning-path-stats">
            <div className="stat">
              <span className="stat-label">Topics</span>
              <span className="stat-value">{path.data.nodes?.length || 0}</span>
            </div>
          </div>

          {/* Knowledge Graph Section */}
          {path.data.knowledgeGraph && path.data.knowledgeGraph.nodes && path.data.knowledgeGraph.nodes.length > 0 && (
            <div className="learning-path-knowledge-graph">
              <h4>Interactive Knowledge Graph</h4>
              <div className="knowledge-graph-description">
                <p>Click on concept circles to explore sub-topics and resources. Drag nodes to rearrange the graph.</p>
                <p>Debug: {path.data.knowledgeGraph.nodes.length} nodes, {path.data.knowledgeGraph.edges?.length || 0} edges</p>
              </div>
              {renderKnowledgeGraph(path.data)}
            </div>
          )}

          {/* Roadmap Section (if available) */}
          {path.data.roadmap && Array.isArray(path.data.roadmap) && path.data.roadmap.length > 0 && (
            <div className="learning-path-roadmap">
              <h4>Learning Roadmap</h4>
              <div className="roadmap-steps">
                {path.data.roadmap.map((step: any, idx: number) => (
                  <div key={idx} className={`roadmap-step ${step?.priority === 'high' ? 'priority-high' : ''}`}>
                    <div className="step-header">
                      <h5>{step?.title || `Step ${idx + 1}`}</h5>
                      {step?.priority === 'high' && (
                        <span className="step-priority">🔥 Interview Focus</span>
                      )}
                    </div>
                    <p className="step-description">{step?.description || 'No description available'}</p>
                    {step?.resources && Array.isArray(step.resources) && step.resources.length > 0 && (
                      <div className="step-resources">
                        <strong>Resources:</strong>
                        <ul>
                          {step.resources.map((resource: any, rIdx: number) => (
                            <li key={rIdx}>
                              <a href={resource?.url} target="_blank" rel="noopener noreferrer">
                                {resource?.title || 'Untitled Resource'}
                              </a>
                              {resource?.type && <span className="resource-type">({resource.type})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="collapse-btn"
            onClick={onToggle}
          >
            Collapse Learning Path
          </button>
        </>
      )}

      {!path.data && path.expanded && !path.loading && (
        <div className="no-path-notice">
          <p>Failed to load learning path data. Please try again.</p>
        </div>
      )}
    </div>
  );
};



// Available learning paths
const AVAILABLE_SKILLS = [
  // Frontend Development
  { skill: 'JavaScript', description: 'Master modern JavaScript development', icon: '🟨', difficulty: 'Intermediate' },
  { skill: 'React', description: 'Build interactive user interfaces', icon: '⚛️', difficulty: 'Intermediate' },
  { skill: 'TypeScript', description: 'Type-safe JavaScript development', icon: '🔷', difficulty: 'Intermediate' },
  { skill: 'Vue.js', description: 'Progressive JavaScript framework', icon: '💚', difficulty: 'Intermediate' },
  { skill: 'Angular', description: 'Enterprise web application framework', icon: '🅰️', difficulty: 'Advanced' },
  { skill: 'HTML', description: 'Web page structure and semantics', icon: '📄', difficulty: 'Beginner' },
  { skill: 'CSS', description: 'Styling and layout for web pages', icon: '🎨', difficulty: 'Beginner' },
  { skill: 'Tailwind CSS', description: 'Utility-first CSS framework', icon: '🌊', difficulty: 'Beginner' },
  { skill: 'Next.js', description: 'React framework for production', icon: '▲', difficulty: 'Intermediate' },
  { skill: 'Redux', description: 'State management for JavaScript apps', icon: '🔄', difficulty: 'Intermediate' },
  
  // Backend Development
  { skill: 'Node.js', description: 'Server-side JavaScript development', icon: '🟩', difficulty: 'Intermediate' },
  { skill: 'Python', description: 'Versatile programming for data and automation', icon: '🐍', difficulty: 'Beginner' },
  { skill: 'Java', description: 'Enterprise application development', icon: '☕', difficulty: 'Intermediate' },
  { skill: 'C#', description: '.NET framework development', icon: '#️⃣', difficulty: 'Intermediate' },
  { skill: 'Go', description: 'Fast and efficient backend services', icon: '🔵', difficulty: 'Intermediate' },
  { skill: 'PHP', description: 'Server-side web development', icon: '🐘', difficulty: 'Beginner' },
  { skill: 'Ruby', description: 'Ruby on Rails web development', icon: '💎', difficulty: 'Intermediate' },
  { skill: 'Express.js', description: 'Minimal Node.js web framework', icon: '🚂', difficulty: 'Intermediate' },
  { skill: 'Django', description: 'Python web framework', icon: '🎸', difficulty: 'Intermediate' },
  { skill: 'Spring Boot', description: 'Java application framework', icon: '🍃', difficulty: 'Advanced' },
  
  // Mobile Development
  { skill: 'React Native', description: 'Cross-platform mobile apps', icon: '📱', difficulty: 'Intermediate' },
  { skill: 'Flutter', description: 'Beautiful native mobile apps', icon: '🦋', difficulty: 'Intermediate' },
  { skill: 'Swift', description: 'iOS app development', icon: '🍎', difficulty: 'Intermediate' },
  { skill: 'Kotlin', description: 'Modern Android development', icon: '🤖', difficulty: 'Intermediate' },
  
  // Database & Data
  { skill: 'SQL', description: 'Database design and querying', icon: '🗄️', difficulty: 'Beginner' },
  { skill: 'MongoDB', description: 'NoSQL document database', icon: '🍃', difficulty: 'Intermediate' },
  { skill: 'PostgreSQL', description: 'Advanced relational database', icon: '🐘', difficulty: 'Intermediate' },
  { skill: 'Redis', description: 'In-memory data structure store', icon: '🔴', difficulty: 'Intermediate' },
  { skill: 'MySQL', description: 'Popular relational database', icon: '🐬', difficulty: 'Beginner' },
  { skill: 'GraphQL', description: 'Query language for APIs', icon: '◼️', difficulty: 'Intermediate' },
  
  // DevOps & Cloud
  { skill: 'Docker', description: 'Containerization and deployment', icon: '🐳', difficulty: 'Intermediate' },
  { skill: 'Kubernetes', description: 'Container orchestration platform', icon: '☸️', difficulty: 'Advanced' },
  { skill: 'AWS', description: 'Cloud computing and deployment', icon: '☁️', difficulty: 'Advanced' },
  { skill: 'Azure', description: 'Microsoft cloud platform', icon: '🔷', difficulty: 'Advanced' },
  { skill: 'Google Cloud', description: 'GCP cloud services', icon: '☁️', difficulty: 'Advanced' },
  { skill: 'CI/CD', description: 'Continuous integration and deployment', icon: '🔄', difficulty: 'Intermediate' },
  { skill: 'Jenkins', description: 'Automation server for CI/CD', icon: '👨‍🔧', difficulty: 'Intermediate' },
  { skill: 'Terraform', description: 'Infrastructure as code', icon: '🏗️', difficulty: 'Advanced' },
  
  // AI & Data Science
  { skill: 'Machine Learning', description: 'AI and predictive modeling', icon: '🤖', difficulty: 'Advanced' },
  { skill: 'Deep Learning', description: 'Neural networks and AI', icon: '🧠', difficulty: 'Advanced' },
  { skill: 'TensorFlow', description: 'Machine learning framework', icon: '🔶', difficulty: 'Advanced' },
  { skill: 'PyTorch', description: 'Deep learning framework', icon: '🔥', difficulty: 'Advanced' },
  { skill: 'Data Science', description: 'Data analysis and insights', icon: '📊', difficulty: 'Intermediate' },
  { skill: 'Pandas', description: 'Data manipulation in Python', icon: '🐼', difficulty: 'Intermediate' },
  { skill: 'NumPy', description: 'Numerical computing in Python', icon: '🔢', difficulty: 'Intermediate' },
  
  // Tools & Practices
  { skill: 'Git', description: 'Version control and collaboration', icon: '📚', difficulty: 'Beginner' },
  { skill: 'GitHub', description: 'Code hosting and collaboration', icon: '🐙', difficulty: 'Beginner' },
  { skill: 'REST APIs', description: 'API design and development', icon: '🔗', difficulty: 'Intermediate' },
  { skill: 'Testing', description: 'Quality assurance and testing', icon: '🧪', difficulty: 'Intermediate' },
  { skill: 'Jest', description: 'JavaScript testing framework', icon: '🃏', difficulty: 'Intermediate' },
  { skill: 'Agile', description: 'Agile development methodology', icon: '🏃', difficulty: 'Beginner' },
  { skill: 'Scrum', description: 'Agile project management', icon: '🏉', difficulty: 'Beginner' },
  
  // Security & Performance
  { skill: 'Cybersecurity', description: 'Security best practices', icon: '🔒', difficulty: 'Advanced' },
  { skill: 'OAuth', description: 'Authentication and authorization', icon: '🔐', difficulty: 'Intermediate' },
  { skill: 'Web Performance', description: 'Optimize web applications', icon: '⚡', difficulty: 'Intermediate' },
  
  // Other Popular Skills
  { skill: 'Linux', description: 'Unix-based operating system', icon: '🐧', difficulty: 'Intermediate' },
  { skill: 'Bash', description: 'Shell scripting and automation', icon: '💻', difficulty: 'Beginner' },
  { skill: 'Microservices', description: 'Distributed system architecture', icon: '🔷', difficulty: 'Advanced' },
  { skill: 'WebSockets', description: 'Real-time communication', icon: '🔌', difficulty: 'Intermediate' },
  { skill: 'Blockchain', description: 'Distributed ledger technology', icon: '⛓️', difficulty: 'Advanced' },
  { skill: 'Elasticsearch', description: 'Search and analytics engine', icon: '🔍', difficulty: 'Advanced' }
];

export const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [gaps, setGaps] = useState<SkillGapItem[]>([]);
  const [courses, setCourses] = useState<CoursesForSkill[]>([]);
  const [standalonePaths, setStandalonePaths] = useState<StandaloneLearningPath[]>([]);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [activeSection, setActiveSection] = useState<MainSection>("career");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadStandaloneLearningPath = async (skill: string) => {
    console.log(`🔍 Loading learning path for: ${skill}`);
    
    // Check if we already have this path loaded
    const existingPath = standalonePaths.find(p => p.skill === skill);
    if (existingPath) {
      console.log(`♻️ Toggling existing path for: ${skill}`);
      // Toggle expansion
      setStandalonePaths(paths =>
        paths.map(p => p.skill === skill ? { ...p, expanded: !p.expanded } : p)
      );
      return;
    }

    // Load new path
    console.log(`📥 Fetching new learning path for: ${skill}`);
    setStandalonePaths(paths => [...paths, { skill, data: null, loading: true, expanded: false }]);

    try {
      console.log(`🌐 Making API call to /skills/learning-path for: ${skill}`);
      const response = await api.post('/skills/learning-path', {
        skill: skill.toLowerCase(),
        currentSkills: profile?.skills || []
      });

      console.log(`✅ API Response received for ${skill}:`, response.data);
      const pathData = response.data?.learningPath as LearningPath | undefined;

      if (!pathData) {
        console.error(`❌ No learning path data in response for ${skill}`);
        throw new Error('No learning path data received');
      }

      console.log(`📊 Learning path data for ${skill}:`, {
        nodes: pathData.knowledgeGraph?.nodes?.length || 0,
        edges: pathData.knowledgeGraph?.edges?.length || 0,
        roadmap: pathData.roadmap?.length || 0
      });

      setStandalonePaths(paths =>
        paths.map(p => p.skill === skill ? { ...p, data: pathData, loading: false, expanded: true } : p)
      );

      console.log(`✅ Successfully loaded learning path for ${skill}`);

      // Already in learning-paths section, content will expand inline
      // No need to navigate or scroll

    } catch (error: any) {
      console.error(`❌ Failed to load standalone learning path for ${skill}:`, error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Show user-friendly error
      alert(`Failed to load learning path for ${skill}. ${error.response?.data?.error || error.message || 'Please try again.'}`);
      
      setStandalonePaths(paths =>
        paths.map(p => p.skill === skill ? { ...p, loading: false, expanded: false } : p)
      );
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setLoadingStage("Parsing resume");

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/resume/extract", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const p: ResumeProfile = res.data.profile;
      setProfile(p);

      if (!p.skills || p.skills.length === 0) {
        setError("No skills detected in resume. Try another file.");
        setLoadingStage(null);
        return;
      }

      setLoadingStage("Fetching jobs");
      try {
        const jobsRes = await api.post("/jobs/recommend", {
          skills: p.skills,
          limit: 30,
        });
        const jobList: JobItem[] = jobsRes.data?.jobs || [];
        setJobs(jobList);
        console.log("Jobs fetched:", jobList.length);

        if (jobList.length === 0) {
          console.warn("No jobs found - this might be due to missing API keys");
        }

        setLoadingStage("Computing skill gaps");
        if (jobList && jobList.length > 0) {
          try {
            const gapsRes = await api.post("/skills/gap", {
              resumeSkills: p.skills || [],
              jobs: jobList || [],
              topN: 5,
            });
            const gapList: SkillGapItem[] = gapsRes.data?.gaps || [];
            setGaps(gapList);
            console.log("Skill gaps computed:", gapList.length);

            setLoadingStage("Fetching courses");
            if (gapList && gapList.length > 0) {
              try {
                const coursesRes = await api.post("/courses/recommend", {
                  gaps: gapList,
                });
                const courseList = coursesRes.data?.courses || [];
                setCourses(courseList);
                console.log("Courses fetched:", courseList.length);
              } catch (courseErr: any) {
                console.error("Course fetch error:", courseErr);
                setCourses([]);
                const courseErrorMsg = courseErr?.response?.data?.error;
                if (courseErrorMsg) {
                  setError(`Course recommendations: ${courseErrorMsg}`);
                }
              }
            } else {
              setCourses([]);
              console.warn("No skill gaps found, skipping course recommendations");
            }
          } catch (gapErr: any) {
            console.error("Skill gap computation error:", gapErr);
            setGaps([]);
            setCourses([]);
            const gapErrorMsg = gapErr?.response?.data?.error;
            if (gapErrorMsg) {
              setError(`Skill gap analysis: ${gapErrorMsg}`);
            }
          }
        } else {
          setGaps([]);
          setCourses([]);
          console.warn("No jobs found, skipping skill gap and course analysis");
        }
      } catch (apiError: any) {
        console.error("API error in pipeline:", apiError);
        // Continue with empty arrays so user can still see profile
        setJobs([]);
        setGaps([]);
        setCourses([]);
        const apiErrorMsg = apiError?.response?.data?.error || apiError?.message;
        if (apiErrorMsg) {
          setError(`Warning: ${apiErrorMsg}. Some features may not work without API keys.`);
        }
      }
      
      setLoadingStage(null);
      setActiveTab("jobs"); // Switch to jobs tab after successful upload
    } catch (e: any) {
      console.error("Upload error:", e);
      const errorMsg = e?.response?.data?.error || e?.message || "Something went wrong";
      const details = e?.response?.data?.details;
      const fullError = details ? `${errorMsg}: ${details}` : errorMsg;
      setError(fullError);
      setLoadingStage(null);
      
      // Reset state on error
      setProfile(null);
      setJobs([]);
      setGaps([]);
      setCourses([]);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1>Resume Intelligence</h1>
        <p>
          Choose your learning path to advance your career with AI-powered guidance.
        </p>
      </header>

      {/* Initial Main Section Navigation - Always Visible */}
      <section className="card main-nav">
        <h2>Choose Your Path</h2>
        <div className="main-sections">
          <button
            className={`main-section ${activeSection === "career" ? "active" : ""}`}
            onClick={() => setActiveSection("career")}
          >
            <div className="section-icon">🎯</div>
            <div className="section-content">
              <h3>Career System</h3>
              <p>Upload resume for job recommendations, skill gap analysis, and career guidance</p>
            </div>
          </button>
          <button
            className={`main-section ${activeSection === "learning-paths" ? "active" : ""}`}
            onClick={() => setActiveSection("learning-paths")}
          >
            <div className="section-icon">🚀</div>
            <div className="section-content">
              <h3>Learning Paths</h3>
              <p>Browse interactive roadmaps and structured learning journeys</p>
            </div>
          </button>
          <button
            className={`main-section ${activeSection === "interview-prep" ? "active" : ""}`}
            onClick={() => setActiveSection("interview-prep")}
          >
            <div className="section-icon">🎤</div>
            <div className="section-content">
              <h3>Interview Preparation</h3>
              <p>Practice questions, mock interviews, and preparation guides</p>
            </div>
          </button>
        </div>
      </section>

      {/* Conditional Content Based on Active Section */}
      {activeSection === "career" && (
        <div>
          <section className="card upload-card">
            <h2>📄 Upload Your Resume</h2>
            <p>Get personalized job recommendations, skill gap analysis, and learning paths.</p>
            <div className="upload-row">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button disabled={!file || !!loadingStage} onClick={handleUpload}>
                {loadingStage ? loadingStage + "..." : "Analyze Resume"}
              </button>
            </div>
            {error && <p className="error">{error}</p>}
          </section>

          {profile && (
            <div>
              <div className="tabs-container">
                <button
                  className={`tab ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  Profile
                </button>
                <button
                  className={`tab ${activeTab === "jobs" ? "active" : ""}`}
                  onClick={() => setActiveTab("jobs")}
                  disabled={jobs.length === 0}
                >
                  Job Recommendations {jobs.length > 0 && `(${jobs.length})`}
                </button>
                <button
                  className={`tab ${activeTab === "gaps" ? "active" : ""}`}
                  onClick={() => setActiveTab("gaps")}
                  disabled={gaps.length === 0}
                >
                  Skill Gaps {gaps.length > 0 && `(${gaps.length})`}
                </button>
                <button
                  className={`tab ${activeTab === "learning" ? "active" : ""}`}
                  onClick={() => setActiveTab("learning")}
                  disabled={gaps.filter(g => g.learningPath).length === 0}
                >
                  Learning Paths {gaps.filter(g => g.learningPath).length > 0 && `(${gaps.filter(g => g.learningPath).length})`}
                </button>
                <button
                  className={`tab ${activeTab === "certifications" ? "active" : ""}`}
                  onClick={() => setActiveTab("certifications")}
                  disabled={courses.length === 0}
                >
                  Certifications {courses.length > 0 && `(${courses.length})`}
                </button>
              </div>

              <section className="card tab-content">
                {activeTab === "profile" && (
                  <div>
                    <h2>📋 Extracted Skills from Resume</h2>
                    <p className="section-description">
                      {profile.skills.length} technical skills detected from your resume
                    </p>
                    <div className="profile-skills-only">
                      <div className="chips">
                        {profile.skills.map((s) => (
                          <span key={s} className="chip">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "jobs" && (
                  <div>
                    <h2>Recommended Jobs</h2>
                    {jobs.length === 0 ? (
                      <p className="muted">No jobs found. Try uploading a resume first.</p>
                    ) : (
                      <div className="jobs-grid">
                        {jobs.map((job) => (
                          <div key={job.id} className="job-card">
                            <div className="job-header">
                              <h3>{job.title}</h3>
                              <div className="job-meta">
                                <span className="company">{job.company}</span>
                                <span className="location">{job.location}</span>
                                <span className="source">{job.source}</span>
                              </div>
                            </div>
                            <p className="job-description">
                              {job.description?.substring(0, 150) || "No description available"}
                              {job.description && job.description.length > 150 && "..."}
                            </p>
                            {job.url && (
                              <a
                                href={job.url}
                                target="_blank"
                                rel="noreferrer"
                                className="job-link"
                              >
                                View Job →
                              </a>
                            )}
                            {job.missingSkills && job.missingSkills.length > 0 && (
                              <div className="missing-skills">
                                <small>Missing skills: {job.missingSkills.slice(0, 3).join(", ")}</small>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "gaps" && (
                  <div>
                    <h2>Skill Gaps Analysis</h2>
                    {gaps.length === 0 ? (
                      <p className="muted">No skill gaps found. Upload a resume to see analysis.</p>
                    ) : (
                      <div className="gaps-grid">
                        {gaps.map((gap) => (
                          <div key={gap.skill} className="gap-card">
                            <div className="gap-header">
                              <h3>{gap.skill}</h3>
                              <span className={`priority ${gap.priority}`}>
                                {gap.priority.toUpperCase()}
                              </span>
                            </div>
                            <p>{gap.reason}</p>
                            {gap.learningPath && (
                              <button
                                className="explore-btn"
                                onClick={() => {
                                  // Switch to the learning tab within career section
                                  setActiveTab("learning");
                                  // Scroll to the specific skill's learning path card
                                  setTimeout(() => {
                                    const element = document.querySelector(`[data-skill="${gap.skill.toLowerCase()}"]`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      // Add a highlight effect
                                      element.classList.add('highlight-flash');
                                      setTimeout(() => element.classList.remove('highlight-flash'), 2000);
                                    }
                                  }, 100);
                                }}
                              >
                                View Learning Path →
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "learning" && (
                  <div>
                    <h2>Personalized Learning Paths</h2>
                    {gaps.filter(g => g.learningPath).length === 0 ? (
                      <p className="muted">No learning paths available. Complete skill gap analysis first.</p>
                    ) : (
                      <div className="learning-paths-grid">
                        {gaps
                          .filter(g => g.learningPath)
                          .map((gap, index) => (
                            <LearningPathCard
                              key={gap.skill}
                              gap={gap}
                              currentSkills={profile?.skills || []}
                              index={index}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "certifications" && (
                  <div>
                    <h2>🎓 Courses & Certifications</h2>
                    <p className="section-description">
                      Comprehensive learning options including free courses, premium paid courses, and top-recognized certifications that add significant value to your resume.
                    </p>

                    {courses.length === 0 ? (
                      <p className="muted">No courses found. Upload a resume to see recommendations.</p>
                    ) : (
                      <div className="courses-grid">
                        {courses.map((c) => (
                          <div key={c.skill} className="course-skill">
                            <h3>{c.skill}</h3>

                            {/* Top Resume-Value Certifications */}
                            {c.certification.length > 0 && (
                              <div className="course-section">
                                <h4>🏆 Top Resume-Value Certifications</h4>
                                <div className="certifications-list">
                                  {c.certification.map((course, index) => (
                                    <div key={course.url} className={`certification-card ${course.resumeValue || 'standard'}`}>
                                      <div className="cert-header">
                                        <div className="cert-title-section">
                                          <h5>{course.title}</h5>
                                          <div className="cert-provider">{course.provider}</div>
                                        </div>
                                        <div className="cert-badges">
                                          {course.resumeValue === 'excellent' && (
                                            <span className="badge excellent">⭐ Top Resume Value</span>
                                          )}
                                          {course.resumeValue === 'good' && (
                                            <span className="badge good">✅ High Value</span>
                                          )}
                                          {course.credibility === 'high' && (
                                            <span className="badge credibility">🏆 Industry Recognized</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="cert-details">
                                        {course.duration && (
                                          <span className="cert-detail">⏱️ {course.duration}</span>
                                        )}
                                        {course.cost && (
                                          <span className="cert-detail">💰 {course.cost}</span>
                                        )}
                                        {course.skills && course.skills.length > 0 && (
                                          <div className="cert-skills">
                                            <strong>Skills:</strong> {course.skills.join(', ')}
                                          </div>
                                        )}
                                      </div>

                                      <a
                                        href={course.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="cert-link-btn"
                                      >
                                        View Certification →
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Paid Premium Courses */}
                            {c.paid.length > 0 && (
                              <div className="course-section">
                                <h4>💎 Premium Paid Courses</h4>
                                <div className="paid-courses-list">
                                  {c.paid.map((course) => (
                                    <div key={course.url} className="paid-course-card">
                                      <div className="course-header">
                                        <h5>{course.title}</h5>
                                        <div className="course-meta">
                                          <span className="provider">{course.provider}</span>
                                          <span className="cost">{course.cost}</span>
                                        </div>
                                      </div>
                                      <div className="course-details">
                                        {course.duration && <span>⏱️ {course.duration}</span>}
                                        {course.credibility === 'high' && <span className="credibility-high">🏆 High Credibility</span>}
                                      </div>
                                      <a
                                        href={course.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="course-link-btn"
                                      >
                                        Enroll Now →
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Free Courses */}
                            {c.free.length > 0 && (
                              <div className="course-section">
                                <h4>🆓 Free Courses</h4>
                                <div className="free-courses-list">
                                  {c.free.map((course) => (
                                    <div key={course.url} className="free-course-card">
                                      <div className="course-header">
                                        <h5>{course.title}</h5>
                                        <div className="course-meta">
                                          <span className="provider">{course.provider}</span>
                                          {course.credibility === 'high' && <span className="credibility-badge">🏆</span>}
                                        </div>
                                      </div>
                                      <div className="course-details">
                                        {course.duration && <span>⏱️ {course.duration}</span>}
                                        {course.resumeValue === 'good' && <span className="value-badge">✅ Good Value</span>}
                                      </div>
                                      <a
                                        href={course.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="course-link-btn free"
                                      >
                                        Start Learning →
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {c.free.length === 0 && c.paid.length === 0 && c.certification.length === 0 && (
                              <p className="muted">No courses available for this skill.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Resume Value Guide */}
                    <div className="resume-guide">
                      <h3>💼 Resume Impact Guide</h3>
                      <div className="guide-content">
                        <div className="guide-item">
                          <h4>🏆 Top Resume-Value Certifications</h4>
                          <p>Industry-recognized certifications from Google, AWS, Microsoft, etc. Can increase job offers by 20-50%.</p>
                          <ul>
                            <li>AWS Certified Solutions Architect</li>
                            <li>Google Cloud Professional Certificates</li>
                            <li>Microsoft Azure Certifications</li>
                            <li>Meta React Developer Certificate</li>
                          </ul>
                        </div>

                        <div className="guide-item">
                          <h4>💎 Premium Paid Courses</h4>
                          <p>High-quality courses from Udemy, LinkedIn Learning, Coursera. Great for structured learning.</p>
                          <ul>
                            <li>Hands-on projects and assignments</li>
                            <li>Certificate of completion</li>
                            <li>Lifetime access to materials</li>
                            <li>Instructor support</li>
                          </ul>
                        </div>

                        <div className="guide-item">
                          <h4>🆓 Free Courses</h4>
                          <p>Excellent free resources from Coursera, edX, freeCodeCamp. Perfect for self-paced learning.</p>
                          <ul>
                            <li>No cost barrier to entry</li>
                            <li>High-quality content from universities</li>
                            <li>Flexible learning schedule</li>
                            <li>Audit options available</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {activeSection === "learning-paths" && (
        <section className="card learning-paths-main">
          <h2>🚀 Interactive Learning Paths</h2>
          <p className="section-description">
            Browse and explore structured learning journeys with interactive knowledge graphs,
            detailed roadmaps, and direct links to high-quality resources.
          </p>

          {/* Search Bar */}
          <div className="learning-paths-search">
            <div className="search-bar">
              <input
                type="text"
                placeholder="🔍 Search skills (e.g., JavaScript, Python, React...)"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="search-results-count">
                Showing {AVAILABLE_SKILLS.filter(p => 
                  p.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).length} of {AVAILABLE_SKILLS.length} skills
              </p>
            )}
          </div>

          {/* Popular Learning Paths Grid */}
          <div className="popular-paths">
            <h3>🚀 Popular Learning Paths</h3>
            <div className="learning-paths-grid">
              {/* Static learning path cards for browsing */}
              {AVAILABLE_SKILLS
                .filter(pathInfo => {
                // Filter based on search query
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return pathInfo.skill.toLowerCase().includes(query) ||
                       pathInfo.description.toLowerCase().includes(query);
              })
              .map((pathInfo, index) => {
                // Find if this path has been loaded
                const loadedPath = standalonePaths.find(p => p.skill === pathInfo.skill);
                
                // Debug logging for React specifically
                if (pathInfo.skill === 'React') {
                  console.log('🔍 React card render:', {
                    skill: pathInfo.skill,
                    hasLoadedPath: !!loadedPath,
                    isExpanded: loadedPath?.expanded,
                    hasData: !!loadedPath?.data,
                    isLoading: loadedPath?.loading,
                    allPaths: standalonePaths.map(p => ({ skill: p.skill, expanded: p.expanded, hasData: !!p.data }))
                  });
                }
                
                return (
                  <div key={pathInfo.skill} className="learning-path-browse-card-wrapper">
                    <div className="learning-path-browse-card">
                      <div className="path-header">
                        <div className="path-icon">{pathInfo.icon}</div>
                        <div className="path-meta">
                          <span className={`difficulty ${pathInfo.difficulty.toLowerCase()}`}>{pathInfo.difficulty}</span>
                        </div>
                      </div>
                      <h4>{pathInfo.skill}</h4>
                      <p>{pathInfo.description}</p>
                      <div className="path-actions">
                        <button
                          className="explore-btn"
                          onClick={() => loadStandaloneLearningPath(pathInfo.skill)}
                          disabled={loadedPath?.loading}
                        >
                          {loadedPath?.loading ? '⏳ Loading...' : (loadedPath?.expanded ? '🔽 Collapse' : '🔍 Explore Path')}
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded content appears directly below the card */}
                    {loadedPath && loadedPath.expanded && loadedPath.data ? (
                      <div className="inline-learning-path-content">
                        <div className="learning-path-stats">
                          <div className="stat">
                            <span className="stat-label">Topics</span>
                            <span className="stat-value">{loadedPath.data.nodes?.length || 0}</span>
                          </div>
                        </div>

                        {/* Knowledge Graph Section */}
                        {loadedPath.data.knowledgeGraph && loadedPath.data.knowledgeGraph.nodes && loadedPath.data.knowledgeGraph.nodes.length > 0 && (
                          <div className="learning-path-knowledge-graph">
                            <h4>Interactive Knowledge Graph</h4>
                            <div className="knowledge-graph-description">
                              <p>Click on concept circles to explore sub-topics and resources. Drag nodes to rearrange the graph.</p>
                            </div>
                            <KnowledgeGraphVisualization
                              nodes={loadedPath.data.knowledgeGraph.nodes}
                              edges={loadedPath.data.knowledgeGraph.edges || []}
                              skillPath={loadedPath.data.knowledgeGraph.skillPath || []}
                            />
                          </div>
                        )}

                        {/* Roadmap Section (if available) */}
                        {loadedPath.data.roadmap && Array.isArray(loadedPath.data.roadmap) && loadedPath.data.roadmap.length > 0 && (
                          <div className="learning-path-roadmap">
                            <h4>Learning Roadmap</h4>
                            <div className="roadmap-steps">
                              {loadedPath.data.roadmap.map((step: any, idx: number) => (
                                <div key={idx} className={`roadmap-step ${step?.priority === 'high' ? 'priority-high' : ''}`}>
                                  <div className="step-header">
                                    <h5>{step?.title || `Step ${idx + 1}`}</h5>
                                    {step?.priority === 'high' && (
                                      <span className="step-priority">🔥 Interview Focus</span>
                                    )}
                                  </div>
                                  <p className="step-description">{step?.description || 'No description available'}</p>
                                  {step?.resources && Array.isArray(step.resources) && step.resources.length > 0 && (
                                    <div className="step-resources">
                                      <strong>Resources:</strong>
                                      <ul>
                                        {step.resources.map((resource: any, rIdx: number) => (
                                          <li key={rIdx}>
                                            <a href={resource?.url} target="_blank" rel="noopener noreferrer">
                                              {resource?.title || 'Untitled Resource'}
                                            </a>
                                            {resource?.type && <span className="resource-type">({resource.type})</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : loadedPath && loadedPath.expanded && !loadedPath.data ? (
                      <div className="inline-learning-path-content">
                        <p style={{ color: '#fca5a5', textAlign: 'center', padding: '2rem' }}>
                          ⚠️ Failed to load learning path data. Please try again.
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            
            {/* No results message */}
            {searchQuery && [
              { skill: 'JavaScript', description: 'Master modern JavaScript development', icon: '🟨', difficulty: 'Intermediate' },
              { skill: 'React', description: 'Build interactive user interfaces', icon: '⚛️', difficulty: 'Intermediate' },
              { skill: 'Python', description: 'Versatile programming for data and automation', icon: '🐍', difficulty: 'Beginner' },
              { skill: 'Node.js', description: 'Server-side JavaScript development', icon: '🟩', difficulty: 'Intermediate' },
              { skill: 'AWS', description: 'Cloud computing and deployment', icon: '☁️', difficulty: 'Advanced' },
              { skill: 'Machine Learning', description: 'AI and predictive modeling', icon: '🤖', difficulty: 'Advanced' },
              { skill: 'Docker', description: 'Containerization and deployment', icon: '🐳', difficulty: 'Intermediate' },
              { skill: 'SQL', description: 'Database design and querying', icon: '🗄️', difficulty: 'Beginner' },
              { skill: 'TypeScript', description: 'Type-safe JavaScript development', icon: '🔷', difficulty: 'Intermediate' },
              { skill: 'Git', description: 'Version control and collaboration', icon: '📚', difficulty: 'Beginner' },
              { skill: 'REST APIs', description: 'API design and development', icon: '🔗', difficulty: 'Intermediate' },
              { skill: 'Testing', description: 'Quality assurance and testing', icon: '🧪', difficulty: 'Intermediate' }
            ].filter(p => 
              p.skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 && (
              <div className="no-results">
                <p>🔍 No skills found matching "{searchQuery}"</p>
                <button className="clear-search-btn-large" onClick={() => setSearchQuery("")}>
                  Clear Search
                </button>
              </div>
            )}
          </div>

          {/* Personalized Learning Paths (if user has uploaded resume) */}
          {profile && gaps.filter(g => g.learningPath).length > 0 && (
            <div className="personalized-paths">
              <h3>🎯 Your Personalized Learning Paths</h3>
              <p>Based on your resume and skill gaps</p>
              <div className="learning-paths-grid">
                {gaps
                  .filter(g => g.learningPath)
                  .map((gap, index) => (
                    <LearningPathCard
                      key={gap.skill}
                      gap={gap}
                      currentSkills={profile?.skills || []}
                      index={index}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Call to action if no profile */}
          {!profile && (
            <div className="cta-section">
              <div className="cta-content">
                <div className="cta-icon">📄</div>
                <h3>Get Personalized Learning Paths</h3>
                <p>Upload your resume in the Career System to unlock personalized learning paths based on your skills and gaps.</p>
                <button
                  className="primary-btn"
                  onClick={() => setActiveSection("career")}
                >
                  Upload Resume →
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeSection === "interview-prep" && (
        <section className="card interview-prep-main">
          <h2>🎤 Interview Preparation Center</h2>
          <p className="section-description">
            Prepare for technical interviews with practice questions, coding challenges,
            behavioral interview tips, and company-specific preparation guides.
          </p>

          <div className="interview-sections">
            <div className="interview-category">
              <div className="category-icon">💻</div>
              <h3>Technical Interviews</h3>
              <p>Practice coding problems, system design, and algorithmic challenges</p>
              <button className="category-btn" disabled>
                Coming Soon
              </button>
            </div>

            <div className="interview-category">
              <div className="category-icon">🗣️</div>
              <h3>Behavioral Interviews</h3>
              <p>Master STAR method, leadership questions, and communication skills</p>
              <button className="category-btn" disabled>
                Coming Soon
              </button>
            </div>

            <div className="interview-category">
              <div className="category-icon">🏢</div>
              <h3>Company-Specific Prep</h3>
              <p>FAANG, startups, and industry-specific interview preparation</p>
              <button className="category-btn" disabled>
                Coming Soon
              </button>
            </div>

            <div className="interview-category">
              <div className="category-icon">📊</div>
              <h3>Mock Interviews</h3>
              <p>Practice interviews with AI feedback and performance analysis</p>
              <button className="category-btn" disabled>
                Coming Soon
              </button>
            </div>
          </div>

          <div className="coming-soon-notice">
            <div className="notice-icon">🚧</div>
            <h3>Interview Preparation Features</h3>
            <p>We're building comprehensive interview preparation tools including:</p>
            <ul>
              <li>✅ Coding practice problems with solutions</li>
              <li>✅ System design interview prep</li>
              <li>✅ Behavioral interview question bank</li>
              <li>✅ Company-specific interview guides</li>
              <li>✅ Mock interview sessions with AI feedback</li>
              <li>✅ Performance tracking and analytics</li>
            </ul>
            <p className="notice-text">Stay tuned for updates!</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default App;


