import * as fs from 'fs';
import * as path from 'path';
import {
  loadPlugin,
  applyDiffPlugins,
  applyReportPlugins,
  clearLoadedPlugins,
  getLoadedPlugins,
} from '../pluginManager';
import { DiffResult } from '../diffEngine';

const diff: DiffResult[] = [
  { name: 'axios', from: '0.21.0', to: '1.0.0', changeType: 'major', breaking: true },
  { name: 'chalk', from: '4.1.0', to: '4.1.2', changeType: 'patch', breaking: false },
  { name: 'semver', from: '7.3.5', to: '7.4.0', changeType: 'minor', breaking: false },
];

let tmpDir: string;
let pluginFile: string;

beforeAll(() => {
  tmpDir = fs.mkdtempSync('/tmp/stackdiff-integration-');
  pluginFile = path.join(tmpDir, 'integrationPlugin.js');
  fs.writeFileSync(
    pluginFile,
    `module.exports = {
  name: 'integration-plugin',
  version: '1.0.0',
  onDiff: (diff) => diff.filter(d => d.breaking),
  onReport: (report, format) => '[' + format.toUpperCase() + '] ' + report,
};`
  );
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

beforeEach(() => {
  clearLoadedPlugins();
});

test('full integration: load plugin and apply to diff', () => {
  loadPlugin(pluginFile);
  expect(getLoadedPlugins()).toHaveLength(1);

  const filtered = applyDiffPlugins(diff);
  expect(filtered).toHaveLength(1);
  expect(filtered[0].name).toBe('axios');
});

test('full integration: load plugin and apply to report', () => {
  loadPlugin(pluginFile);
  const report = applyReportPlugins('## Diff Report', 'markdown');
  expect(report).toBe('[MARKDOWN] ## Diff Report');
});

test('multiple plugins compose in order', () => {
  const secondFile = path.join(tmpDir, 'secondPlugin.js');
  fs.writeFileSync(
    secondFile,
    `module.exports = {
  name: 'second-plugin',
  version: '1.0.0',
  onReport: (report) => report + ' -- reviewed',
};`
  );
  loadPlugin(pluginFile);
  loadPlugin(secondFile);
  const report = applyReportPlugins('base', 'text');
  expect(report).toBe('[TEXT] base -- reviewed');
});
