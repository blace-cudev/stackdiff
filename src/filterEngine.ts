import { DiffResult } from './diffEngine';

export interface FilterOptions {
  scope?: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'all';
  breaking?: boolean;
  packages?: string[];
  changeTypes?: Array<'added' | 'removed' | 'updated' | 'unchanged'>;
}

export function filterDiff(results: DiffResult[], options: FilterOptions): DiffResult[] {
  let filtered = [...results];

  if (options.scope && options.scope !== 'all') {
    filtered = filtered.filter((r) => r.scope === options.scope);
  }

  if (options.breaking === true) {
    filtered = filtered.filter((r) => r.breaking === true);
  }

  if (options.packages && options.packages.length > 0) {
    const pkgSet = new Set(options.packages.map((p) => p.toLowerCase()));
    filtered = filtered.filter((r) => pkgSet.has(r.name.toLowerCase()));
  }

  if (options.changeTypes && options.changeTypes.length > 0) {
    const typeSet = new Set(options.changeTypes);
    filtered = filtered.filter((r) => typeSet.has(r.changeType));
  }

  return filtered;
}

export function parseFilterOptions(argv: Record<string, unknown>): FilterOptions {
  const options: FilterOptions = {};

  if (argv.scope && typeof argv.scope === 'string') {
    options.scope = argv.scope as FilterOptions['scope'];
  }

  if (argv.breaking === true) {
    options.breaking = true;
  }

  if (argv.package) {
    options.packages = Array.isArray(argv.package)
      ? (argv.package as string[])
      : [argv.package as string];
  }

  if (argv.type) {
    options.changeTypes = Array.isArray(argv.type)
      ? (argv.type as Array<'added' | 'removed' | 'updated' | 'unchanged'>)
      : [argv.type as 'added' | 'removed' | 'updated' | 'unchanged'];
  }

  return options;
}
