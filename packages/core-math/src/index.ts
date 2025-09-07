import type { TvlData, InvestorData, SocialData, PlatformData, RiskFlag, ChainType, CategoryType } from '@crypto-analyzer/types';

export function calculatePercentile(values: readonly number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (percentile < 0 || percentile > 100) {
    throw new Error('Percentile must be between 0 and 100');
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index]!;
  }
  
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

export function calculatePercentileRank(value: number, values: readonly number[]): number {
  if (values.length === 0) return 0;
  
  const countBelow = values.filter(v => v < value).length;
  const countEqual = values.filter(v => v === value).length;
  
  return Math.min(1, Math.max(0, (countBelow + countEqual / 2) / values.length));
}

export function calculateContextualPercentileRank(
  value: number,
  chain: ChainType,
  category: CategoryType
): number {
  const normalizedValue = Math.log10(Math.max(value, 1));
  const chainMultiplier = getChainMultiplier(chain);
  const categoryMultiplier = getCategoryMultiplier(category);
  
  return Math.min(1, Math.max(0, (normalizedValue * chainMultiplier * categoryMultiplier) / 10));
}

export function winsorize(
  values: readonly number[],
  lowerPercentile = 5,
  upperPercentile = 95
): number[] {
  if (values.length === 0) return [];
  if (lowerPercentile < 0 || upperPercentile > 100 || lowerPercentile >= upperPercentile) {
    throw new Error('Invalid percentile bounds');
  }

  const lowerBound = calculatePercentile(values, lowerPercentile);
  const upperBound = calculatePercentile(values, upperPercentile);

  return values.map(value => Math.max(lowerBound, Math.min(upperBound, value)));
}

export function winsorizeValue(
  value: number,
  referenceValues: readonly number[],
  lowerPercentile = 5,
  upperPercentile = 95
): number {
  if (referenceValues.length === 0) return value;

  const lowerBound = calculatePercentile(referenceValues, lowerPercentile);
  const upperBound = calculatePercentile(referenceValues, upperPercentile);

  return Math.max(lowerBound, Math.min(upperBound, value));
}

export function calculateMean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateStandardDeviation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return 0;
  
  const mean = calculateMean(values);
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function normalizeZScore(value: number, referenceValues: readonly number[]): number {
  if (referenceValues.length === 0) return 0;
  
  const mean = calculateMean(referenceValues);
  const stdDev = calculateStandardDeviation(referenceValues);
  
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export function normalizeMinMax(
  value: number,
  referenceValues: readonly number[],
  targetMin = 0,
  targetMax = 1
): number {
  if (referenceValues.length === 0) return targetMin;
  
  const min = Math.min(...referenceValues);
  const max = Math.max(...referenceValues);
  
  if (min === max) return targetMin;
  
  const normalized = (value - min) / (max - min);
  return targetMin + normalized * (targetMax - targetMin);
}

export function normalizeRobust(value: number, referenceValues: readonly number[]): number {
  if (referenceValues.length === 0) return 0;
  
  const median = calculatePercentile(referenceValues, 50);
  const q25 = calculatePercentile(referenceValues, 25);
  const q75 = calculatePercentile(referenceValues, 75);
  const iqr = q75 - q25;
  
  if (iqr === 0) return 0;
  return (value - median) / iqr;
}

export function calculateSimpleMovingAverage(
  values: readonly number[],
  windowSize: number
): number[] {
  if (values.length === 0 || windowSize <= 0) return [];
  if (windowSize > values.length) return [];
  
  const result: number[] = [];
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    result.push(calculateMean(window));
  }
  return result;
}

export function calculateExponentialMovingAverage(
  values: readonly number[],
  alpha: number
): number[] {
  if (values.length === 0 || alpha <= 0 || alpha > 1) return [];
  
  const result: number[] = [];
  let ema = values[0]!;
  result.push(ema);
  
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i]! + (1 - alpha) * ema;
    result.push(ema);
  }
  return result;
}

export function calculateRollingDelta(
  values: readonly number[],
  periods: number
): number[] {
  if (values.length === 0 || periods <= 0) return [];
  if (periods >= values.length) return [];
  
  const result: number[] = [];
  for (let i = periods; i < values.length; i++) {
    const delta = values[i]! - values[i - periods]!;
    result.push(delta);
  }
  return result;
}

