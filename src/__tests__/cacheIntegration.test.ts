import { getCachedPackageJson } from '../cachedGitResolver';
import { clearCache, getCacheStats } from '../cacheManager';
import * as gitResolver from '../gitResolver';

jest.mock('../gitResolver');

const mockGetPackageJson = gitResolver.getPackageJsonFromBranch as jest.Mock;
const mockBranchExists = gitResolver.branchExists as jest.Mock;

describe('cache integration', () => {
  beforeEach(() => {
    clearCache();
    jest.clearAllMocks();
    mockBranchExists.mockResolvedValue(true);
  });

  afterAll(() => {
    clearCache();
  });

  it('caches result after first fetch and avoids second git call', async () => {
    const content = JSON.stringify({ name: 'myapp', version: '1.2.3' });
    mockGetPackageJson.mockResolvedValue(content);

    const first = await getCachedPackageJson('main');
    expect(first.cached).toBe(false);
    expect(mockGetPackageJson).toHaveBeenCalledTimes(1);

    const second = await getCachedPackageJson('main');
    expect(second.cached).toBe(true);
    expect(mockGetPackageJson).toHaveBeenCalledTimes(1);

    expect(first.content).toBe(second.content);
  });

  it('stores separate cache entries per branch', async () => {
    const mainContent = JSON.stringify({ name: 'app', version: '1.0.0' });
    const devContent = JSON.stringify({ name: 'app', version: '2.0.0-beta' });

    mockGetPackageJson
      .mockResolvedValueOnce(mainContent)
      .mockResolvedValueOnce(devContent);

    await getCachedPackageJson('main');
    await getCachedPackageJson('develop');

    const stats = getCacheStats();
    expect(stats.count).toBe(2);
  });

  it('clears cache correctly between runs', async () => {
    mockGetPackageJson.mockResolvedValue('{"name":"app"}');
    await getCachedPackageJson('main');
    expect(getCacheStats().count).toBe(1);

    clearCache();
    expect(getCacheStats().count).toBe(0);
  });
});
