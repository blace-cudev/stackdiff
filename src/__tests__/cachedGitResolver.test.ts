import { getCachedPackageJson, validateBranches } from '../cachedGitResolver';
import * as gitResolver from '../gitResolver';
import * as cacheManager from '../cacheManager';

jest.mock('../gitResolver');
jest.mock('../cacheManager');

const mockGetPackageJson = gitResolver.getPackageJsonFromBranch as jest.Mock;
const mockBranchExists = gitResolver.branchExists as jest.Mock;
const mockReadCache = cacheManager.readCache as jest.Mock;
const mockWriteCache = cacheManager.writeCache as jest.Mock;
const mockGetCacheKey = cacheManager.getCacheKey as jest.Mock;

describe('cachedGitResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCacheKey.mockReturnValue('mock-cache-key');
  });

  describe('getCachedPackageJson', () => {
    it('returns cached data without calling git when cache hit', async () => {
      const cachedContent = '{"name":"app","version":"1.0.0"}';
      mockReadCache.mockReturnValue(cachedContent);

      const result = await getCachedPackageJson('main');

      expect(result.content).toBe(cachedContent);
      expect(result.cached).toBe(true);
      expect(mockGetPackageJson).not.toHaveBeenCalled();
    });

    it('fetches from git and writes cache on cache miss', async () => {
      const gitContent = '{"name":"app","version":"2.0.0"}';
      mockReadCache.mockReturnValue(null);
      mockGetPackageJson.mockResolvedValue(gitContent);

      const result = await getCachedPackageJson('feature-branch');

      expect(result.content).toBe(gitContent);
      expect(result.cached).toBe(false);
      expect(mockGetPackageJson).toHaveBeenCalledWith('feature-branch', 'package.json');
      expect(mockWriteCache).toHaveBeenCalledWith('mock-cache-key', gitContent);
    });

    it('propagates errors from git resolver', async () => {
      mockReadCache.mockReturnValue(null);
      mockGetPackageJson.mockRejectedValue(new Error('branch not found'));

      await expect(getCachedPackageJson('nonexistent')).rejects.toThrow('branch not found');
    });
  });

  describe('validateBranches', () => {
    it('returns existence status for both branches', async () => {
      mockBranchExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const result = await validateBranches('main', 'missing-branch');

      expect(result.base).toBe(true);
      expect(result.target).toBe(false);
    });
  });
});
