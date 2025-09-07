import { describe, it, expect } from 'vitest';
import type { ProjectData } from '@crypto-analyzer/types';
import {
  scoreProject,
  scoreProjectSafe,
  determineRecommendation,
  getDefaultSuccessCriteria,
  calculatePortfolioMetrics
} from './index';

const mockProject: ProjectData = {
  id: 'test-project',
  name: 'Test Project',
  chain: 'ethereum',
  category: 'defi',
  tvl: {
    current: 50000000,
    change7d: 15,
    change30d: 30
  },
  investors: [
    {
      name: 'Top Tier VC',
      tier: 'S',
      timestamp: Date.now(),
      verified: true
    },
    {
      name: 'Mid Tier Fund',
      tier: 'A',
      timestamp: Date.now(),
      verified: true
    }
  ],
  social: {
    twitter: {
      followers: 25000,
      followersChange7d: 500,
      engagement: 0.035,
      verified: true
    },
    discord: {
      members: 12000,
      activeMembers: 3000,
      membersChange7d: 200
    }
  },
  platform: {
    website: {
      online: true,
      loadTime: 1.2,
      sslCertificate: true,
      domainAge: 500
    },
    documentation: {
      available: true,
      quality: 0.85,
      completeness: 0.9
    }
  },
  eventTimestamp: Date.now(),
  metadata: {
    description: 'A high-quality DeFi project',
    tags: ['defi', 'yield-farming'],
    riskFlags: []
  }
};

describe('scoreProject', () => {
  it('should calculate scores for all blocks', () => {
    const result = scoreProject(mockProject);
    
    expect(result.blockScores.tvl).toBeGreaterThan(0);
    expect(result.blockScores.investors).toBeGreaterThan(0);
    expect(result.blockScores.social).toBeGreaterThan(0);
    expect(result.blockScores.platform).toBeGreaterThan(0);
    expect(result.blockScores.risk).toBeGreaterThanOrEqual(0);
  });

  it('should return overall score between 0 and 1', () => {
    const result = scoreProject(mockProject);
    
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
  });

  it('should include confidence interval', () => {
    const result = scoreProject(mockProject);
    
    expect(result.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
    expect(result.confidenceInterval.upper).toBeLessThanOrEqual(1);
    expect(result.confidenceInterval.lower).toBeLessThanOrEqual(result.confidenceInterval.upper);
  });

  it('should provide a recommendation', () => {
    const result = scoreProject(mockProject);
    
    expect(['buy', 'hold', 'avoid']).toContain(result.recommendation);
  });
});

describe('scoreProjectSafe', () => {
  it('should handle invalid project data', () => {
    const result = scoreProjectSafe('invalid data');
    
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should successfully score valid project data', () => {
    const result = scoreProjectSafe(mockProject);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

describe('determineRecommendation', () => {
  const defaultCriteria = getDefaultSuccessCriteria();

  it('should recommend buy for high score with high confidence', () => {
    const result = determineRecommendation(
      0.85,
      { lower: 0.8, upper: 0.9, level: 0.95 },
      defaultCriteria
    );
    
    expect(result).toBe('buy');
  });

  it('should recommend avoid for low score', () => {
    const result = determineRecommendation(
      0.2,
      { lower: 0.1, upper: 0.3, level: 0.95 },
      defaultCriteria
    );
    
    expect(result).toBe('avoid');
  });

  it('should recommend hold for medium score', () => {
    const result = determineRecommendation(
      0.65,
      { lower: 0.6, upper: 0.7, level: 0.95 },
      defaultCriteria
    );
    
    expect(result).toBe('hold');
  });
});

describe('calculatePortfolioMetrics', () => {
  it('should handle empty portfolio', () => {
    const result = calculatePortfolioMetrics([]);
    
    expect(result.averageScore).toBe(0);
    expect(result.scoreDistribution.buy).toBe(0);
    expect(result.scoreDistribution.hold).toBe(0);
    expect(result.scoreDistribution.avoid).toBe(0);
  });

  it('should calculate metrics for multiple projects', () => {
    const project1 = scoreProject(mockProject);
    const project2 = scoreProject({
      ...mockProject,
      id: 'project-2',
      metadata: {
        ...mockProject.metadata,
        riskFlags: [{
          type: 'medium',
          category: 'technical',
          description: 'Some technical risk',
          severity: 0.3
        }]
      }
    });

    const result = calculatePortfolioMetrics([project1, project2]);
    
    expect(result.averageScore).toBeGreaterThan(0);
    expect(
      result.scoreDistribution.buy + 
      result.scoreDistribution.hold + 
      result.scoreDistribution.avoid
    ).toBe(2);
  });
});