import { execSync } from 'child_process';
import * as path from 'path';

export interface BranchPackageJson {
  branch: string;
  content: string;
}

/**
 * Fetches the raw content of package.json from a given git branch.
 */
export function getPackageJsonFromBranch(
  branch: string,
  repoPath: string = process.cwd(),
  filePath: string = 'package.json'
): BranchPackageJson {
  try {
    const content = execSync(
      `git -C ${repoPath} show ${branch}:${filePath}`,
      { encoding: 'utf-8' }
    );
    return { branch, content };
  } catch (err) {
    throw new Error(
      `Failed to read '${filePath}' from branch '${branch}': ${(err as Error).message}`
    );
  }
}

/**
 * Validates that a branch exists in the repository.
 */
export function branchExists(
  branch: string,
  repoPath: string = process.cwd()
): boolean {
  try {
    execSync(`git -C ${repoPath} rev-parse --verify ${branch}`, {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the current active branch name.
 */
export function getCurrentBranch(repoPath: string = process.cwd()): string {
  try {
    return execSync(`git -C ${repoPath} rev-parse --abbrev-ref HEAD`, {
      encoding: 'utf-8',
    }).trim();
  } catch (err) {
    throw new Error(
      `Failed to determine current branch: ${(err as Error).message}`
    );
  }
}
