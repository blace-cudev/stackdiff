import { DiffResult } from './diffEngine';

export type OutputFormat = 'text' | 'markdown' | 'json';

export interface FormatOptions {
  format: OutputFormat;
  showUnchanged?: boolean;
  colorize?: boolean;
}

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

function colorize(text: string, color: keyof typeof ANSI, enabled: boolean): string {
  if (!enabled) return text;
  return `${ANSI[color]}${text}${ANSI.reset}`;
}

export function formatDiffSummary(diffs: DiffResult[], options: FormatOptions): string {
  const { format, showUnchanged = false, colorize: useColor = true } = options;

  const filtered = showUnchanged
    ? diffs
    : diffs.filter((d) => d.changeType !== 'unchanged');

  if (format === 'json') {
    return JSON.stringify({ diffs: filtered, total: filtered.length }, null, 2);
  }

  if (format === 'markdown') {
    return formatMarkdownSummary(filtered);
  }

  return formatTextSummary(filtered, useColor);
}

function formatTextSummary(diffs: DiffResult[], useColor: boolean): string {
  if (diffs.length === 0) return 'No dependency changes detected.';

  const lines: string[] = [colorize('Dependency Changes:', 'bold', useColor), ''];

  for (const diff of diffs) {
    const prefix =
      diff.changeType === 'added'
        ? colorize('+ ADDED', 'green', useColor)
        : diff.changeType === 'removed'
        ? colorize('- REMOVED', 'red', useColor)
        : diff.breaking
        ? colorize('! BREAKING', 'red', useColor)
        : colorize('~ UPDATED', 'yellow', useColor);

    const versionInfo =
      diff.changeType === 'added'
        ? diff.newVersion
        : diff.changeType === 'removed'
        ? diff.oldVersion
        : `${diff.oldVersion} → ${diff.newVersion}`;

    lines.push(`  ${prefix}  ${diff.name}  ${versionInfo}`);
  }

  return lines.join('\n');
}

function formatMarkdownSummary(diffs: DiffResult[]): string {
  if (diffs.length === 0) return '_No dependency changes detected._';

  const rows = diffs.map((d) => {
    const type = d.breaking ? `**${d.changeType}** ⚠️` : d.changeType;
    const from = d.oldVersion ?? '—';
    const to = d.newVersion ?? '—';
    return `| ${d.name} | ${type} | ${from} | ${to} |`;
  });

  return [
    '| Package | Change | From | To |',
    '|---------|--------|------|----|',
    ...rows,
  ].join('\n');
}
