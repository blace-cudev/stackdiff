import {
  buildChangelogEntry,
  generateChangelog,
  formatChangelogMarkdown,
} from '../changelogGenerator';
import { DiffResult } from '../diffEngine';

const mockDiffs: Record<string, DiffResult> = {
  react: { from: '17.0.0', to: '18.0.0', changeType: 'major', breaking: true },
  lodash: { from: '4.17.20', to: '4.17.21', changeType: 'patch', breaking: false },
  axios: { from: null, to: '1.4.0', changeType: 'added', breaking: false },
  moment: { from: '2.29.4', to: null, changeType: 'removed', breaking: false },
};

describe('buildChangelogEntry', () => {
  it('builds an entry for a major breaking change', () => {
    const entry = buildChangelogEntry('react', mockDiffs.react);
    expect(entry.package).toBe('react');
    expect(entry.breaking).toBe(true);
    expect(entry.changeType).toBe('major');
    expect(entry.description).toContain('[BREAKING]');
  });

  it('builds an entry for an added package', () => {
    const entry = buildChangelogEntry('axios', mockDiffs.axios);
    expect(entry.changeType).toBe('added');
    expect(entry.from).toBeNull();
    expect(entry.to).toBe('1.4.0');
    expect(entry.description).toContain('Added axios@1.4.0');
  });

  it('builds an entry for a removed package', () => {
    const entry = buildChangelogEntry('moment', mockDiffs.moment);
    expect(entry.changeType).toBe('removed');
    expect(entry.to).toBeNull();
    expect(entry.description).toContain('Removed moment@2.29.4');
  });

  it('uses analysis changeType when provided', () => {
    const entry = buildChangelogEntry('lodash', mockDiffs.lodash, {
      changeType: 'patch',
      satisfiesRange: true,
      fromVersion: '4.17.20',
      toVersion: '4.17.21',
    });
    expect(entry.changeType).toBe('patch');
  });
});

describe('generateChangelog', () => {
  it('generates a changelog with correct counts', () => {
    const changelog = generateChangelog(mockDiffs, 'main', 'feature/upgrade');
    expect(changelog.totalCount).toBe(4);
    expect(changelog.breakingCount).toBe(1);
    expect(changelog.baseBranch).toBe('main');
    expect(changelog.compareBranch).toBe('feature/upgrade');
  });

  it('sorts breaking changes first', () => {
    const changelog = generateChangelog(mockDiffs, 'main', 'feature/upgrade');
    expect(changelog.entries[0].breaking).toBe(true);
    expect(changelog.entries[0].package).toBe('react');
  });

  it('includes a generated timestamp', () => {
    const changelog = generateChangelog(mockDiffs, 'main', 'dev');
    expect(changelog.generated).toBeTruthy();
    expect(new Date(changelog.generated).getTime()).not.toBeNaN();
  });
});

describe('formatChangelogMarkdown', () => {
  it('renders a markdown string with breaking section', () => {
    const changelog = generateChangelog(mockDiffs, 'main', 'feature/upgrade');
    const md = formatChangelogMarkdown(changelog);
    expect(md).toContain('## Dependency Changelog');
    expect(md).toContain('⚠️ Breaking Changes');
    expect(md).toContain('react');
  });

  it('omits breaking section when no breaking changes', () => {
    const safeDiffs: Record<string, DiffResult> = {
      lodash: { from: '4.17.20', to: '4.17.21', changeType: 'patch', breaking: false },
    };
    const changelog = generateChangelog(safeDiffs, 'main', 'dev');
    const md = formatChangelogMarkdown(changelog);
    expect(md).not.toContain('⚠️ Breaking Changes');
    expect(md).toContain('Other Changes');
  });
});
