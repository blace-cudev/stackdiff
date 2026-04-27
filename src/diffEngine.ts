import semver from "semver";

export type ChangeType = "added" | "removed" | "upgraded" | "downgraded" | "changed";

export interface DependencyChange {
  name: string;
  changeType: ChangeType;
  fromVersion: string | null;
  toVersion: string | null;
  isBreaking: boolean;
}

/**
 * Compares two flat dependency maps and returns a list of changes.
 */
export function diffDependencies(
  base: Record<string, string>,
  head: Record<string, string>
): DependencyChange[] {
  const changes: DependencyChange[] = [];
  const allPackages = new Set([...Object.keys(base), ...Object.keys(head)]);

  for (const name of allPackages) {
    const fromVersion = base[name] ?? null;
    const toVersion = head[name] ?? null;

    if (fromVersion === toVersion) continue;

    if (!fromVersion) {
      changes.push({ name, changeType: "added", fromVersion: null, toVersion, isBreaking: false });
      continue;
    }

    if (!toVersion) {
      changes.push({ name, changeType: "removed", fromVersion, toVersion: null, isBreaking: true });
      continue;
    }

    const changeType = resolveChangeType(fromVersion, toVersion);
    const isBreaking = detectBreaking(fromVersion, toVersion);
    changes.push({ name, changeType, fromVersion, toVersion, isBreaking });
  }

  return changes.sort((a, b) => a.name.localeCompare(b.name));
}

function resolveChangeType(from: string, to: string): ChangeType {
  const cleanFrom = semver.coerce(from)?.version;
  const cleanTo = semver.coerce(to)?.version;
  if (!cleanFrom || !cleanTo) return "changed";
  if (semver.gt(cleanTo, cleanFrom)) return "upgraded";
  if (semver.lt(cleanTo, cleanFrom)) return "downgraded";
  return "changed";
}

function detectBreaking(from: string, to: string): boolean {
  const cleanFrom = semver.coerce(from);
  const cleanTo = semver.coerce(to);
  if (!cleanFrom || !cleanTo) return false;
  // Major bump or downgrade is considered breaking
  if (semver.major(cleanTo) > semver.major(cleanFrom)) return true;
  if (semver.lt(cleanTo, cleanFrom)) return true;
  return false;
}
