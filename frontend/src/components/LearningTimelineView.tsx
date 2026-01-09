import React, { useState, useEffect } from 'react';
import { api } from '../api';

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

interface LearningTimelineViewProps {
  skill: string;
  currentSkills: string[];
}

export const LearningTimelineView: React.FC<LearningTimelineViewProps> = ({ skill, currentSkills }) => {
  const [timeline, setTimeline] = useState<LearningTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<'3-month' | '6-month' | '12-month'>('3-month');
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const response = await api.post('/skills/timeline', {
        skill,
        duration,
        hoursPerWeek,
        currentSkills
      });
      setTimeline(response.data.timeline);
    } catch (error) {
      console.error('Failed to load timeline:', error);
      alert('Failed to generate timeline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCalendar = async () => {
    try {
      const response = await api.post('/skills/timeline/export', {
        skill,
        duration,
        hoursPerWeek,
        currentSkills
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${skill}-learning-plan.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export timeline:', error);
      alert('Failed to export to calendar. Please try again.');
    }
  };

  return (
    <div className="learning-timeline-container">
      <div className="timeline-controls">
        <h4>📅 Generate Your Personalized Learning Timeline</h4>
        
        <div className="timeline-options">
          <div className="option-group">
            <label>Duration:</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value as any)}>
              <option value="3-month">3 Months (Fast Track)</option>
              <option value="6-month">6 Months (Balanced)</option>
              <option value="12-month">12 Months (Comprehensive)</option>
            </select>
          </div>

          <div className="option-group">
            <label>Hours per Week:</label>
            <input
              type="number"
              min="5"
              max="40"
              value={hoursPerWeek}
              onChange={(e) => setHoursPerWeek(parseInt(e.target.value) || 10)}
            />
          </div>

          <button className="generate-timeline-btn" onClick={loadTimeline} disabled={loading}>
            {loading ? '⏳ Generating...' : '🚀 Generate Timeline'}
          </button>
        </div>
      </div>

      {timeline && (
        <div className="timeline-content">
          <div className="timeline-header">
            <div className="timeline-stats">
              <div className="stat-box">
                <span className="stat-label">Total Duration</span>
                <span className="stat-value">{timeline.totalWeeks} weeks</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Hours</span>
                <span className="stat-value">{timeline.totalHours}h</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Weekly Commitment</span>
                <span className="stat-value">{timeline.hoursPerWeek}h/week</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Start Date</span>
                <span className="stat-value">{new Date(timeline.startDate).toLocaleDateString()}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">End Date</span>
                <span className="stat-value">{new Date(timeline.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            <button className="export-calendar-btn" onClick={exportToCalendar}>
              📥 Export to Calendar
            </button>
          </div>

          {/* Study Recommendations */}
          <div className="study-recommendations">
            <h5>💡 Study Tips & Best Practices</h5>
            <div className="recommendations-grid">
              <div className="recommendation-section">
                <h6>⏰ Best Times to Study</h6>
                <ul>
                  {timeline.studyRecommendations.bestTimeToStudy.map((time, idx) => (
                    <li key={idx}>{time}</li>
                  ))}
                </ul>
              </div>
              <div className="recommendation-section">
                <h6>📚 Study Techniques</h6>
                <ul>
                  {timeline.studyRecommendations.studyTechniques.map((technique, idx) => (
                    <li key={idx}>{technique}</li>
                  ))}
                </ul>
              </div>
              <div className="recommendation-section">
                <h6>💻 Practice Projects</h6>
                <ul>
                  {timeline.studyRecommendations.practiceProjects.map((project, idx) => (
                    <li key={idx}>{project}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Weekly Goals */}
          <div className="weekly-goals-section">
            <h5>📆 Weekly Learning Plan</h5>
            <div className="weeks-grid">
              {timeline.weeklyGoals.map((week) => (
                <div key={week.week} className={`week-card ${expandedWeek === week.week ? 'expanded' : ''}`}>
                  <div className="week-header" onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}>
                    <div className="week-title">
                      <span className="week-number">Week {week.week}</span>
                      {week.milestone && <span className="milestone-badge">{week.milestone}</span>}
                    </div>
                    <div className="week-meta">
                      <span>{week.startDate} - {week.endDate}</span>
                      <span>{week.hoursPerWeek}h/week</span>
                    </div>
                    <button className="expand-icon">{expandedWeek === week.week ? '▼' : '▶'}</button>
                  </div>

                  {expandedWeek === week.week && (
                    <div className="week-details">
                      <div className="week-topics">
                        <h6>📚 Topics to Cover:</h6>
                        <ul>
                          {week.topics.map((topic, idx) => (
                            <li key={idx}>{topic}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="mini-project-section">
                        <h6>💻 Mini Project for This Week:</h6>
                        <div className="mini-project-card">
                          <div className="project-header">
                            <h5>{week.miniProject.title}</h5>
                            <span className={`difficulty-badge ${week.miniProject.difficulty}`}>
                              {week.miniProject.difficulty}
                            </span>
                          </div>
                          <p className="project-description">{week.miniProject.description}</p>
                          <div className="project-meta">
                            <span>⏱️ {week.miniProject.estimatedHours} hours</span>
                          </div>
                          <div className="project-objectives">
                            <strong>Objectives:</strong>
                            <ul>
                              {week.miniProject.objectives.map((objective, idx) => (
                                <li key={idx}>{objective}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Checkpoints */}
          <div className="checkpoints-section">
            <h5>🎯 Assessment Checkpoints</h5>
            <div className="checkpoints-grid">
              {timeline.checkpoints.map((checkpoint, idx) => (
                <div key={idx} className="checkpoint-card">
                  <div className="checkpoint-header">
                    <span className="checkpoint-week">Week {checkpoint.week}</span>
                    <h6>{checkpoint.title}</h6>
                  </div>
                  <p>{checkpoint.description}</p>
                  <div className="checkpoint-deliverable">
                    <strong>Deliverable:</strong> {checkpoint.deliverable}
                  </div>
                  <div className="checkpoint-criteria">
                    <strong>Assessment Criteria:</strong>
                    <ul>
                      {checkpoint.assessmentCriteria.map((criteria, cidx) => (
                        <li key={cidx}>{criteria}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="milestones-section">
            <h5>🏆 Achievement Milestones</h5>
            <div className="milestones-timeline">
              {timeline.milestones.map((milestone, idx) => (
                <div key={idx} className="milestone-item">
                  <div className="milestone-marker">{idx + 1}</div>
                  <div className="milestone-content">
                    <div className="milestone-week">Week {milestone.week}</div>
                    <h6>{milestone.title}</h6>
                    <p>{milestone.achievement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};