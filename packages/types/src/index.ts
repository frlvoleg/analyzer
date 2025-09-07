export interface PreEventData {
  readonly dataTimestamp: number;
  readonly cutoffTimestamp: number;
}

export interface ProjectData extends PreEventData {
  readonly id: string;
  readonly name: string;
  readonly chain: string;
  readonly category: string;
  readonly tvl: TvlData;
  readonly investors: InvestorData[];
  readonly social: SocialData;
  readonly platform: PlatformData;
  readonly eventTimestamp: number;
  readonly metadata: ProjectMetadata;
}

export interface TvlData {
  readonly current: number;
  readonly change7d: number;
  readonly change30d: number;
  readonly rank?: number;
  readonly percentile?: number;
}

export interface InvestorData {
  readonly name: string;
  readonly tier: 'S' | 'A' | 'B' | 'C';
  readonly investmentAmount?: number;
  readonly round?: string;
  readonly timestamp: number;
  readonly verified: boolean;
}

export interface SocialData {
  readonly twitter?: TwitterMetrics;
  readonly discord?: DiscordMetrics;
  readonly telegram?: TelegramMetrics;
  readonly github?: GithubMetrics;
}

export interface TwitterMetrics {
  readonly followers: number;
  readonly followersChange7d: number;
  readonly engagement: number;
  readonly verified: boolean;
}

export interface DiscordMetrics {
  readonly members: number;
  readonly activeMembers: number;
  readonly membersChange7d: number;
}

export interface TelegramMetrics {
  readonly members: number;
  readonly membersChange7d: number;
}

export interface GithubMetrics {
  readonly stars: number;
  readonly forks: number;
  readonly commits30d: number;
  readonly contributors: number;
}

export interface PlatformData {
  readonly website: WebsiteMetrics;
  readonly documentation?: DocumentationMetrics;
  readonly whitepaper?: WhitepaperMetrics;
}

export interface WebsiteMetrics {
  readonly online: boolean;
  readonly loadTime: number;
  readonly sslCertificate: boolean;
  readonly domainAge: number;
}

export interface DocumentationMetrics {
  readonly available: boolean;
  readonly quality: number;
  readonly completeness: number;
}

export interface WhitepaperMetrics {
  readonly available: boolean;
  readonly technicalDepth: number;
  readonly clarity: number;
}

export interface ProjectMetadata {
  readonly launchDate?: number;
  readonly description: string;
  readonly tags: string[];
  readonly riskFlags: RiskFlag[];
}

export interface RiskFlag {
  readonly type: 'high' | 'medium' | 'low';
  readonly category: string;
  readonly description: string;
  readonly severity: number;
}

export interface ScoringResult {
  readonly projectId: string;
  readonly timestamp: number;
  readonly overallScore: number;
  readonly blockScores: BlockScores;
  readonly riskAdjustment: number;
  readonly confidenceInterval: ConfidenceInterval;
  readonly recommendation: 'buy' | 'hold' | 'avoid';
}

export interface BlockScores {
  readonly tvl: number;
  readonly investors: number;
  readonly social: number;
  readonly platform: number;
  readonly risk: number;
}

export interface ConfidenceInterval {
  readonly lower: number;
  readonly upper: number;
  readonly level: number;
}

export interface SuccessCriteria {
  readonly primaryMultiplier: number;
  readonly primaryWindow: number;
  readonly secondaryThreshold: number;
  readonly timeHorizon: number;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value: unknown;
}

export interface ValidationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors?: ValidationError[];
}

export type ChainType = 'ethereum' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'fantom' | 'solana';
export type CategoryType = 'defi' | 'nft' | 'gaming' | 'infrastructure' | 'dao' | 'lending' | 'dex' | 'bridge';