import { describe, it, expect } from 'vitest';
import type { TvlData, InvestorData } from '@crypto-analyzer/types';
import {
  calculatePercentile,
  calculatePercentileRank,
  calculateContextualPercentileRank,
  calculateTVLBlock,
  calculateInvestorBlock,
  calculateWilsonConfidenceInterval,
  calculateOverallScore,
  winsorize,
  winsorizeValue,
  normalizeZScore,
  normalizeMinMax,
  normalizeRobust,
  calculateSimpleMovingAverage,
  calculateExponentialMovingAverage,
  calculateRollingDelta,
  calculateRollingVolatility,
  calculateMean,
  calculateStandardDeviation
} from './index';

describe('calculatePercentile', () => {
  it('should return 0 for empty array', () => {
    const result = calculatePercentile([], 50);
    expect(result).toBe(0);
  });

  it('should throw for invalid percentile values', () => {
    expect(() => calculatePercentile([1, 2, 3], -1)).toThrow('Percentile must be between 0 and 100');
    expect(() => calculatePercentile([1, 2, 3], 101)).toThrow('Percentile must be between 0 and 100');
  });

  it('should calculate correct percentiles for ordered data', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(calculatePercentile(values, 0)).toBe(1);
    expect(calculatePercentile(values, 50)).toBe(5.5);
    expect(calculatePercentile(values, 100)).toBe(10);
  });

  it('should handle single value arrays', () => {
    const result = calculatePercentile([42], 50);
    expect(result).toBe(42);
  });
});

describe('calculatePercentileRank', () => {
  it('should return 0 for empty reference array', () => {
    const result = calculatePercentileRank(5, []);
    expect(result).toBe(0);
  });

  it('should return correct rank for value in middle', () => {
    const values = [1, 2, 3, 4, 5];
    const result = calculatePercentileRank(3, values);
    expect(result).toBeCloseTo(0.5, 2);
  });

  it('should handle duplicate values correctly', () => {
    const values = [1, 2, 2, 2, 3];
    const result = calculatePercentileRank(2, values);
    expect(result).toBeCloseTo(0.5, 2);
  });
});

