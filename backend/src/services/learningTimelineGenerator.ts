import { LearningPath } from './skillGapEngine';

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

export class LearningTimelineGenerator {
  
  /**
   * Generate a personalized learning timeline
   */
  generateTimeline(
    learningPath: LearningPath,
    duration: '3-month' | '6-month' | '12-month',
    hoursPerWeek: number = 10,
    startDate?: Date
  ): LearningTimeline {
    const start = startDate || new Date();
    const weeks = this.getDurationInWeeks(duration);
    const totalHours = learningPath.totalTime || 40;
    
    // Adjust hours per week based on duration
    const adjustedHoursPerWeek = Math.min(hoursPerWeek, Math.ceil(totalHours / weeks));
    
    const weeklyGoals = this.generateWeeklyGoals(
      learningPath,
      weeks,
      adjustedHoursPerWeek,
      start
    );
    
    const checkpoints = this.generateCheckpoints(learningPath, weeks);
    const milestones = this.generateMilestones(learningPath, weeks);
    
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + (weeks * 7));
    
    return {
      skill: learningPath.skill,
      duration,
      totalWeeks: weeks,
      totalHours,
      hoursPerWeek: adjustedHoursPerWeek,
      startDate: start.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      weeklyGoals,
      checkpoints,
      milestones,
      studyRecommendations: this.generateStudyRecommendations(learningPath)
    };
  }
  
  private getDurationInWeeks(duration: '3-month' | '6-month' | '12-month'): number {
    switch (duration) {
      case '3-month': return 12;
      case '6-month': return 24;
      case '12-month': return 48;
    }
  }
  
  private generateWeeklyGoals(
    learningPath: LearningPath,
    totalWeeks: number,
    hoursPerWeek: number,
    startDate: Date
  ): WeeklyGoal[] {
    const goals: WeeklyGoal[] = [];
    const nodes = learningPath.knowledgeGraph?.nodes || [];
    
    // Distribute nodes across weeks
    const nodesPerWeek = Math.ceil(nodes.length / totalWeeks);
    
    for (let week = 1; week <= totalWeeks; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + ((week - 1) * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Get nodes for this week
      const startIdx = (week - 1) * nodesPerWeek;
      const endIdx = Math.min(startIdx + nodesPerWeek, nodes.length);
      const weekNodes = nodes.slice(startIdx, endIdx);
      
      const topics = weekNodes.map(node => node.title || 'Topic');
      
      // Generate mini project for this week
      const miniProject = this.generateMiniProject(
        learningPath.skill,
        week,
        totalWeeks,
        topics,
        weekNodes
      );
      
      // Check if this is a milestone week
      const milestone = this.getMilestoneForWeek(week, totalWeeks);
      
      goals.push({
        week,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        topics,
        hoursPerWeek,
        miniProject,
        milestone
      });
    }
    
    return goals;
  }
  
  private generateMiniProject(
    skill: string,
    week: number,
    totalWeeks: number,
    topics: string[],
    nodes: any[]
  ) {
    // Determine difficulty based on week progress
    const progress = week / totalWeeks;
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (progress > 0.66) difficulty = 'advanced';
    else if (progress > 0.33) difficulty = 'intermediate';
    
    // Get project from node if available
    const nodeWithProject = nodes.find(node => node.projectMilestone);
    if (nodeWithProject && nodeWithProject.projectMilestone) {
      return {
        title: nodeWithProject.projectMilestone.title,
        description: nodeWithProject.projectMilestone.description,
        objectives: nodeWithProject.projectMilestone.deliverables || [
          `Apply ${topics[0] || 'concepts'} in practice`,
          'Build a working implementation',
          'Test and debug your solution'
        ],
        estimatedHours: nodeWithProject.projectMilestone.estimatedTime || 5,
        difficulty: nodeWithProject.projectMilestone.difficulty
      };
    }
    
    // Generate default mini project based on topics
    const mainTopic = topics[0] || skill;
    const projectTemplates = {
      beginner: {
        title: `Build a Simple ${mainTopic} Application`,
        description: `Create a basic project to practice ${mainTopic} fundamentals. Focus on understanding core concepts and syntax.`,
        objectives: [
          `Implement basic ${mainTopic} features`,
          'Write clean, readable code',
          'Test your implementation',
          'Document your learning'
        ]
      },
      intermediate: {
        title: `${mainTopic} Feature Implementation`,
        description: `Build a more complex feature using ${mainTopic}. Integrate multiple concepts and best practices.`,
        objectives: [
          `Combine ${topics.slice(0, 2).join(' and ')}`,
          'Follow design patterns',
          'Handle edge cases',
          'Optimize performance'
        ]
      },
      advanced: {
        title: `Advanced ${mainTopic} Project`,
        description: `Create a production-ready implementation showcasing advanced ${mainTopic} techniques.`,
        objectives: [
          `Master advanced ${mainTopic} concepts`,
          'Implement scalable architecture',
          'Add comprehensive testing',
          'Deploy and document'
        ]
      }
    };
    
    const template = projectTemplates[difficulty];
    return {
      title: template.title,
      description: template.description,
      objectives: template.objectives,
      estimatedHours: difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 5 : 8,
      difficulty
    };
  }
  
  private getMilestoneForWeek(week: number, totalWeeks: number): string | undefined {
    const progress = week / totalWeeks;
    
    if (week === Math.floor(totalWeeks * 0.25)) {
      return '🎯 25% Complete - Foundation Established';
    } else if (week === Math.floor(totalWeeks * 0.5)) {
      return '🚀 50% Complete - Halfway There!';
    } else if (week === Math.floor(totalWeeks * 0.75)) {
      return '⭐ 75% Complete - Advanced Topics Mastered';
    } else if (week === totalWeeks) {
      return '🏆 100% Complete - Skill Mastered!';
    }
    
    return undefined;
  }
  
  private generateCheckpoints(learningPath: LearningPath, totalWeeks: number): Checkpoint[] {
    const checkpoints: Checkpoint[] = [];
    const nodes = learningPath.knowledgeGraph?.nodes || [];
    
    // Create checkpoints at 25%, 50%, 75%, and 100%
    const checkpointWeeks = [
      Math.floor(totalWeeks * 0.25),
      Math.floor(totalWeeks * 0.5),
      Math.floor(totalWeeks * 0.75),
      totalWeeks
    ];
    
    const checkpointTitles = [
      'Foundation Checkpoint',
      'Intermediate Checkpoint',
      'Advanced Checkpoint',
      'Final Assessment'
    ];
    
    const checkpointDescriptions = [
      'Verify understanding of fundamental concepts',
      'Build a small project using core skills',
      'Implement advanced features and optimizations',
      'Complete a comprehensive capstone project'
    ];
    
    checkpointWeeks.forEach((week, index) => {
      const nodeIndex = Math.floor((nodes.length / 4) * (index + 1)) - 1;
      const node = nodes[nodeIndex] || nodes[nodes.length - 1];
      
      checkpoints.push({
        week,
        title: checkpointTitles[index],
        description: checkpointDescriptions[index],
        deliverable: node?.projectMilestone?.title || `${learningPath.skill} Project ${index + 1}`,
        assessmentCriteria: [
          'Code quality and best practices',
          'Functionality and features',
          'Documentation and testing',
          'Performance and optimization'
        ]
      });
    });
    
    return checkpoints;
  }
  
  private generateMilestones(learningPath: LearningPath, totalWeeks: number) {
    return [
      {
        week: Math.floor(totalWeeks * 0.25),
        title: 'Beginner Level Achieved',
        achievement: `Completed foundational ${learningPath.skill} concepts`
      },
      {
        week: Math.floor(totalWeeks * 0.5),
        title: 'Intermediate Level Achieved',
        achievement: `Built first ${learningPath.skill} project`
      },
      {
        week: Math.floor(totalWeeks * 0.75),
        title: 'Advanced Level Achieved',
        achievement: `Mastered advanced ${learningPath.skill} techniques`
      },
      {
        week: totalWeeks,
        title: 'Expert Level Achieved',
        achievement: `Ready for professional ${learningPath.skill} roles`
      }
    ];
  }
  
  private generateStudyRecommendations(learningPath: LearningPath) {
    return {
      bestTimeToStudy: [
        'Early morning (6-8 AM) - Best for learning new concepts',
        'Evening (7-9 PM) - Good for practice and coding',
        'Weekends - Ideal for longer project work'
      ],
      studyTechniques: [
        '🎯 Pomodoro Technique: 25 min study + 5 min break',
        '📝 Active Recall: Test yourself without looking at notes',
        '🔄 Spaced Repetition: Review topics after 1 day, 3 days, 1 week',
        '💻 Learn by Doing: Code along with tutorials',
        '🤝 Teach Others: Explain concepts to solidify understanding'
      ],
      practiceProjects: [
        `Build a simple ${learningPath.skill} application`,
        `Contribute to open-source ${learningPath.skill} projects`,
        `Create a portfolio project showcasing your skills`,
        `Solve coding challenges on LeetCode/HackerRank`
      ]
    };
  }
  
  /**
   * Export timeline to calendar format (iCal)
   */
  exportToCalendar(timeline: LearningTimeline): string {
    let ical = 'BEGIN:VCALENDAR\n';
    ical += 'VERSION:2.0\n';
    ical += 'PRODID:-//Learning Timeline//EN\n';
    ical += `X-WR-CALNAME:${timeline.skill} Learning Plan\n`;
    ical += 'X-WR-TIMEZONE:UTC\n';
    
    // Add weekly goals as events
    timeline.weeklyGoals.forEach(goal => {
      const startDate = new Date(goal.startDate);
      const endDate = new Date(goal.endDate);
      
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:week-${goal.week}-${timeline.skill}@learningplan\n`;
      ical += `DTSTART:${this.formatDateForICal(startDate)}\n`;
      ical += `DTEND:${this.formatDateForICal(endDate)}\n`;
      ical += `SUMMARY:Week ${goal.week}: ${goal.topics.join(', ')}\n`;
      ical += `DESCRIPTION:Study ${goal.hoursPerWeek} hours this week\\n\\nTopics:\\n${goal.topics.join('\\n')}\n`;
      ical += 'END:VEVENT\n';
    });
    
    // Add checkpoints as events
    timeline.checkpoints.forEach(checkpoint => {
      const checkpointDate = new Date(timeline.startDate);
      checkpointDate.setDate(checkpointDate.getDate() + (checkpoint.week * 7));
      
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:checkpoint-${checkpoint.week}-${timeline.skill}@learningplan\n`;
      ical += `DTSTART:${this.formatDateForICal(checkpointDate)}\n`;
      ical += `SUMMARY:🎯 ${checkpoint.title}\n`;
      ical += `DESCRIPTION:${checkpoint.description}\\n\\nDeliverable: ${checkpoint.deliverable}\n`;
      ical += 'END:VEVENT\n';
    });
    
    ical += 'END:VCALENDAR\n';
    return ical;
  }
  
  private formatDateForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}
