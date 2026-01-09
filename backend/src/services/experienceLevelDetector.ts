// Experience Level Detection
// Improves matching by considering seniority level

export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'principal' | 'unknown';

export interface ExperienceLevelInfo {
  level: ExperienceLevel;
  confidence: number;
  yearsRequired: number | null;
  indicators: string[];
}

export class ExperienceLevelDetector {
  /**
   * Detect experience level from job title and description
   */
  static detect(title: string, description: string): ExperienceLevelInfo {
    const text = `${title} ${description}`.toLowerCase();
    const indicators: string[] = [];
    let level: ExperienceLevel = 'unknown';
    let confidence = 0;
    let yearsRequired: number | null = null;
    
    // Extract years of experience
    const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i);
    if (yearsMatch) {
      yearsRequired = parseInt(yearsMatch[1]);
      indicators.push(`${yearsRequired}+ years required`);
    }
    
    // Title-based detection (highest confidence)
    if (/\b(entry|entry-level|graduate|intern|trainee)\b/i.test(title)) {
      level = 'entry';
      confidence = 0.9;
      indicators.push('Entry level in title');
    } else if (/\b(junior|jr\.?)\b/i.test(title)) {
      level = 'junior';
      confidence = 0.9;
      indicators.push('Junior in title');
    } else if (/\b(senior|sr\.?)\b/i.test(title)) {
      level = 'senior';
      confidence = 0.9;
      indicators.push('Senior in title');
    } else if (/\b(lead|team lead|tech lead|technical lead)\b/i.test(title)) {
      level = 'lead';
      confidence = 0.9;
      indicators.push('Lead in title');
    } else if (/\b(principal|staff|architect|distinguished)\b/i.test(title)) {
      level = 'principal';
      confidence = 0.9;
      indicators.push('Principal/Staff in title');
    }
    
    // Years-based detection (if no title match)
    if (level === 'unknown' && yearsRequired !== null) {
      if (yearsRequired === 0 || yearsRequired === 1) {
        level = 'entry';
        confidence = 0.7;
      } else if (yearsRequired <= 2) {
        level = 'junior';
        confidence = 0.7;
      } else if (yearsRequired <= 5) {
        level = 'mid';
        confidence = 0.7;
      } else if (yearsRequired <= 8) {
        level = 'senior';
        confidence = 0.7;
      } else {
        level = 'lead';
        confidence = 0.7;
      }
    }
    
    // Description-based detection (lowest confidence)
    if (level === 'unknown') {
      if (/\b(no experience required|fresh graduate|recent graduate)\b/i.test(text)) {
        level = 'entry';
        confidence = 0.6;
        indicators.push('Entry level indicators in description');
      } else if (/\b(mentor|mentoring|leadership|team management|manage team)\b/i.test(text)) {
        level = 'senior';
        confidence = 0.5;
        indicators.push('Leadership indicators');
      } else {
        level = 'mid';
        confidence = 0.3;
        indicators.push('Default to mid-level');
      }
    }
    
    return {
      level,
      confidence,
      yearsRequired,
      indicators
    };
  }
  
  /**
   * Calculate compatibility between user experience and job level
   * Returns a score from 0 to 1
   */
  static calculateCompatibility(
    userYearsExperience: number,
    jobLevel: ExperienceLevel,
    jobYearsRequired: number | null
  ): number {
    // If job years are specified, use that
    if (jobYearsRequired !== null) {
      const diff = Math.abs(userYearsExperience - jobYearsRequired);
      
      // Perfect match
      if (diff === 0) return 1.0;
      
      // Within 1 year
      if (diff <= 1) return 0.9;
      
      // Within 2 years
      if (diff <= 2) return 0.7;
      
      // Within 3 years
      if (diff <= 3) return 0.5;
      
      // Too far apart
      return 0.3;
    }
    
    // Otherwise use level-based matching
    const levelYears: Record<ExperienceLevel, number> = {
      'entry': 0,
      'junior': 1,
      'mid': 3,
      'senior': 6,
      'lead': 9,
      'principal': 12,
      'unknown': 3  // Default to mid
    };
    
    const jobYears = levelYears[jobLevel];
    const diff = Math.abs(userYearsExperience - jobYears);
    
    if (diff === 0) return 1.0;
    if (diff <= 2) return 0.8;
    if (diff <= 4) return 0.6;
    if (diff <= 6) return 0.4;
    return 0.2;
  }
  
  /**
   * Get recommended experience level for a user
   */
  static getRecommendedLevel(yearsExperience: number): ExperienceLevel {
    if (yearsExperience === 0) return 'entry';
    if (yearsExperience <= 2) return 'junior';
    if (yearsExperience <= 5) return 'mid';
    if (yearsExperience <= 8) return 'senior';
    if (yearsExperience <= 12) return 'lead';
    return 'principal';
  }
}
