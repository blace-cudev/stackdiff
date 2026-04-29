import * as fs from 'fs';
import * as path from 'path';
import { DiffResult } from './diffEngine';

export interface Snapshot {
  id: string;
  branch: string;
  timestamp: string;
  dependencies: Record<string, string>;
  diff?: DiffResult[];
}

export interface SnapshotIndex {
  snapshots: Array<{ id: string; branch: string; timestamp: string }>;
}

const SNAPSHOT_DIR = '.stackdiff/snapshots';

export function getSnapshotPath(id: string): string {
  return path.join(SNAPSHOT_DIR, `${id}.json`);
}

export function ensureSnapshotDir(): void {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

export function saveSnapshot(snapshot: Snapshot): void {
  ensureSnapshotDir();
  const filePath = getSnapshotPath(snapshot.id);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  updateIndex(snapshot);
}

export function loadSnapshot(id: string): Snapshot | null {
  const filePath = getSnapshotPath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export function listSnapshots(): SnapshotIndex['snapshots'] {
  const indexPath = path.join(SNAPSHOT_DIR, 'index.json');
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    const index: SnapshotIndex = JSON.parse(raw);
    return index.snapshots || [];
  } catch {
    return [];
  }
}

export function deleteSnapshot(id: string): boolean {
  const filePath = getSnapshotPath(id);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  removeFromIndex(id);
  return true;
}

function updateIndex(snapshot: Snapshot): void {
  const indexPath = path.join(SNAPSHOT_DIR, 'index.json');
  const existing = listSnapshots();
  const filtered = existing.filter((s) => s.id !== snapshot.id);
  filtered.push({ id: snapshot.id, branch: snapshot.branch, timestamp: snapshot.timestamp });
  fs.writeFileSync(indexPath, JSON.stringify({ snapshots: filtered }, null, 2), 'utf-8');
}

function removeFromIndex(id: string): void {
  const indexPath = path.join(SNAPSHOT_DIR, 'index.json');
  const existing = listSnapshots().filter((s) => s.id !== id);
  fs.writeFileSync(indexPath, JSON.stringify({ snapshots: existing }, null, 2), 'utf-8');
}

export function generateSnapshotId(branch: string): string {
  const ts = Date.now();
  const safe = branch.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safe}_${ts}`;
}
