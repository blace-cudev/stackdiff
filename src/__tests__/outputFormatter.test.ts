import { formatDiffSummary, FormatOptions } from '../outputFormatter';
import { DiffResult } from '../diffEngine';

const sampleDiffs: DiffResult[] = [
  { name: 'lodash', changeType: 'updated', oldVersion: '4.17.20', newVersion: '4.17.21', breaking: false },
  { name: 'react', changeType: 'updated', oldVersion: '17.0.0', newVersion: '18.0.0', breaking: true },
  { name: 'axios', changeType: 'added', oldVersion: undefined, newVersion: '1.4.0', breaking: false },
  { name: 'moment', changeType: 'removed', oldVersion: '2.29.1', newVersion: undefined, breaking: false },
  { name: 'express', changeType: 'unchanged', oldVersion: '4.18.0', newVersion: '4.18.0', breaking: false },
];

describe('formatDiffSummary', () => {
  describe('text format', () => {
    const options: FormatOptions = { format: 'text', colorize: false };

    it('excludes unchanged entries by default', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(output).not.toContain('express');
    });

    it('includes unchanged entries when showUnchanged is true', () => {
      const output = formatDiffSummary(sampleDiffs, { ...options, showUnchanged: true });
      expect(output).toContain('express');
    });

    it('marks added packages with ADDED', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(output).toContain('ADDED');
      expect(output).toContain('axios');
    });

    it('marks removed packages with REMOVED', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(output).toContain('REMOVED');
      expect(output).toContain('moment');
    });

    it('marks breaking changes with BREAKING', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(output).toContain('BREAKING');
      expect(output).toContain('react');
    });

    it('shows version arrow for updated packages', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(output).toContain('4.17.20 → 4.17.21');
    });

    it('returns no-change message when diffs list is empty', () => {
      const output = formatDiffSummary([], options);
      expect(output).toBe('No dependency changes detected.');
    });
  });

  describe('markdown format', () => {
    const options: FormatOptions = { format: 'markdown' };

    it('renders a markdown table', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(output).toContain('| Package | Change | From | To |');
    });

    it('flags breaking changes with warning emoji', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(output).toContain('⚠️');
    });

    it('returns italic message when no changes', () => {
      const output = formatDiffSummary([], options);
      expect(output).toBe('_No dependency changes detected._');
    });
  });

  describe('json format', () => {
    const options: FormatOptions = { format: 'json' };

    it('returns valid JSON', () => {
      const output = formatDiffSummary(sampleDiffs, options);
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('includes total count', () => {
      const parsed = JSON.parse(formatDiffSummary(sampleDiffs, options));
      expect(parsed.total).toBe(4); // unchanged filtered out
    });

    it('includes diffs array', () => {
      const parsed = JSON.parse(formatDiffSummary(sampleDiffs, options));
      expect(Array.isArray(parsed.diffs)).toBe(true);
    });
  });
});
