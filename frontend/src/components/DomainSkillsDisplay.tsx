import React, { useState } from 'react';

interface SkillData {
  skill: string;
  frequency: number;
  percentage: number;
  priority: 'critical' | 'important' | 'nice-to-have';
}

interface JobRole {
  title: string;
  count: number;
  avgSalary?: string;
}

interface LearningPath {
  foundation: string[];
  core: string[];
  advanced: string[];
}

interface DomainAnalysis {
  domain: string;
  totalJobs: number;
  topSkills: SkillData[];
  learningPath: LearningPath;
  jobRoles: JobRole[];
}

interface DomainSkillsDisplayProps {
  analysis: DomainAnalysis;
  onBackToDomains: () => void;
}

const DomainSkillsDisplay: React.FC<DomainSkillsDisplayProps> = ({ 
  analysis, 
  onBackToDomains 
}) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'path' | 'jobs'>('skills');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#e74c3c';
      case 'important': return '#f39c12';
      case 'nice-to-have': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔥';
      case 'important': return '⭐';
      case 'nice-to-have': return '💡';
      default: return '📝';
    }
  };

  const domainNames = {
    'frontend': 'Frontend Development',
    'backend': 'Backend Development',
    'fullstack': 'Full Stack Development',
    'data-science': 'Data Science',
    'mobile': 'Mobile Development',
    'devops': 'DevOps/Cloud',
    'uiux': 'UI/UX Design'
  };

  return (
    <div className="domain-skills-display">
      {/* Header */}
      <div className="analysis-header">
        <button className="back-btn" onClick={onBackToDomains}>
          ← Back to Domains
        </button>
        <div className="domain-info">
          <h2>📊 {domainNames[analysis.domain as keyof typeof domainNames] || analysis.domain}</h2>
          <p className="analysis-summary">
            Based on analysis of <strong>{analysis.totalJobs} real job postings</strong>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="analysis-tabs">
        <button 
          className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          🎯 Required Skills
        </button>
        <button 
          className={`tab ${activeTab === 'path' ? 'active' : ''}`}
          onClick={() => setActiveTab('path')}
        >
          📚 Learning Path
        </button>
        <button 
          className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          💼 Job Opportunities
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'skills' && (
          <div className="skills-analysis">
            <div className="skills-intro">
              <h3>🔥 Most In-Demand Skills</h3>
              <p>These skills appear most frequently in {analysis.domain} job postings:</p>
            </div>

            <div className="skills-grid">
              {analysis.topSkills.map((skill, index) => (
                <div key={skill.skill} className="skill-card">
                  <div className="skill-rank">#{index + 1}</div>
                  <div className="skill-info">
                    <div className="skill-header">
                      <span className="skill-icon">
                        {getPriorityIcon(skill.priority)}
                      </span>
                      <h4>{skill.skill}</h4>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(skill.priority) }}
                      >
                        {skill.priority}
                      </span>
                    </div>
                    <div className="skill-stats">
                      <div className="stat">
                        <span className="stat-label">Frequency:</span>
                        <span className="stat-value">{skill.frequency} jobs</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Percentage:</span>
                        <span className="stat-value">{skill.percentage}%</span>
                      </div>
                    </div>
                    <div className="skill-bar">
                      <div 
                        className="skill-progress"
                        style={{ 
                          width: `${skill.percentage}%`,
                          backgroundColor: getPriorityColor(skill.priority)
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="skills-summary">
              <div className="priority-legend">
                <h4>Priority Levels:</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <span style={{ color: '#e74c3c' }}>🔥 Critical</span>
                    <span>Must-have skills (60%+ of jobs)</span>
                  </div>
                  <div className="legend-item">
                    <span style={{ color: '#f39c12' }}>⭐ Important</span>
                    <span>Highly valued skills (30%+ of jobs)</span>
                  </div>
                  <div className="legend-item">
                    <span style={{ color: '#27ae60' }}>💡 Nice-to-have</span>
                    <span>Bonus skills (less than 30%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'path' && (
          <div className="learning-path">
            <div className="path-intro">
              <h3>📚 Recommended Learning Path</h3>
              <p>Follow this structured path to master {analysis.domain} skills:</p>
            </div>

            <div className="path-stages">
              <div className="stage foundation">
                <div className="stage-header">
                  <span className="stage-icon">🏗️</span>
                  <h4>Foundation (Months 1-2)</h4>
                  <span className="stage-badge">Start Here</span>
                </div>
                <div className="stage-skills">
                  {analysis.learningPath.foundation.map((skill, index) => (
                    <div key={index} className="path-skill">
                      <span className="skill-number">{index + 1}</span>
                      <span className="skill-name">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stage core">
                <div className="stage-header">
                  <span className="stage-icon">⚡</span>
                  <h4>Core Skills (Months 3-4)</h4>
                  <span className="stage-badge">Build Expertise</span>
                </div>
                <div className="stage-skills">
                  {analysis.learningPath.core.map((skill, index) => (
                    <div key={index} className="path-skill">
                      <span className="skill-number">{index + 1}</span>
                      <span className="skill-name">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stage advanced">
                <div className="stage-header">
                  <span className="stage-icon">🚀</span>
                  <h4>Advanced (Months 5-6)</h4>
                  <span className="stage-badge">Master Level</span>
                </div>
                <div className="stage-skills">
                  {analysis.learningPath.advanced.map((skill, index) => (
                    <div key={index} className="path-skill">
                      <span className="skill-number">{index + 1}</span>
                      <span className="skill-name">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="path-timeline">
              <h4>⏱️ Estimated Timeline: 4-6 months to job-ready</h4>
              <div className="timeline-tips">
                <div className="tip">
                  <span className="tip-icon">💡</span>
                  <span>Study 2-3 hours daily for consistent progress</span>
                </div>
                <div className="tip">
                  <span className="tip-icon">🛠️</span>
                  <span>Build projects after each stage to practice</span>
                </div>
                <div className="tip">
                  <span className="tip-icon">🤝</span>
                  <span>Join communities and contribute to open source</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="job-opportunities">
            <div className="jobs-intro">
              <h3>💼 Job Opportunities</h3>
              <p>Popular job roles in {analysis.domain} based on current market data:</p>
            </div>

            <div className="jobs-list">
              {analysis.jobRoles.map((role, index) => (
                <div key={role.title} className="job-role-card">
                  <div className="role-rank">#{index + 1}</div>
                  <div className="role-info">
                    <h4>{role.title}</h4>
                    <div className="role-stats">
                      <div className="stat">
                        <span className="stat-icon">📊</span>
                        <span className="stat-text">{role.count} openings found</span>
                      </div>
                      {role.avgSalary && (
                        <div className="stat">
                          <span className="stat-icon">💰</span>
                          <span className="stat-text">{role.avgSalary}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="role-demand">
                    <span className="demand-badge">
                      {role.count > 20 ? 'High Demand' : role.count > 10 ? 'Medium Demand' : 'Growing Field'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="jobs-summary">
              <div className="market-insights">
                <h4>📈 Market Insights</h4>
                <div className="insights-grid">
                  <div className="insight">
                    <span className="insight-icon">🎯</span>
                    <div>
                      <strong>Total Opportunities:</strong>
                      <span>{analysis.totalJobs} active job postings</span>
                    </div>
                  </div>
                  <div className="insight">
                    <span className="insight-icon">📊</span>
                    <div>
                      <strong>Market Trend:</strong>
                      <span>Growing demand for {analysis.domain} skills</span>
                    </div>
                  </div>
                  <div className="insight">
                    <span className="insight-icon">⏰</span>
                    <div>
                      <strong>Time to Job-Ready:</strong>
                      <span>4-6 months with consistent learning</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="secondary-btn" onClick={onBackToDomains}>
          🔄 Try Another Domain
        </button>
        <button className="primary-btn">
          🚀 Start Learning Path
        </button>
      </div>
    </div>
  );
};

export default DomainSkillsDisplay;