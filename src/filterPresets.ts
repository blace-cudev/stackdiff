import { FilterOptions } from './filterEngine';

export interface FilterPreset {
  name: string;
  description: string;
  options: FilterOptions;
}

export const BUILT_IN_PRESETS: FilterPreset[] = [
  {
    name: 'breaking',
    description: 'Show only breaking version changes across all scopes',
    options: { breaking: true },
  },
  {
    name: 'prod-breaking',
    description: 'Show breaking changes in production dependencies only',
    options: { breaking: true, scope: 'dependencies' },
  },
  {
    name: 'added-removed',
    description: 'Show packages that were added or removed',
    options: { changeTypes: ['added', 'removed'] },
  },
  {
    name: 'dev-changes',
    description: 'Show all changes in devDependencies',
    options: { scope: 'devDependencies', changeTypes: ['added', 'removed', 'updated'] },
  },
];

export function getPreset(name: string): FilterPreset | undefined {
  return BUILT_IN_PRESETS.find((p) => p.name === name);
}

export function listPresets(): string[] {
  return BUILT_IN_PRESETS.map((p) => `  ${p.name.padEnd(16)} ${p.description}`);
}

export function resolvePreset(
  presetName: string | undefined,
  overrides: FilterOptions
): FilterOptions {
  if (!presetName) return overrides;

  const preset = getPreset(presetName);
  if (!preset) {
    throw new Error(`Unknown filter preset: "${presetName}". Run with --list-presets to see available options.`);
  }

  return { ...preset.options, ...overrides };
}
