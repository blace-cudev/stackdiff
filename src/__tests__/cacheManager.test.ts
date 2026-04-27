import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getCacheKey,
  readCache,
  writeCache,
  clearCache,
  getCacheStats,
} from '../cacheManager';

const CACHE_DIR = path.join(os.tmpdir(), 'stackdiff-cache');

describe('cacheManager', () => {
  beforeEach(() => {
    clearCache();
  });

  afterAll(() => {
    clearCache();
  });

  describe('getCacheKey', () => {
    it('returns a consistent hash for the same inputs', () => {
      const key1 = getCacheKey('main', 'package.json');
      const key2 = getCacheKey('main', 'package.json');
      expect(key1).toBe(key2);
    });

    it('returns different hashes for different inputs', () => {
      const key1 = getCacheKey('main', 'package.json');
      const key2 = getCacheKey('dev', 'package.json');
      expect(key1).not.toBe(key2);
    });
  });

  describe('writeCache and readCache', () => {
    it('stores and retrieves data correctly', () => {
      const key = getCacheKey('main', 'package.json');
      const data = { version: '1.0.0', deps: { react: '^18.0.0' } };
      writeCache(key, data);
      const result = readCache<typeof data>(key);
      expect(result).toEqual(data);
    });

    it('returns null for missing cache entries', () => {
      const result = readCache('nonexistent-key');
      expect(result).toBeNull();
    });

    it('returns null for expired entries', () => {
      const key = getCacheKey('main', 'package.json');
      const entry = { timestamp: Date.now() - 10 * 60 * 1000, data: { foo: 'bar' } };
      const filePath = path.join(CACHE_DIR, `${key}.json`);
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(entry));
      const result = readCache(key);
      expect(result).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('reports correct file count', () => {
      writeCache('key1', { a: 1 });
      writeCache('key2', { b: 2 });
      const stats = getCacheStats();
      expect(stats.count).toBe(2);
      expect(stats.dir).toBe(CACHE_DIR);
    });
  });

  describe('clearCache', () => {
    it('removes all cached files', () => {
      writeCache('key1', { a: 1 });
      clearCache();
      const stats = getCacheStats();
      expect(stats.count).toBe(0);
    });
  });
});
