import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, writeConfig, getDefaultConfig, StackDiffConfig } from '../configManager';
import { validateConfig } from '../configValidator';

describe('config integration', () => {
  let tmpDir: string;
  let configPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-test-'));
    configPath = path.join(tmpDir, '.stackdiffrc.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes and reads back a config file correctly', () => {
    const original: StackDiffConfig = {
      ...getDefaultConfig(),
      defaultFormat: 'markdown',
      cacheTtlSeconds: 1800,
      ignorePackages: ['typescript', 'eslint'],
    };

    writeConfig(original, configPath);
    const loaded = loadConfig(configPath);

    expect(loaded.defaultFormat).toBe('markdown');
    expect(loaded.cacheTtlSeconds).toBe(1800);
    expect(loaded.ignorePackages).toContain('typescript');
    expect(loaded.ignorePackages).toContain('eslint');
  });

  it('loaded config passes validation', () => {
    const config = getDefaultConfig();
    writeConfig(config, configPath);
    const loaded = loadConfig(configPath);
    const result = validateConfig(loaded);
    expect(result.valid).toBe(true);
  });

  it('partial config file merges with defaults', () => {
    fs.writeFileSync(configPath, JSON.stringify({ defaultFormat: 'json' }), 'utf-8');
    const loaded = loadConfig(configPath);
    expect(loaded.defaultFormat).toBe('json');
    expect(loaded.cacheEnabled).toBe(true);
    expect(loaded.cacheTtlSeconds).toBe(3600);
  });

  it('ignorePackages from file and base are merged', () => {
    const base = getDefaultConfig();
    base.ignorePackages = ['lodash'];
    writeConfig(base, configPath);
    const loaded = loadConfig(configPath);
    expect(loaded.ignorePackages).toContain('lodash');
  });
});
