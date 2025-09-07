import type {
  ProjectData,
  ValidationResult,
  ValidationError,
  ChainType,
  CategoryType
} from '@crypto-analyzer/types';

export function validateProjectData(data: unknown): ValidationResult<ProjectData> {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    return { success: false, errors: [{ field: 'root', message: 'Must be an object', value: data }] };
  }

  const obj = data as Record<string, unknown>;

  validateRequiredString(obj, 'id', errors);
  validateRequiredString(obj, 'name', errors);
  validateChain(obj.chain, errors);
  validateCategory(obj.category, errors);
  validateTvlData(obj.tvl, errors);
  validateInvestorsArray(obj.investors, errors);
  validateSocialData(obj.social, errors);
  validatePlatformData(obj.platform, errors);
  validateRequiredNumber(obj, 'eventTimestamp', errors, 0);
  validatePreEventConstraints(obj, errors);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: obj as unknown as ProjectData };
}

export function validateTvlData(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'tvl', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredNumber(obj, 'current', errors, 0);
  validateRequiredNumber(obj, 'change7d', errors);
  validateRequiredNumber(obj, 'change30d', errors);

  if (obj.rank !== undefined) {
    validateOptionalNumber(obj, 'rank', errors, 1);
  }
  if (obj.percentile !== undefined) {
    validateOptionalNumber(obj, 'percentile', errors, 0, 1);
  }
}

export function validateInvestorsArray(data: unknown, errors: ValidationError[]): void {
  if (!Array.isArray(data)) {
    errors.push({ field: 'investors', message: 'Must be an array', value: data });
    return;
  }

  data.forEach((investor, index) => {
    validateInvestorData(investor, errors, `investors[${index}]`);
  });
}