export function calculateRollingVolatility(
  values: readonly number[],
  windowSize: number
): number[] {
  if (values.length === 0 || windowSize <= 1) return [];
  if (windowSize > values.length) return [];
  
  const result: number[] = [];
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    result.push(calculateStandardDeviation(window));
  }
  return result;
}

export function calculateTVLBlock(
  tvl: TvlData,
  chain: ChainType,
  category: CategoryType
): number {
  const tvlPercentile = calculateContextualPercentileRank(tvl.current, chain, category);
  
  let tvlLevelScore: number;
  if (tvlPercentile < 0.35) {
    tvlLevelScore = 0;
  } else if (tvlPercentile <= 0.85) {
    tvlLevelScore = (tvlPercentile - 0.35) / 0.5;
  } else {
    tvlLevelScore = Math.max(0.5, 1.0 - (tvlPercentile - 0.85) / 0.15);
  }
  
  const momentumScore7d = calculateMomentumScore(tvl.change7d);
  const momentumScore30d = calculateMomentumScore(tvl.change30d);
  
  return 0.1 * tvlLevelScore + 0.3 * momentumScore7d + 0.6 * momentumScore30d;
}

export function calculateMomentumScore(changePercent: number): number {
  const normalizedChange = changePercent / 100;
  
  if (normalizedChange >= 0.5) return 1.0;
  if (normalizedChange >= 0.2) return 0.8;
  if (normalizedChange >= 0.1) return 0.6;
  if (normalizedChange >= 0.05) return 0.4;
  if (normalizedChange >= 0) return 0.2;
  if (normalizedChange >= -0.1) return 0.1;
  
  return 0;
}

export function calculateInvestorBlock(investors: InvestorData[]): number {
  if (investors.length === 0) return 0;
  
  const tierWeights = { S: 1.0, A: 0.8, B: 0.6, C: 0.4 };
  const qualityScores = investors.map(inv => tierWeights[inv.tier] * (inv.verified ? 1 : 0.7));
  const diversityScore = Math.min(1, investors.length / 5);
  const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  
  return 0.7 * avgQuality + 0.3 * diversityScore;
}

