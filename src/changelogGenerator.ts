import { DiffResult } from './diffEngine';
import { AnalyzedChange } from './semverAnalyzer';

export interface ChangelogEntry {
  package: string;
  from: string | null;
  to: string | null;
  changeType: 'major' | 'minor' | 'patch' | 'added' | 'removed' | 'unknown';
  breaking: boolean;
  description: string;
}

export interface Changelog {
  generated: string;
  baseBranch: string;
  compareBranch: string;
  entries: ChangelogEntry[];
  breakingCount: number;
  totalCount: number;
}

export function buildChangelogEntry(
  pkg: string,
  diff: DiffResult,
  analysis?: AnalyzedChange
): ChangelogEntry {
  const changeType = analysis?.changeType ?? diff.changeType ?? 'unknown';
  const breaking = diff.breaking ?? false;

  let description = '';
  if (diff.changeType === 'added') {
    description = `Added ${pkg}@${diff.to}`;
  } else if (diff.changeType === 'removed') {
    description = `Removed ${pkg}@${diff.from}`;
  } else {
    description = `Updated ${pkg} from ${diff.from} to ${diff.to}`;
    if (breaking) description += ' [BREAKING]';
  }

  return {
    package: pkg,
    from: diff.from ?? null,
    to: diff.to ?? null,
    changeType: changeType as ChangelogEntry['changeType'],
    breaking,
    description,
  };
}

export function generateChangelog(
  diffs: Record<string, DiffResult>,
  baseBranch: string,
  compareBranch: string,
  analyses?: Record<string, AnalyzedChange>
): Changelog {
  const entries: ChangelogEntry[] = Object.entries(diffs).map(([pkg, diff]) =>
    buildChangelogEntry(pkg, diff, analyses?.[pkg])
  );

  entries.sort((a, b) => {
    if (a.breaking && !b.breaking) return -1;
    if (!a.breaking && b.breaking) return 1;
    return a.package.localeCompare(b.package);
  });

  return {
    generated: new Date().toISOString(),
    baseBranch,
    compareBranch,
    entries,
    breakingCount: entries.filter((e) => e.breaking).length,
    totalCount: entries.length,
  };
}

export function formatChangelogMarkdown(changelog: Changelog): string {
  const lines: string[] = [
    `## Dependency Changelog`,
    ``,
    `**Base:** \`${changelog.baseBranch}\` → **Compare:** \`${changelog.compareBranch}\``,
    `_Generated: ${changelog.generated}_`,
    ``,
    `**Total changes:** ${changelog.totalCount} | **Breaking:** ${changelog.breakingCount}`,
    ``,
  ];

  if (changelog.breakingCount > 0) {
    lines.push(`### ⚠️ Breaking Changes`, '');
    changelog.entries
      .filter((e) => e.breaking)
      .forEach((e) => lines.push(`- ${e.description}`));
    lines.push('');
  }

  const nonBreaking = changelog.entries.filter((e) => !e.breaking);
  if (nonBreaking.length > 0) {
    lines.push(`### Other Changes`, '');
    nonBreaking.forEach((e) => lines.push(`- ${e.description}`));
    lines.push('');
  }

  return lines.join('\n');
}