export function validateInvestorData(data: unknown, errors: ValidationError[], fieldPrefix = 'investor'): void {
  if (!isObject(data)) {
    errors.push({ field: fieldPrefix, message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredString(obj, 'name', errors, fieldPrefix);
  validateInvestorTier(obj.tier, errors, fieldPrefix);
  validateRequiredNumber(obj, 'timestamp', errors, 0, fieldPrefix);
  validateRequiredBoolean(obj, 'verified', errors, fieldPrefix);

  if (obj.investmentAmount !== undefined) {
    validateOptionalNumber(obj, 'investmentAmount', errors, 0, undefined, fieldPrefix);
  }
}

export function validateSocialData(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'social', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;

  if (obj.twitter !== undefined) {
    validateTwitterMetrics(obj.twitter, errors);
  }
  if (obj.discord !== undefined) {
    validateDiscordMetrics(obj.discord, errors);
  }
  if (obj.telegram !== undefined) {
    validateTelegramMetrics(obj.telegram, errors);
  }
  if (obj.github !== undefined) {
    validateGithubMetrics(obj.github, errors);
  }
}

export function validateTwitterMetrics(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'social.twitter', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredNumber(obj, 'followers', errors, 0, 'social.twitter');
  validateRequiredNumber(obj, 'followersChange7d', errors, undefined, 'social.twitter');
  validateRequiredNumber(obj, 'engagement', errors, 0, 'social.twitter');
  validateRequiredBoolean(obj, 'verified', errors, 'social.twitter');
}

export function validateDiscordMetrics(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'social.discord', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredNumber(obj, 'members', errors, 0, 'social.discord');
  validateRequiredNumber(obj, 'activeMembers', errors, 0, 'social.discord');
  validateRequiredNumber(obj, 'membersChange7d', errors, undefined, 'social.discord');
}

export function validateTelegramMetrics(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'social.telegram', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredNumber(obj, 'members', errors, 0, 'social.telegram');
  validateRequiredNumber(obj, 'membersChange7d', errors, undefined, 'social.telegram');
}

export function validateGithubMetrics(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'social.github', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredNumber(obj, 'stars', errors, 0, 'social.github');
  validateRequiredNumber(obj, 'forks', errors, 0, 'social.github');
  validateRequiredNumber(obj, 'commits30d', errors, 0, 'social.github');
  validateRequiredNumber(obj, 'contributors', errors, 0, 'social.github');
}

export function validatePlatformData(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'platform', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateWebsiteMetrics(obj.website, errors);

  if (obj.documentation !== undefined) {
    validateDocumentationMetrics(obj.documentation, errors);
  }
  if (obj.whitepaper !== undefined) {
    validateWhitepaperMetrics(obj.whitepaper, errors);
  }
}

export function validateWebsiteMetrics(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'platform.website', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredBoolean(obj, 'online', errors, 'platform.website');
  validateRequiredNumber(obj, 'loadTime', errors, 0, 'platform.website');
  validateRequiredBoolean(obj, 'sslCertificate', errors, 'platform.website');
  validateRequiredNumber(obj, 'domainAge', errors, 0, 'platform.website');
}

export function validateDocumentationMetrics(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'platform.documentation', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredBoolean(obj, 'available', errors, 'platform.documentation');
  validateRequiredNumber(obj, 'quality', errors, 0, 'platform.documentation', 1);
  validateRequiredNumber(obj, 'completeness', errors, 0, 'platform.documentation', 1);
}

export function validateWhitepaperMetrics(data: unknown, errors: ValidationError[]): void {
  if (!isObject(data)) {
    errors.push({ field: 'platform.whitepaper', message: 'Must be an object', value: data });
    return;
  }

  const obj = data as Record<string, unknown>;
  validateRequiredBoolean(obj, 'available', errors, 'platform.whitepaper');
  validateRequiredNumber(obj, 'technicalDepth', errors, 0, 'platform.whitepaper', 1);
  validateRequiredNumber(obj, 'clarity', errors, 0, 'platform.whitepaper', 1);
}

export function isValidChain(chain: unknown): chain is ChainType {
  return typeof chain === 'string' && 
    ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'solana'].includes(chain);
}

export function isValidCategory(category: unknown): category is CategoryType {
  return typeof category === 'string' && 
    ['defi', 'nft', 'gaming', 'infrastructure', 'dao', 'lending', 'dex', 'bridge'].includes(category);
}

export function isValidInvestorTier(tier: unknown): tier is 'S' | 'A' | 'B' | 'C' {
  return typeof tier === 'string' && ['S', 'A', 'B', 'C'].includes(tier);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRequiredString(
  obj: Record<string, unknown>,
  field: string,
  errors: ValidationError[],
  prefix = ''
): void {
  const fullField = prefix ? `${prefix}.${field}` : field;
  const value = obj[field];
  
  if (typeof value !== 'string' || value.length === 0) {
    errors.push({ field: fullField, message: 'Must be a non-empty string', value });
  }
}

function validateRequiredNumber(
  obj: Record<string, unknown>,
  field: string,
  errors: ValidationError[],
  min?: number,
  prefix = '',
  max?: number
): void {
  const fullField = prefix ? `${prefix}.${field}` : field;
  const value = obj[field];
  
  if (typeof value !== 'number' || !isFinite(value)) {
    errors.push({ field: fullField, message: 'Must be a finite number', value });
    return;
  }
  
  if (min !== undefined && value < min) {
    errors.push({ field: fullField, message: `Must be >= ${min}`, value });
  }
  
  if (max !== undefined && value > max) {
    errors.push({ field: fullField, message: `Must be <= ${max}`, value });
  }
}

function validateOptionalNumber(
  obj: Record<string, unknown>,
  field: string,
  errors: ValidationError[],
  min?: number,
  max?: number,
  prefix = ''
): void {
  const value = obj[field];
  if (value !== undefined) {
    validateRequiredNumber(obj, field, errors, min, prefix, max);
  }
}

function validateRequiredBoolean(
  obj: Record<string, unknown>,
  field: string,
  errors: ValidationError[],
  prefix = ''
): void {
  const fullField = prefix ? `${prefix}.${field}` : field;
  const value = obj[field];
  
  if (typeof value !== 'boolean') {
    errors.push({ field: fullField, message: 'Must be a boolean', value });
  }
}

function validateChain(chain: unknown, errors: ValidationError[]): void {
  if (!isValidChain(chain)) {
    errors.push({ field: 'chain', message: 'Must be a valid chain type', value: chain });
  }
}

function validateCategory(category: unknown, errors: ValidationError[]): void {
  if (!isValidCategory(category)) {
    errors.push({ field: 'category', message: 'Must be a valid category type', value: category });
  }
}

function validateInvestorTier(tier: unknown, errors: ValidationError[], prefix = ''): void {
  const fullField = prefix ? `${prefix}.tier` : 'tier';
  
  if (!isValidInvestorTier(tier)) {
    errors.push({ field: fullField, message: 'Must be S, A, B, or C', value: tier });
  }
}

export function validatePreEventConstraints(obj: Record<string, unknown>, errors: ValidationError[]): void {
  validateRequiredNumber(obj, 'dataTimestamp', errors, 0);
  validateRequiredNumber(obj, 'cutoffTimestamp', errors, 0);

  if (typeof obj.dataTimestamp === 'number' && typeof obj.cutoffTimestamp === 'number') {
    if (obj.dataTimestamp > obj.cutoffTimestamp) {
      errors.push({
        field: 'dataTimestamp',
        message: 'Data timestamp must be before or equal to cutoff timestamp',
        value: obj.dataTimestamp
      });
    }
  }

  if (typeof obj.eventTimestamp === 'number' && typeof obj.cutoffTimestamp === 'number') {
    if (obj.cutoffTimestamp >= obj.eventTimestamp) {
      errors.push({
        field: 'cutoffTimestamp',
        message: 'Cutoff timestamp must be before event timestamp',
        value: obj.cutoffTimestamp
      });
    }
  }

  if (Array.isArray(obj.investors)) {
    obj.investors.forEach((investor, index) => {
      if (typeof investor === 'object' && investor !== null) {
        const inv = investor as Record<string, unknown>;
        if (typeof inv.timestamp === 'number' && typeof obj.cutoffTimestamp === 'number') {
          if (inv.timestamp > obj.cutoffTimestamp) {
            errors.push({
              field: `investors[${index}].timestamp`,
              message: 'Investor timestamp must be before cutoff timestamp',
              value: inv.timestamp
            });
          }
        }
      }
    });
  }
}