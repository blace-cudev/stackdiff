import * as fs from 'fs';
import * as path from 'path';
import { DiffResult } from './diffEngine';

export interface Baseline {
  id: string;
  branch: string;
  createdAt: string;
  diff: DiffResult[];
  meta?: Record<string, unknown>;
}

const DEFAULT_BASELINE_DIR = '.stackdiff/baselines';

export function getBaselineDir(baseDir: string = process.cwd()): string {
  return path.join(baseDir, DEFAULT_BASELINE_DIR);
}

export function ensureBaselineDir(baseDir?: string): void {
  const dir = getBaselineDir(baseDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getBaselinePath(id: string, baseDir?: string): string {
  return path.join(getBaselineDir(baseDir), `${id}.json`);
}

export function saveBaseline(baseline: Baseline, baseDir?: string): void {
  ensureBaselineDir(baseDir);
  const filePath = getBaselinePath(baseline.id, baseDir);
  fs.writeFileSync(filePath, JSON.stringify(baseline, null, 2), 'utf-8');
}

export function loadBaseline(id: string, baseDir?: string): Baseline | null {
  const filePath = getBaselinePath(id, baseDir);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as Baseline;
}

export function listBaselines(baseDir?: string): Baseline[] {
  const dir = getBaselineDir(baseDir);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      return JSON.parse(raw) as Baseline;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function deleteBaseline(id: string, baseDir?: string): boolean {
  const filePath = getBaselinePath(id, baseDir);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function buildBaseline(
  id: string,
  branch: string,
  diff: DiffResult[],
  meta?: Record<string, unknown>
): Baseline {
  return {
    id,
    branch,
    createdAt: new Date().toISOString(),
    diff,
    meta,
  };
}
