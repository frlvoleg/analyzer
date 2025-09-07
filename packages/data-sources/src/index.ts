import type { ProjectData, ValidationResult, ChainType, CategoryType } from '@crypto-analyzer/types';

export interface DataSourceConfig {
  readonly timeout: number;
  readonly retries: number;
  readonly rateLimit: number;
}

export interface ProjectDataSource {
  readonly name: string;
  readonly config: DataSourceConfig;
  fetchProject(id: string): Promise<ValidationResult<ProjectData>>;
}

export interface MockDataSource extends ProjectDataSource {
  generateMockProject(overrides?: Partial<ProjectData>): ProjectData;
}

export const DEFAULT_CONFIG: DataSourceConfig = {
  timeout: 5000,
  retries: 3,
  rateLimit: 100
};

export class InMemoryDataSource implements MockDataSource {
  readonly name = 'mock-data-source';
  readonly config = DEFAULT_CONFIG;

  async fetchProject(id: string): Promise<ValidationResult<ProjectData>> {
    try {
      const mockData = this.generateMockProject({ id });
      return { success: true, data: mockData };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'fetch',
          message: error instanceof Error ? error.message : 'Unknown error',
          value: id
        }]
      };
    }
  }

  generateMockProject(overrides: Partial<ProjectData> = {}): ProjectData {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 1 day ago
    const eventTime = now + (7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const baseProject: ProjectData = {
      id: 'mock-project-1',
      name: 'Mock DeFi Protocol',
      chain: 'ethereum' as ChainType,
      category: 'defi' as CategoryType,
      dataTimestamp: now - (2 * 60 * 60 * 1000), // 2 hours ago
      cutoffTimestamp: cutoff,
      tvl: {
        current: 50000000,
        change7d: 15,
        change30d: 30
      },
      investors: [
        {
          name: 'Tier S Investor',
          tier: 'S',
          timestamp: cutoff - (3 * 24 * 60 * 60 * 1000), // 4 days ago (before cutoff)
          verified: true
        }
      ],
      social: {
        twitter: {
          followers: 25000,
          followersChange7d: 500,
          engagement: 0.035,
          verified: true
        }
      },
      platform: {
        website: {
          online: true,
          loadTime: 1.2,
          sslCertificate: true,
          domainAge: 500
        }
      },
      eventTimestamp: eventTime,
      metadata: {
        description: 'A high-quality mock DeFi project for testing',
        tags: ['defi', 'mock'],
        riskFlags: []
      }
    };

    return { ...baseProject, ...overrides };
  }
}

export function createDataSource(type: 'mock' = 'mock'): ProjectDataSource {
  switch (type) {
    case 'mock':
      return new InMemoryDataSource();
    default:
      throw new Error(`Unsupported data source type: ${type}`);
  }
}