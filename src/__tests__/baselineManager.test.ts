import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  buildBaseline,
  saveBaseline,
  loadBaseline,
  listBaselines,
  deleteBaseline,
  getBaselineDir,
} from '../baselineManager';
import { DiffResult } from '../diffEngine';

const mockDiff: DiffResult[] = [
  { name: 'lodash', from: '4.17.20', to: '4.17.21', changeType: 'patch', breaking: false },
  { name: 'express', from: '4.17.1', to: '5.0.0', changeType: 'major', breaking: true },
];

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-baseline-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('buildBaseline', () => {
  it('creates a baseline object with correct fields', () => {
    const baseline = buildBaseline('main-001', 'main', mockDiff);
    expect(baseline.id).toBe('main-001');
    expect(baseline.branch).toBe('main');
    expect(baseline.diff).toEqual(mockDiff);
    expect(baseline.createdAt).toBeTruthy();
  });

  it('includes optional meta when provided', () => {
    const baseline = buildBaseline('main-002', 'main', mockDiff, { author: 'ci' });
    expect(baseline.meta).toEqual({ author: 'ci' });
  });
});

describe('saveBaseline / loadBaseline', () => {
  it('saves and loads a baseline by id', () => {
    const baseline = buildBaseline('test-001', 'feature/x', mockDiff);
    saveBaseline(baseline, tmpDir);
    const loaded = loadBaseline('test-001', tmpDir);
    expect(loaded).toEqual(baseline);
  });

  it('returns null when baseline does not exist', () => {
    const result = loadBaseline('nonexistent', tmpDir);
    expect(result).toBeNull();
  });
});

describe('listBaselines', () => {
  it('returns empty array when directory does not exist', () => {
    const result = listBaselines(path.join(tmpDir, 'missing'));
    expect(result).toEqual([]);
  });

  it('returns all saved baselines sorted by createdAt', () => {
    saveBaseline(buildBaseline('b-1', 'main', mockDiff), tmpDir);
    saveBaseline(buildBaseline('b-2', 'dev', mockDiff), tmpDir);
    const list = listBaselines(tmpDir);
    expect(list).toHaveLength(2);
    expect(list.map((b) => b.id)).toContain('b-1');
    expect(list.map((b) => b.id)).toContain('b-2');
  });
});

describe('deleteBaseline', () => {
  it('deletes an existing baseline and returns true', () => {
    saveBaseline(buildBaseline('del-1', 'main', mockDiff), tmpDir);
    const result = deleteBaseline('del-1', tmpDir);
    expect(result).toBe(true);
    expect(loadBaseline('del-1', tmpDir)).toBeNull();
  });

  it('returns false when baseline does not exist', () => {
    const result = deleteBaseline('ghost', tmpDir);
    expect(result).toBe(false);
  });
});

describe('getBaselineDir', () => {
  it('returns path ending with .stackdiff/baselines', () => {
    const dir = getBaselineDir('/some/project');
    expect(dir).toBe('/some/project/.stackdiff/baselines');
  });
});
