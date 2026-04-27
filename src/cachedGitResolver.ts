import { getPackageJsonFromBranch, branchExists, getCurrentBranch } from './gitResolver';
import { getCacheKey, readCache, writeCache } from './cacheManager';

export interface ResolvedPackage {
  branch: string;
  content: string;
  cached: boolean;
}

export async function getCachedPackageJson(
  branch: string,
  filePath: string = 'package.json'
): Promise<ResolvedPackage> {
  const key = getCacheKey(branch, filePath);
  const cached = readCache<string>(key);

  if (cached !== null) {
    return { branch, content: cached, cached: true };
  }

  const content = await getPackageJsonFromBranch(branch, filePath);
  writeCache(key, content);
  return { branch, content, cached: false };
}

export async function validateBranches(
  baseBranch: string,
  targetBranch: string
): Promise<{ base: boolean; target: boolean }> {
  const [base, target] = await Promise.all([
    branchExists(baseBranch),
    branchExists(targetBranch),
  ]);
  return { base, target };
}

export async function resolveCurrentBranch(): Promise<string> {
  return getCurrentBranch();
}
