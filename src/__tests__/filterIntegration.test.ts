import { filterDiff } from '../filterEngine';
import { resolvePreset } from '../filterPresets';
import { DiffResult } from '../diffEngine';

const sampleDiff: DiffResult[] = [
  { name: 'express', from: '4.17.0', to: '5.0.0', changeType: 'updated', breaking: true, scope: 'dependencies' },
  { name: 'axios', from: '0.27.0', to: '1.0.0', changeType: 'updated', breaking: true, scope: 'dependencies' },
  { name: 'chalk', from: '4.1.0', to: '4.1.2', changeType: 'updated', breaking: false, scope: 'dependencies' },
  { name: 'typescript', from: '4.9.0', to: '5.0.0', changeType: 'updated', breaking: true, scope: 'devDependencies' },
  { name: 'eslint', from: undefined, to: '8.0.0', changeType: 'added', breaking: false, scope: 'devDependencies' },
  { name: 'mocha', from: '9.0.0', to: undefined, changeType: 'removed', breaking: false, scope: 'devDependencies' },
];

describe('filter + preset integration', () => {
  it('prod-breaking preset returns only production breaking changes', () => {
    const opts = resolvePreset('prod-breaking', {});
    const result = filterDiff(sampleDiff, opts);
    expect(result.every((r) => r.breaking && r.scope === 'dependencies')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('added-removed preset returns only added/removed packages', () => {
    const opts = resolvePreset('added-removed', {});
    const result = filterDiff(sampleDiff, opts);
    expect(result.every((r) => r.changeType === 'added' || r.changeType === 'removed')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('dev-changes preset scoped to devDependencies excludes unchanged', () => {
    const opts = resolvePreset('dev-changes', {});
    const result = filterDiff(sampleDiff, opts);
    expect(result.every((r) => r.scope === 'devDependencies')).toBe(true);
    expect(result.some((r) => r.changeType === 'unchanged')).toBe(false);
  });

  it('preset override narrows results further', () => {
    const opts = resolvePreset('breaking', { scope: 'devDependencies' });
    const result = filterDiff(sampleDiff, opts);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('typescript');
  });

  it('returns empty array when no entries match the preset', () => {
    // The sample diff has no production non-breaking updates that are also added;
    // use a combination that yields zero results to verify filterDiff handles it gracefully.
    const opts = resolvePreset('prod-breaking', { changeType: 'added' });
    const result = filterDiff(sampleDiff, opts);
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
