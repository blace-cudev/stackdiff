import { validateConfig, assertValidConfig } from '../configValidator';
import { getDefaultConfig } from '../configManager';

describe('configValidator', () => {
  describe('validateConfig', () => {
    it('returns valid for a correct config object', () => {
      const result = validateConfig(getDefaultConfig());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns invalid for non-object input', () => {
      const result = validateConfig(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/non-null object/);
    });

    it('rejects invalid defaultFormat', () => {
      const result = validateConfig({ defaultFormat: 'xml' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/defaultFormat/);
    });

    it('rejects non-boolean cacheEnabled', () => {
      const result = validateConfig({ cacheEnabled: 'yes' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/cacheEnabled/);
    });

    it('rejects negative cacheTtlSeconds', () => {
      const result = validateConfig({ cacheTtlSeconds: -1 });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/cacheTtlSeconds/);
    });

    it('rejects non-string array for ignorePackages', () => {
      const result = validateConfig({ ignorePackages: [1, 2] });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/ignorePackages/);
    });

    it('rejects invalid breakingVersionBump', () => {
      const result = validateConfig({ breakingVersionBump: 'patch' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/breakingVersionBump/);
    });

    it('rejects non-string outputFile', () => {
      const result = validateConfig({ outputFile: 42 });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/outputFile/);
    });

    it('accumulates multiple errors', () => {
      const result = validateConfig({ defaultFormat: 'csv', cacheEnabled: 'no' });
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('assertValidConfig', () => {
    it('does not throw for valid config', () => {
      expect(() => assertValidConfig(getDefaultConfig())).not.toThrow();
    });

    it('throws with error details for invalid config', () => {
      expect(() => assertValidConfig({ defaultFormat: 'bad' })).toThrow('Invalid config');
    });
  });
});
