import { generateReport, ReportOptions } from '../reporter';
import { DiffResult } from '../diffEngine';

const sampleDiffs: DiffResult[] = [
  { name: 'react', from: '17.0.0', to: '18.0.0', changeType: 'upgraded', breaking: true },
  { name: 'lodash', from: '4.17.20', to: '4.17.21', changeType: 'upgraded', breaking: false },
  { name: 'axios', from: '1.0.0', to: undefined, changeType: 'removed', breaking: true },
  { name: 'zod', from: undefined, to: '3.20.0', changeType: 'added', breaking: false },
];

describe('generateReport', () => {
  describe('text format', () => {
    it('should include all diffs in text output', () => {
      const result = generateReport(sampleDiffs, { format: 'text' });
      expect(result).toContain('react');
      expect(result).toContain('lodash');
      expect(result).toContain('axios');
      expect(result).toContain('zod');
    });

    it('should mark breaking changes', () => {
      const result = generateReport(sampleDiffs, { format: 'text' });
      expect(result).toContain('[BREAKING]');
    });

    it('should show version transitions', () => {
      const result = generateReport(sampleDiffs, { format: 'text' });
      expect(result).toContain('17.0.0 → 18.0.0');
    });
  });

  describe('json format', () => {
    it('should return valid JSON', () => {
      const result = generateReport(sampleDiffs, { format: 'json' });
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should contain all diff entries', () => {
      const result = generateReport(sampleDiffs, { format: 'json' });
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(4);
    });
  });

  describe('markdown format', () => {
    it('should include markdown table headers', () => {
      const result = generateReport(sampleDiffs, { format: 'markdown' });
      expect(result).toContain('| Package |');
      expect(result).toContain('| Breaking |');
    });

    it('should mark breaking changes with warning emoji', () => {
      const result = generateReport(sampleDiffs, { format: 'markdown' });
      expect(result).toContain('⚠️ Yes');
    });
  });

  describe('showBreakingOnly filter', () => {
    it('should filter to only breaking changes', () => {
      const result = generateReport(sampleDiffs, { format: 'json', showBreakingOnly: true });
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed.every((d: any) => d.breaking)).toBe(true);
    });
  });

  describe('empty diffs', () => {
    it('should return no changes message for text format', () => {
      const result = generateReport([], { format: 'text' });
      expect(result).toBe('No dependency changes found.');
    });

    it('should return empty array for json format', () => {
      const result = generateReport([], { format: 'json' });
      expect(JSON.parse(result)).toEqual([]);
    });
  });
});