export function calculateSocialBlock(social: SocialData): number {
  const twitterScore = social.twitter ? calculateTwitterScore(social.twitter) : 0;
  const discordScore = social.discord ? calculateDiscordScore(social.discord) : 0;
  const telegramScore = social.telegram ? calculateTelegramScore(social.telegram) : 0;
  const githubScore = social.github ? calculateGithubScore(social.github) : 0;
  
  const scores = [twitterScore, discordScore, telegramScore, githubScore].filter(s => s > 0);
  if (scores.length === 0) return 0;
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function calculateTwitterScore(twitter: { followers: number; followersChange7d: number; engagement: number; verified: boolean }): number {
  const followersScore = Math.min(1, Math.log10(Math.max(twitter.followers, 1)) / 6);
  const growthScore = Math.min(1, Math.max(0, twitter.followersChange7d / 1000));
  const engagementScore = Math.min(1, twitter.engagement / 0.05);
  const verificationBonus = twitter.verified ? 0.1 : 0;
  
  return Math.min(1, 0.4 * followersScore + 0.3 * growthScore + 0.3 * engagementScore + verificationBonus);
}

export function calculateDiscordScore(discord: { members: number; activeMembers: number; membersChange7d: number }): number {
  const membersScore = Math.min(1, Math.log10(Math.max(discord.members, 1)) / 5);
  const activityScore = discord.members > 0 ? Math.min(1, discord.activeMembers / discord.members) : 0;
  const growthScore = Math.min(1, Math.max(0, discord.membersChange7d / 500));
  
  return 0.4 * membersScore + 0.4 * activityScore + 0.2 * growthScore;
}

export function calculateTelegramScore(telegram: { members: number; membersChange7d: number }): number {
  const membersScore = Math.min(1, Math.log10(Math.max(telegram.members, 1)) / 5);
  const growthScore = Math.min(1, Math.max(0, telegram.membersChange7d / 300));
  
  return 0.7 * membersScore + 0.3 * growthScore;
}

export function calculateGithubScore(github: { stars: number; forks: number; commits30d: number; contributors: number }): number {
  const starsScore = Math.min(1, Math.log10(Math.max(github.stars, 1)) / 4);
  const forksScore = Math.min(1, Math.log10(Math.max(github.forks, 1)) / 3);
  const activityScore = Math.min(1, github.commits30d / 100);
  const contributorsScore = Math.min(1, github.contributors / 20);
  
  return 0.3 * starsScore + 0.2 * forksScore + 0.3 * activityScore + 0.2 * contributorsScore;
}

export function calculatePlatformBlock(platform: PlatformData): number {
  const websiteScore = calculateWebsiteScore(platform.website);
  const docScore = platform.documentation ? calculateDocumentationScore(platform.documentation) : 0.5;
  const whitepaperScore = platform.whitepaper ? calculateWhitepaperScore(platform.whitepaper) : 0.5;
  
  return 0.4 * websiteScore + 0.3 * docScore + 0.3 * whitepaperScore;
}

export function calculateWebsiteScore(website: { online: boolean; loadTime: number; sslCertificate: boolean; domainAge: number }): number {
  if (!website.online) return 0;
  
  const loadTimeScore = website.loadTime <= 2 ? 1 : Math.max(0, (5 - website.loadTime) / 3);
  const sslScore = website.sslCertificate ? 1 : 0.3;
  const ageScore = Math.min(1, website.domainAge / 365);
  
  return 0.4 * loadTimeScore + 0.3 * sslScore + 0.3 * ageScore;
}

export function calculateDocumentationScore(docs: { available: boolean; quality: number; completeness: number }): number {
  if (!docs.available) return 0;
  
  return 0.5 * docs.quality + 0.5 * docs.completeness;
}

export function calculateWhitepaperScore(whitepaper: { available: boolean; technicalDepth: number; clarity: number }): number {
  if (!whitepaper.available) return 0;
  
  return 0.6 * whitepaper.technicalDepth + 0.4 * whitepaper.clarity;
}

export function calculateRiskBlock(riskFlags: RiskFlag[]): number {
  if (riskFlags.length === 0) return 1.0;
  
  const totalPenalty = riskFlags.reduce((sum, flag) => {
    const typeMultiplier = flag.type === 'high' ? 1.0 : flag.type === 'medium' ? 0.6 : 0.3;
    return sum + (flag.severity * typeMultiplier);
  }, 0);
  
  return Math.max(0, 1.0 - (totalPenalty / 10));
}

export function calculateWilsonConfidenceInterval(
  successes: number,
  total: number,
  confidence = 0.95
): { lower: number; upper: number } {
  if (total === 0) return { lower: 0, upper: 1 };
  
  const z = confidence === 0.95 ? 1.96 : 2.58;
  const p = successes / total;
  const n = total;
  
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / denominator;
  
  return {
    lower: Math.max(0, centre - margin),
    upper: Math.min(1, centre + margin)
  };
}

export function calculateOverallScore(
  tvlBlock: number,
  investorBlock: number,
  socialBlock: number,
  platformBlock: number,
  riskBlock: number
): number {
  const weights = [0.25, 0.25, 0.25, 0.15, 0.1];
  const scores = [tvlBlock, investorBlock, socialBlock, platformBlock, riskBlock];
  
  return scores.reduce((sum, score, index) => sum + score * weights[index]!, 0);
}

function getChainMultiplier(chain: ChainType): number {
  const multipliers: Record<ChainType, number> = {
    ethereum: 1.2,
    bsc: 1.0,
    polygon: 0.9,
    arbitrum: 1.1,
    optimism: 1.1,
    avalanche: 0.95,
    fantom: 0.85,
    solana: 1.15
  };
  
  return multipliers[chain] ?? 1.0;
}

function getCategoryMultiplier(category: CategoryType): number {
  const multipliers: Record<CategoryType, number> = {
    defi: 1.1,
    nft: 0.9,
    gaming: 0.85,
    infrastructure: 1.2,
    dao: 0.8,
    lending: 1.15,
    dex: 1.1,
    bridge: 1.0
  };
  
  return multipliers[category] ?? 1.0;
}