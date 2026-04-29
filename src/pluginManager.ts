import * as fs from 'fs';
import * as path from 'path';
import { DiffResult } from './diffEngine';

export interface StackDiffPlugin {
  name: string;
  version: string;
  onDiff?: (diff: DiffResult[]) => DiffResult[];
  onReport?: (report: string, format: string) => string;
}

export interface PluginManifest {
  plugins: string[];
}

const loadedPlugins: StackDiffPlugin[] = [];

export function loadPlugin(pluginPathOrName: string): StackDiffPlugin {
  const resolved = resolvePluginPath(pluginPathOrName);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(resolved);
  const plugin: StackDiffPlugin = mod.default ?? mod;
  if (!plugin.name || !plugin.version) {
    throw new Error(`Plugin at "${pluginPathOrName}" must export { name, version }.`);
  }
  loadedPlugins.push(plugin);
  return plugin;
}

export function resolvePluginPath(pluginPathOrName: string): string {
  if (pluginPathOrName.startsWith('.') || path.isAbsolute(pluginPathOrName)) {
    return path.resolve(pluginPathOrName);
  }
  return require.resolve(pluginPathOrName, { paths: [process.cwd()] });
}

export function loadPluginsFromManifest(manifestPath: string): StackDiffPlugin[] {
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const manifest: PluginManifest = JSON.parse(raw);
  return (manifest.plugins ?? []).map(loadPlugin);
}

export function applyDiffPlugins(diff: DiffResult[]): DiffResult[] {
  return loadedPlugins.reduce((acc, plugin) => {
    if (typeof plugin.onDiff === 'function') {
      return plugin.onDiff(acc);
    }
    return acc;
  }, diff);
}

export function applyReportPlugins(report: string, format: string): string {
  return loadedPlugins.reduce((acc, plugin) => {
    if (typeof plugin.onReport === 'function') {
      return plugin.onReport(acc, format);
    }
    return acc;
  }, report);
}

export function getLoadedPlugins(): StackDiffPlugin[] {
  return [...loadedPlugins];
}

export function clearLoadedPlugins(): void {
  loadedPlugins.length = 0;
}
