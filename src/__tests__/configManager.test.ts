import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadConfig,
  mergeConfig,
  writeConfig,
  getDefaultConfig,
  getConfigPaths,
  StackDiffConfig,
} from '../configManager';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('configManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDefaultConfig', () => {
    it('returns default configuration values', () => {
      const config = getDefaultConfig();
      expect(config.defaultFormat).toBe('text');
      expect(config.cacheEnabled).toBe(true);
      expect(config.cacheTtlSeconds).toBe(3600);
      expect(config.ignorePackages).toEqual([]);
      expect(config.breakingVersionBump).toBe('major');
    });
  });

  describe('loadConfig', () => {
    it('returns default config when no file found', () => {
      mockFs.existsSync.mockReturnValue(false);
      const config = loadConfig();
      expect(config).toEqual(getDefaultConfig());
    });

    it('loads and merges config from file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ defaultFormat: 'json', cacheTtlSeconds: 600 })
      );
      const config = loadConfig('/some/path/.stackdiffrc.json');
      expect(config.defaultFormat).toBe('json');
      expect(config.cacheTtlSeconds).toBe(600);
      expect(config.cacheEnabled).toBe(true);
    });

    it('throws on invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('not-json');
      expect(() => loadConfig('/bad/path')).toThrow('Failed to parse config');
    });
  });

  describe('mergeConfig', () => {
    it('merges ignorePackages arrays', () => {
      const base = getDefaultConfig();
      base.ignorePackages = ['lodash'];
      const result = mergeConfig(base, { ignorePackages: ['react'] });
      expect(result.ignorePackages).toEqual(['lodash', 'react']);
    });

    it('overrides scalar values', () => {
      const base = getDefaultConfig();
      const result = mergeConfig(base, { defaultFormat: 'markdown' });
      expect(result.defaultFormat).toBe('markdown');
    });
  });

  describe('writeConfig', () => {
    it('writes config as formatted JSON', () => {
      const config = getDefaultConfig();
      writeConfig(config, '/tmp/.stackdiffrc.json');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/tmp/.stackdiffrc.json',
        JSON.stringify(config, null, 2),
        'utf-8'
      );
    });
  });

  describe('getConfigPaths', () => {
    it('returns cwd and home dir paths', () => {
      const paths = getConfigPaths();
      expect(paths).toHaveLength(2);
      expect(paths[0]).toContain(process.cwd());
      expect(paths[1]).toContain(os.homedir());
    });
  });
});
