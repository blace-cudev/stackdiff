import { StackDiffConfig } from './configManager';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_FORMATS = ['text', 'markdown', 'json'] as const;
const VALID_BUMPS = ['major', 'minor'] as const;

export function validateConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof config !== 'object' || config === null) {
    return { valid: false, errors: ['Config must be a non-null object'] };
  }

  const c = config as Partial<StackDiffConfig>;

  if (c.defaultFormat !== undefined && !VALID_FORMATS.includes(c.defaultFormat as any)) {
    errors.push(`defaultFormat must be one of: ${VALID_FORMATS.join(', ')}`);
  }

  if (c.cacheEnabled !== undefined && typeof c.cacheEnabled !== 'boolean') {
    errors.push('cacheEnabled must be a boolean');
  }

  if (c.cacheTtlSeconds !== undefined) {
    if (typeof c.cacheTtlSeconds !== 'number' || c.cacheTtlSeconds < 0) {
      errors.push('cacheTtlSeconds must be a non-negative number');
    }
  }

  if (c.ignorePackages !== undefined) {
    if (!Array.isArray(c.ignorePackages) || !c.ignorePackages.every((p) => typeof p === 'string')) {
      errors.push('ignorePackages must be an array of strings');
    }
  }

  if (c.breakingVersionBump !== undefined && !VALID_BUMPS.includes(c.breakingVersionBump as any)) {
    errors.push(`breakingVersionBump must be one of: ${VALID_BUMPS.join(', ')}`);
  }

  if (c.outputFile !== undefined && typeof c.outputFile !== 'string') {
    errors.push('outputFile must be a string');
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidConfig(config: unknown): asserts config is StackDiffConfig {
  const result = validateConfig(config);
  if (!result.valid) {
    throw new Error(`Invalid config:\n  ${result.errors.join('\n  ')}`);
  }
}
