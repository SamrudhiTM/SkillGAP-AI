import { Router, Request, Response } from 'express';
import { DomainSkillAnalyzer } from '../services/domainSkillAnalyzer';

const router = Router();

/**
 * GET /api/domains
 * Get all available domains
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const domains = DomainSkillAnalyzer.getAvailableDomains();
    res.json({ domains });
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

/**
 * POST /api/domains/analyze
 * Analyze skills required for a specific domain
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }
    
    console.log(`🔍 Analyzing domain: ${domain}`);
    
    const analysis = await DomainSkillAnalyzer.analyzeDomainSkills(domain);
    
    console.log(`✅ Analysis complete for ${domain}:`, {
      totalJobs: analysis.totalJobs,
      topSkillsCount: analysis.topSkills.length,
      jobRolesCount: analysis.jobRoles.length
    });
    
    res.json({ analysis });
    
  } catch (error) {
    console.error('Error analyzing domain:', error);
    res.status(500).json({ 
      error: 'Failed to analyze domain',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
});

export default router;