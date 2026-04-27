import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

const CACHE_DIR = path.join(os.tmpdir(), 'stackdiff-cache');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export function getCacheKey(branch: string, filePath: string): string {
  return crypto.createHash('md5').update(`${branch}:${filePath}`).digest('hex');
}

export function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readCache<T>(key: string): T | null {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      fs.unlinkSync(filePath);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  ensureCacheDir();
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  const entry: CacheEntry<T> = { timestamp: Date.now(), data };
  fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
}

export function clearCache(): void {
  if (!fs.existsSync(CACHE_DIR)) return;
  const files = fs.readdirSync(CACHE_DIR);
  files.forEach(file => fs.unlinkSync(path.join(CACHE_DIR, file)));
}

export function getCacheStats(): { count: number; dir: string } {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  return { count: files.length, dir: CACHE_DIR };
}
