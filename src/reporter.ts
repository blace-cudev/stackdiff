import { DiffResult, ChangeType } from './diffEngine';

export interface ReportOptions {
  format: 'text' | 'json' | 'markdown';
  showBreakingOnly?: boolean;
  color?: boolean;
}

const CHANGE_SYMBOLS: Record<ChangeType, string> = {
  added: '+',
  removed: '-',
  upgraded: '↑',
  downgraded: '↓',
  unchanged: '=',
};

const CHANGE_LABELS: Record<ChangeType, string> = {
  added: 'ADDED',
  removed: 'REMOVED',
  upgraded: 'UPGRADED',
  downgraded: 'DOWNGRADED',
  unchanged: 'UNCHANGED',
};

export function generateReport(diffs: DiffResult[], options: ReportOptions): string {
  const filtered = options.showBreakingOnly
    ? diffs.filter((d) => d.breaking)
    : diffs;

  if (filtered.length === 0) {
    return options.format === 'json'
      ? JSON.stringify([], null, 2)
      : 'No dependency changes found.';
  }

  switch (options.format) {
    case 'json':
      return formatJson(filtered);
    case 'markdown':
      return formatMarkdown(filtered);
    case 'text':
    default:
      return formatText(filtered, options.color ?? false);
  }
}

function formatText(diffs: DiffResult[], color: boolean): string {
  const lines: string[] = ['Dependency Changes:', ''];
  for (const diff of diffs) {
    const symbol = CHANGE_SYMBOLS[diff.changeType];
    const label = CHANGE_LABELS[diff.changeType];
    const breaking = diff.breaking ? ' [BREAKING]' : '';
    const versions =
      diff.from && diff.to
        ? ` (${diff.from} → ${diff.to})`
        : diff.to
        ? ` (${diff.to})`
        : diff.from
        ? ` (${diff.from})`
        : '';
    lines.push(`  ${symbol} ${diff.name}${versions} ${label}${breaking}`);
  }
  return lines.join('\n');
}

function formatMarkdown(diffs: DiffResult[]): string {
  const lines: string[] = ['## Dependency Changes', '', '| Package | From | To | Change | Breaking |', '|---------|------|----|--------|----------|'];
  for (const diff of diffs) {
    const from = diff.from ?? '-';
    const to = diff.to ?? '-';
    const breaking = diff.breaking ? '⚠️ Yes' : 'No';
    lines.push(`| ${diff.name} | ${from} | ${to} | ${CHANGE_LABELS[diff.changeType]} | ${breaking} |`);
  }
  return lines.join('\n');
}

function formatJson(diffs: DiffResult[]): string {
  return JSON.stringify(diffs, null, 2);
}
