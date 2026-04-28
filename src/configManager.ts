import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StackDiffConfig {
  defaultFormat: 'text' | 'markdown' | 'json';
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
  ignorePackages: string[];
  breakingVersionBump: 'major' | 'minor';
  outputFile?: string;
}

const DEFAULT_CONFIG: StackDiffConfig = {
  defaultFormat: 'text',
  cacheEnabled: true,
  cacheTtlSeconds: 3600,
  ignorePackages: [],
  breakingVersionBump: 'major',
};

const CONFIG_FILENAME = '.stackdiffrc.json';

export function getConfigPaths(): string[] {
  return [
    path.join(process.cwd(), CONFIG_FILENAME),
    path.join(os.homedir(), CONFIG_FILENAME),
  ];
}

export function loadConfig(configPath?: string): StackDiffConfig {
  const searchPaths = configPath ? [configPath] : getConfigPaths();

  for (const filePath of searchPaths) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<StackDiffConfig>;
        return mergeConfig(DEFAULT_CONFIG, parsed);
      } catch {
        throw new Error(`Failed to parse config at ${filePath}`);
      }
    }
  }

  return { ...DEFAULT_CONFIG };
}

export function mergeConfig(
  base: StackDiffConfig,
  overrides: Partial<StackDiffConfig>
): StackDiffConfig {
  return {
    ...base,
    ...overrides,
    ignorePackages: [
      ...base.ignorePackages,
      ...(overrides.ignorePackages ?? []),
    ],
  };
}

export function writeConfig(config: StackDiffConfig, filePath?: string): void {
  const target = filePath ?? path.join(process.cwd(), CONFIG_FILENAME);
  fs.writeFileSync(target, JSON.stringify(config, null, 2), 'utf-8');
}

export function getDefaultConfig(): StackDiffConfig {
  return { ...DEFAULT_CONFIG };
}
