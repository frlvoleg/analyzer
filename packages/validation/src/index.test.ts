import { describe, it, expect } from 'vitest';
import { validateProjectData, isValidChain, isValidCategory } from './index';

describe('validateProjectData', () => {
  it('should reject non-object input', () => {
    const result = validateProjectData('not an object');
    expect(result.success).toBe(false);
    expect(result.errors?.[0]?.field).toBe('root');
  });

  it('should validate required fields', () => {
    const result = validateProjectData({});
    expect(result.success).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should validate complete valid project data', () => {
    const validProject = {
      id: 'test-project',
      name: 'Test Project',
      chain: 'ethereum',
      category: 'defi',
      tvl: {
        current: 1000000,
        change7d: 10,
        change30d: 25
      },
      investors: [
        {
          name: 'Test Investor',
          tier: 'A',
          timestamp: Date.now(),
          verified: true
        }
      ],
      social: {
        twitter: {
          followers: 10000,
          followersChange7d: 100,
          engagement: 0.02,
          verified: true
        }
      },
      platform: {
        website: {
          online: true,
          loadTime: 1.5,
          sslCertificate: true,
          domainAge: 365
        }
      },
      eventTimestamp: Date.now(),
      metadata: {
        description: 'A test project',
        tags: ['test', 'defi'],
        riskFlags: []
      }
    };

    const result = validateProjectData(validProject);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

describe('isValidChain', () => {
  it('should accept valid chains', () => {
    expect(isValidChain('ethereum')).toBe(true);
    expect(isValidChain('bsc')).toBe(true);
    expect(isValidChain('solana')).toBe(true);
  });

  it('should reject invalid chains', () => {
    expect(isValidChain('invalid-chain')).toBe(false);
    expect(isValidChain(null)).toBe(false);
    expect(isValidChain(123)).toBe(false);
  });
});

describe('isValidCategory', () => {
  it('should accept valid categories', () => {
    expect(isValidCategory('defi')).toBe(true);
    expect(isValidCategory('nft')).toBe(true);
    expect(isValidCategory('gaming')).toBe(true);
  });

  it('should reject invalid categories', () => {
    expect(isValidCategory('invalid-category')).toBe(false);
    expect(isValidCategory(null)).toBe(false);
    expect(isValidCategory(42)).toBe(false);
  });
});