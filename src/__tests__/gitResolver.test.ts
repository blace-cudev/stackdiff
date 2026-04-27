import { execSync } from 'child_process';
import {
  getPackageJsonFromBranch,
  branchExists,
  getCurrentBranch,
} from '../gitResolver';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

const mockExecSync = execSync as jest.Mock;

describe('gitResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPackageJsonFromBranch', () => {
    it('should return branch and content when command succeeds', () => {
      const fakeContent = JSON.stringify({ name: 'my-app', version: '1.0.0' });
      mockExecSync.mockReturnValue(fakeContent);

      const result = getPackageJsonFromBranch('main');

      expect(result).toEqual({ branch: 'main', content: fakeContent });
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('show main:package.json'),
        expect.objectContaining({ encoding: 'utf-8' })
      );
    });

    it('should throw a descriptive error when branch does not exist', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('unknown revision');
      });

      expect(() => getPackageJsonFromBranch('nonexistent')).toThrow(
        "Failed to read 'package.json' from branch 'nonexistent'"
      );
    });
  });

  describe('branchExists', () => {
    it('should return true when branch exists', () => {
      mockExecSync.mockReturnValue('');
      expect(branchExists('main')).toBe(true);
    });

    it('should return false when branch does not exist', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('fatal: not a valid ref');
      });
      expect(branchExists('ghost-branch')).toBe(false);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return trimmed branch name', () => {
      mockExecSync.mockReturnValue('feature/my-feature\n');
      expect(getCurrentBranch()).toBe('feature/my-feature');
    });

    it('should throw when git command fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('not a git repo');
      });
      expect(() => getCurrentBranch()).toThrow(
        'Failed to determine current branch'
      );
    });
  });
});
