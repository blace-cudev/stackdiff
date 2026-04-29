import {
  analyzeVersionChange,
  isSatisfied,
  sortVersions,
  getLatest,
} from '../semverAnalyzer';

describe('analyzeVersionChange', () => {
  it('detects major version bump as breaking', () => {
    const result = analyzeVersionChange('1.2.3', '2.0.0');
    expect(result.changeType).toBe('major');
    expect(result.isBreaking).toBe(true);
  });

  it('detects minor version bump as non-breaking', () => {
    const result = analyzeVersionChange('1.2.3', '1.3.0');
    expect(result.changeType).toBe('minor');
    expect(result.isBreaking).toBe(false);
  });

  it('detects patch version bump', () => {
    const result = analyzeVersionChange('1.2.3', '1.2.4');
    expect(result.changeType).toBe('patch');
    expect(result.isBreaking).toBe(false);
  });

  it('returns none when versions are equal', () => {
    const result = analyzeVersionChange('1.2.3', '1.2.3');
    expect(result.changeType).toBe('none');
    expect(result.isBreaking).toBe(false);
  });

  it('handles semver range prefixes like ^ and ~', () => {
    const result = analyzeVersionChange('^1.2.3', '^2.0.0');
    expect(result.changeType).toBe('major');
    expect(result.fromClean).toBe('1.2.3');
    expect(result.toClean).toBe('2.0.0');
  });

  it('returns unknown for non-semver strings', () => {
    const result = analyzeVersionChange('latest', 'next');
    expect(result.changeType).toBe('unknown');
    expect(result.isBreaking).toBe(false);
  });

  it('does not mark 0.x major bump as breaking', () => {
    const result = analyzeVersionChange('0.1.0', '1.0.0');
    expect(result.changeType).toBe('major');
    expect(result.isBreaking).toBe(false);
  });
});

describe('isSatisfied', () => {
  it('returns true when version satisfies range', () => {
    expect(isSatisfied('1.5.0', '^1.0.0')).toBe(true);
  });

  it('returns false when version does not satisfy range', () => {
    expect(isSatisfied('2.0.0', '^1.0.0')).toBe(false);
  });

  it('returns false for invalid version', () => {
    expect(isSatisfied('latest', '^1.0.0')).toBe(false);
  });
});

describe('sortVersions', () => {
  it('sorts versions in ascending order', () => {
    const result = sortVersions(['2.0.0', '1.0.0', '1.5.0']);
    expect(result).toEqual(['1.0.0', '1.5.0', '2.0.0']);
  });
});

describe('getLatest', () => {
  it('returns the latest version', () => {
    expect(getLatest(['1.0.0', '3.0.0', '2.0.0'])).toBe('3.0.0');
  });

  it('returns null for empty array', () => {
    expect(getLatest([])).toBeNull();
  });
});
