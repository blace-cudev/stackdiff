import * as fs from "fs";
import * as path from "path";

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface DependencyMap {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}

/**
 * Reads and parses a package.json file from the given directory.
 */
export function parsePackageJson(filePath: string): PackageJson {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`package.json not found at: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, "utf-8");
  try {
    return JSON.parse(raw) as PackageJson;
  } catch {
    throw new Error(`Failed to parse package.json at: ${resolved}`);
  }
}

/**
 * Extracts all dependency maps from a parsed PackageJson.
 */
export function extractDependencies(pkg: PackageJson): DependencyMap {
  return {
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    peerDependencies: pkg.peerDependencies ?? {},
  };
}

/**
 * Flattens all dependency types into a single map.
 * In case of conflicts, the order of precedence is:
 * dependencies > devDependencies > peerDependencies
 */
export function flattenDependencies(map: DependencyMap): Record<string, string> {
  return {
    ...map.peerDependencies,
    ...map.devDependencies,
    ...map.dependencies,
  };
}
