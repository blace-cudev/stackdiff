import * as semver from 'semver';

export type VersionChangeType = 'major' | 'minor' | 'patch' | 'prerelease' | 'unknown' | 'none';

export interface VersionAnalysis {
  from: string;
  to: string;
  changeType: VersionChangeType;
  isBreaking: boolean;
  fromClean: string | null;
  toClean: string | null;
}

export function analyzeVersionChange(from: string, to: string): VersionAnalysis {
  const fromClean = semver.valid(semver.coerce(from));
  const toClean = semver.valid(semver.coerce(to));

  if (!fromClean || !toClean) {
    return { from, to, changeType: 'unknown', isBreaking: false, fromClean, toClean };
  }

  if (fromClean === toClean) {
    return { from, to, changeType: 'none', isBreaking: false, fromClean, toClean };
  }

  const diff = semver.diff(fromClean, toClean);

  let changeType: VersionChangeType = 'unknown';
  if (diff === 'major') changeType = 'major';
  else if (diff === 'minor') changeType = 'minor';
  else if (diff === 'patch') changeType = 'patch';
  else if (diff && diff.startsWith('pre')) changeType = 'prerelease';

  const isBreaking = changeType === 'major' && semver.major(toClean) > 0;

  return { from, to, changeType, isBreaking, fromClean, toClean };
}

export function isSatisfied(version: string, range: string): boolean {
  const clean = semver.valid(semver.coerce(version));
  if (!clean) return false;
  return semver.satisfies(clean, range);
}

export function sortVersions(versions: string[]): string[] {
  return [...versions].sort((a, b) => {
    const ca = semver.valid(semver.coerce(a));
    const cb = semver.valid(semver.coerce(b));
    if (!ca || !cb) return 0;
    return semver.compare(ca, cb);
  });
}

export function getLatest(versions: string[]): string | null {
  const sorted = sortVersions(versions);
  return sorted.length > 0 ? sorted[sorted.length - 1] : null;
}
