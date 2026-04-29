import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
  generateSnapshotId,
  Snapshot,
} from '../snapshotManager';

describe('snapshotManager integration', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-snap-'));
  const originalCwd = process.cwd();

  beforeAll(() => {
    process.chdir(tmpDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeSnapshot = (branch: string, deps: Record<string, string>): Snapshot => ({
    id: generateSnapshotId(branch),
    branch,
    timestamp: new Date().toISOString(),
    dependencies: deps,
  });

  it('should save and reload a snapshot', () => {
    const snap = makeSnapshot('main', { react: '18.0.0' });
    saveSnapshot(snap);
    const loaded = loadSnapshot(snap.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.branch).toBe('main');
    expect(loaded!.dependencies.react).toBe('18.0.0');
  });

  it('should list saved snapshots', () => {
    const snap = makeSnapshot('develop', { lodash: '4.17.21' });
    saveSnapshot(snap);
    const list = listSnapshots();
    const found = list.find((s) => s.id === snap.id);
    expect(found).toBeDefined();
    expect(found!.branch).toBe('develop');
  });

  it('should delete a snapshot and remove from index', () => {
    const snap = makeSnapshot('feature-x', { axios: '1.0.0' });
    saveSnapshot(snap);
    expect(listSnapshots().find((s) => s.id === snap.id)).toBeDefined();
    const deleted = deleteSnapshot(snap.id);
    expect(deleted).toBe(true);
    expect(loadSnapshot(snap.id)).toBeNull();
    expect(listSnapshots().find((s) => s.id === snap.id)).toBeUndefined();
  });

  it('should overwrite existing snapshot with same id', () => {
    const snap = makeSnapshot('main', { react: '17.0.0' });
    saveSnapshot(snap);
    const updated = { ...snap, dependencies: { react: '18.2.0' } };
    saveSnapshot(updated);
    const loaded = loadSnapshot(snap.id);
    expect(loaded!.dependencies.react).toBe('18.2.0');
    const list = listSnapshots().filter((s) => s.id === snap.id);
    expect(list).toHaveLength(1);
  });
});