describe('calculateContextualPercentileRank', () => {
  it('should return 0 for very low values', () => {
    const result = calculateContextualPercentileRank(1, 'ethereum', 'defi');
    expect(result).toBe(0);
  });

  it('should return normalized values for typical TVL amounts', () => {
    const result = calculateContextualPercentileRank(1000000, 'ethereum', 'defi');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe('calculateTVLBlock', () => {
  it('should return 0 for very low TVL with no momentum', () => {
    const tvl: TvlData = {
      current: 1000,
      change7d: 0,
      change30d: 0
    };
    
    const result = calculateTVLBlock(tvl, 'ethereum', 'defi');
    expect(result).toBe(0);
  });

  it('should give higher scores for high TVL with positive momentum', () => {
    const tvl: TvlData = {
      current: 100000000,
      change7d: 25,
      change30d: 40
    };
    
    const result = calculateTVLBlock(tvl, 'ethereum', 'defi');
    expect(result).toBeGreaterThan(0.5);
  });
});

describe('calculateInvestorBlock', () => {
  it('should return 0 for no investors', () => {
    const result = calculateInvestorBlock([]);
    expect(result).toBe(0);
  });

  it('should give higher scores for tier S verified investors', () => {
    const investors: InvestorData[] = [
      {
        name: 'Tier S Investor',
        tier: 'S',
        timestamp: Date.now(),
        verified: true
      }
    ];
    
    const result = calculateInvestorBlock(investors);
    expect(result).toBeGreaterThan(0.7);
  });

  it('should give lower scores for unverified investors', () => {
    const investors: InvestorData[] = [
      {
        name: 'Unverified Investor',
        tier: 'C',
        timestamp: Date.now(),
        verified: false
      }
    ];
    
    const result = calculateInvestorBlock(investors);
    expect(result).toBeLessThan(0.4);
  });
});

describe('calculateWilsonConfidenceInterval', () => {
  it('should return [0, 1] for zero total', () => {
    const result = calculateWilsonConfidenceInterval(0, 0);
    expect(result.lower).toBe(0);
    expect(result.upper).toBe(1);
  });

  it('should calculate confidence interval for positive cases', () => {
    const result = calculateWilsonConfidenceInterval(8, 10);
    expect(result.lower).toBeGreaterThan(0.4);
    expect(result.upper).toBeLessThan(1);
    expect(result.lower).toBeLessThan(result.upper);
  });
});

describe('calculateOverallScore', () => {
  it('should weight all blocks according to specified weights', () => {
    const result = calculateOverallScore(0.8, 0.9, 0.7, 0.6, 0.5);
    expect(result).toBeCloseTo(0.715, 2);
  });

  it('should return 0 for all zero scores', () => {
    const result = calculateOverallScore(0, 0, 0, 0, 0);
    expect(result).toBe(0);
  });

  it('should return maximum weighted value for all perfect scores', () => {
    const result = calculateOverallScore(1, 1, 1, 1, 1);
    expect(result).toBe(1);
  });
});

describe('winsorize', () => {
  it('should return empty array for empty input', () => {
    const result = winsorize([]);
    expect(result).toEqual([]);
  });

  it('should throw for invalid percentile bounds', () => {
    expect(() => winsorize([1, 2, 3], -1, 95)).toThrow('Invalid percentile bounds');
    expect(() => winsorize([1, 2, 3], 5, 101)).toThrow('Invalid percentile bounds');
    expect(() => winsorize([1, 2, 3], 95, 5)).toThrow('Invalid percentile bounds');
  });

  it('should cap outliers at specified percentiles', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 100];
    const result = winsorize(values, 10, 90);
    expect(Math.max(...result)).toBeLessThanOrEqual(9.1);
    expect(Math.min(...result)).toBeGreaterThanOrEqual(1.9);
  });
});

describe('normalizeZScore', () => {
  it('should return 0 for empty reference array', () => {
    const result = normalizeZScore(5, []);
    expect(result).toBe(0);
  });

  it('should return 0 for constant reference values', () => {
    const result = normalizeZScore(5, [3, 3, 3, 3]);
    expect(result).toBe(0);
  });

  it('should calculate correct z-score', () => {
    const referenceValues = [1, 2, 3, 4, 5];
    const result = normalizeZScore(3, referenceValues);
    expect(result).toBeCloseTo(0, 1);
  });
});

describe('normalizeMinMax', () => {
  it('should return target minimum for empty reference array', () => {
    const result = normalizeMinMax(5, [], 0, 1);
    expect(result).toBe(0);
  });

  it('should return target minimum for constant reference values', () => {
    const result = normalizeMinMax(3, [5, 5, 5, 5], 0, 1);
    expect(result).toBe(0);
  });

  it('should normalize to 0-1 range correctly', () => {
    const referenceValues = [0, 10];
    expect(normalizeMinMax(5, referenceValues)).toBeCloseTo(0.5, 2);
    expect(normalizeMinMax(0, referenceValues)).toBe(0);
    expect(normalizeMinMax(10, referenceValues)).toBe(1);
  });

  it('should handle custom target range', () => {
    const referenceValues = [0, 10];
    const result = normalizeMinMax(5, referenceValues, -1, 1);
    expect(result).toBeCloseTo(0, 2);
  });
});

describe('calculateSimpleMovingAverage', () => {
  it('should return empty array for empty input', () => {
    const result = calculateSimpleMovingAverage([], 3);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid window size', () => {
    expect(calculateSimpleMovingAverage([1, 2, 3], 0)).toEqual([]);
    expect(calculateSimpleMovingAverage([1, 2, 3], 5)).toEqual([]);
  });

  it('should calculate correct moving averages', () => {
    const values = [1, 2, 3, 4, 5];
    const result = calculateSimpleMovingAverage(values, 3);
    expect(result).toEqual([2, 3, 4]);
  });
});

describe('calculateExponentialMovingAverage', () => {
  it('should return empty array for empty input', () => {
    const result = calculateExponentialMovingAverage([], 0.5);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid alpha', () => {
    expect(calculateExponentialMovingAverage([1, 2, 3], 0)).toEqual([]);
    expect(calculateExponentialMovingAverage([1, 2, 3], 1.5)).toEqual([]);
  });

  it('should calculate correct exponential moving average', () => {
    const values = [2, 4, 6];
    const result = calculateExponentialMovingAverage(values, 0.5);
    expect(result[0]).toBe(2);
    expect(result[1]).toBe(3);
    expect(result[2]).toBe(4.5);
  });
});

describe('calculateRollingDelta', () => {
  it('should return empty array for empty input', () => {
    const result = calculateRollingDelta([], 1);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid periods', () => {
    expect(calculateRollingDelta([1, 2, 3], 0)).toEqual([]);
    expect(calculateRollingDelta([1, 2, 3], 3)).toEqual([]);
  });

  it('should calculate correct rolling deltas', () => {
    const values = [1, 3, 5, 7, 9];
    const result = calculateRollingDelta(values, 2);
    expect(result).toEqual([2, 2, 2, 2]);
  });
});

describe('calculateRollingVolatility', () => {
  it('should return empty array for empty input', () => {
    const result = calculateRollingVolatility([], 3);
    expect(result).toEqual([]);
  });

  it('should return empty array for invalid window size', () => {
    expect(calculateRollingVolatility([1, 2, 3], 1)).toEqual([]);
    expect(calculateRollingVolatility([1, 2], 3)).toEqual([]);
  });

  it('should calculate rolling standard deviations', () => {
    const values = [1, 2, 3, 4, 5];
    const result = calculateRollingVolatility(values, 3);
    expect(result.length).toBe(3);
    expect(result[0]).toBeGreaterThan(0);
  });
});