import { filterDiff, parseFilterOptions, FilterOptions } from '../filterEngine';
import { DiffResult } from '../diffEngine';

const mockResults: DiffResult[] = [
  { name: 'react', from: '17.0.0', to: '18.0.0', changeType: 'updated', breaking: true, scope: 'dependencies' },
  { name: 'lodash', from: '4.17.20', to: '4.17.21', changeType: 'updated', breaking: false, scope: 'dependencies' },
  { name: 'jest', from: undefined, to: '29.0.0', changeType: 'added', breaking: false, scope: 'devDependencies' },
  { name: 'mocha', from: '9.0.0', to: undefined, changeType: 'removed', breaking: true, scope: 'devDependencies' },
  { name: 'react-dom', from: '17.0.0', to: '17.0.0', changeType: 'unchanged', breaking: false, scope: 'dependencies' },
];

describe('filterDiff', () => {
  it('returns all results when no options specified', () => {
    expect(filterDiff(mockResults, {})).toHaveLength(5);
  });

  it('filters by scope', () => {
    const result = filterDiff(mockResults, { scope: 'devDependencies' });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.scope === 'devDependencies')).toBe(true);
  });

  it('filters breaking changes only', () => {
    const result = filterDiff(mockResults, { breaking: true });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.breaking)).toBe(true);
  });

  it('filters by package name', () => {
    const result = filterDiff(mockResults, { packages: ['react', 'jest'] });
    expect(result).toHaveLength(2);
  });

  it('filters by change type', () => {
    const result = filterDiff(mockResults, { changeTypes: ['added', 'removed'] });
    expect(result).toHaveLength(2);
  });

  it('combines multiple filters', () => {
    const result = filterDiff(mockResults, { scope: 'dependencies', breaking: true });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('react');
  });

  it('returns empty array when no matches', () => {
    const result = filterDiff(mockResults, { packages: ['nonexistent'] });
    expect(result).toHaveLength(0);
  });
});

describe('parseFilterOptions', () => {
  it('parses scope option', () => {
    const opts = parseFilterOptions({ scope: 'devDependencies' });
    expect(opts.scope).toBe('devDependencies');
  });

  it('parses breaking flag', () => {
    const opts = parseFilterOptions({ breaking: true });
    expect(opts.breaking).toBe(true);
  });

  it('parses single package as array', () => {
    const opts = parseFilterOptions({ package: 'react' });
    expect(opts.packages).toEqual(['react']);
  });

  it('parses multiple packages', () => {
    const opts = parseFilterOptions({ package: ['react', 'lodash'] });
    expect(opts.packages).toEqual(['react', 'lodash']);
  });

  it('returns empty options for empty argv', () => {
    const opts = parseFilterOptions({});
    expect(opts).toEqual({});
  });
});
