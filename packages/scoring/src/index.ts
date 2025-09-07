import type {
  ProjectData,
  ScoringResult,
  BlockScores,
  ConfidenceInterval,
  SuccessCriteria,
  ValidationResult,
  ChainType,
  CategoryType
} from '@crypto-analyzer/types';

import {
  calculateTVLBlock,
  calculateInvestorBlock,
  calculateSocialBlock,
  calculatePlatformBlock,
  calculateRiskBlock,
  calculateOverallScore
} from '@crypto-analyzer/core-math';

import { validateProjectData } from '@crypto-analyzer/validation';

export function scoreProject(
  projectData: ProjectData,
  successCriteria: SuccessCriteria = getDefaultSuccessCriteria()
): ScoringResult {
  const timestamp = Date.now();

  const blockScores: BlockScores = {
    tvl: calculateTVLBlock(projectData.tvl, projectData.chain as ChainType, projectData.category as CategoryType),
    investors: calculateInvestorBlock(projectData.investors),
    social: calculateSocialBlock(projectData.social),
    platform: calculatePlatformBlock(projectData.platform),
    risk: calculateRiskBlock(projectData.metadata.riskFlags)
  };

  const overallScore = calculateOverallScore(
    blockScores.tvl,
    blockScores.investors,
    blockScores.social,
    blockScores.platform,
    blockScores.risk
  );

  const riskAdjustment = (1 - blockScores.risk) * 0.1;
  const adjustedScore = Math.max(0, overallScore - riskAdjustment);

  const confidenceInterval = calculateProjectConfidenceInterval(
    blockScores,
    projectData.investors.length,
    Object.keys(projectData.social).length
  );

  const recommendation = determineRecommendation(
    adjustedScore,
    confidenceInterval,
    successCriteria
  );

  return {
    projectId: projectData.id,
    timestamp,
    overallScore: adjustedScore,
    blockScores,
    riskAdjustment,
    confidenceInterval,
    recommendation
  };
}

export function scoreProjectSafe(
  rawProjectData: unknown,
  successCriteria?: SuccessCriteria
): ValidationResult<ScoringResult> {
  const validationResult = validateProjectData(rawProjectData);
  
  if (!validationResult.success || !validationResult.data) {
    return {
      success: false,
      errors: validationResult.errors || []
    };
  }

  try {
    const scoringResult = scoreProject(validationResult.data, successCriteria);
    return {
      success: true,
      data: scoringResult
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'scoring',
        message: error instanceof Error ? error.message : 'Unknown scoring error',
        value: rawProjectData
      }]
    };
  }
}

export function batchScoreProjects(
  projects: ProjectData[],
  successCriteria?: SuccessCriteria
): ScoringResult[] {
  return projects.map(project => scoreProject(project, successCriteria));
}

export function batchScoreProjectsSafe(
  rawProjects: unknown[],
  successCriteria?: SuccessCriteria
): Array<ValidationResult<ScoringResult>> {
  return rawProjects.map(project => scoreProjectSafe(project, successCriteria));
}

export function calculateProjectConfidenceInterval(
  blockScores: BlockScores,
  investorCount: number,
  socialPlatformCount: number
): ConfidenceInterval {
  const dataQuality = Math.min(1, (investorCount + socialPlatformCount) / 10);
  const scoreVariance = calculateScoreVariance(blockScores);
  
  const margin = (1 - dataQuality) * scoreVariance * 0.2;
  const level = 0.95;

  return {
    lower: Math.max(0, blockScores.tvl - margin),
    upper: Math.min(1, blockScores.tvl + margin),
    level
  };
}

export function determineRecommendation(
  score: number,
  confidence: ConfidenceInterval,
  _criteria: SuccessCriteria
): 'buy' | 'hold' | 'avoid' {
  const confidenceWidth = confidence.upper - confidence.lower;
  const highConfidence = confidenceWidth < 0.2;
  
  if (score >= 0.8 && highConfidence) return 'buy';
  if (score >= 0.6) return 'hold';
  if (score <= 0.3) return 'avoid';
  
  return confidence.lower >= 0.5 ? 'hold' : 'avoid';
}

export function getDefaultSuccessCriteria(): SuccessCriteria {
  return {
    primaryMultiplier: 2.0,
    primaryWindow: 7 * 24 * 60 * 60 * 1000,
    secondaryThreshold: 1.5,
    timeHorizon: 30 * 24 * 60 * 60 * 1000
  };
}

export function calculatePortfolioMetrics(results: ScoringResult[]): {
  averageScore: number;
  scoreDistribution: Record<'buy' | 'hold' | 'avoid', number>;
  riskMetrics: {
    averageRisk: number;
    highRiskCount: number;
  };
} {
  if (results.length === 0) {
    return {
      averageScore: 0,
      scoreDistribution: { buy: 0, hold: 0, avoid: 0 },
      riskMetrics: { averageRisk: 0, highRiskCount: 0 }
    };
  }

  const averageScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  
  const distribution = results.reduce(
    (acc, r) => {
      acc[r.recommendation]++;
      return acc;
    },
    { buy: 0, hold: 0, avoid: 0 }
  );

  const averageRisk = results.reduce((sum, r) => sum + r.riskAdjustment, 0) / results.length;
  const highRiskCount = results.filter(r => r.riskAdjustment > 0.05).length;

  return {
    averageScore,
    scoreDistribution: distribution,
    riskMetrics: {
      averageRisk,
      highRiskCount
    }
  };
}

function calculateScoreVariance(blockScores: BlockScores): number {
  const scores = [
    blockScores.tvl,
    blockScores.investors,
    blockScores.social,
    blockScores.platform,
    blockScores.risk
  ];
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  
  return Math.sqrt(variance);
}