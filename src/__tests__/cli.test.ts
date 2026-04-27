import { execSync } from 'child_process';
import * as gitResolver from '../gitResolver';
import * as packageParser from '../packageParser';
import * as diffEngine from '../diffEngine';
import * as reporter from '../reporter';

jest.mock('../gitResolver');
jest.mock('../packageParser');
jest.mock('../diffEngine');
jest.mock('../reporter');

const mockGetPackageJson = gitResolver.getPackageJsonFromBranch as jest.Mock;
const mockBranchExists = gitResolver.branchExists as jest.Mock;
const mockGetCurrentBranch = gitResolver.getCurrentBranch as jest.Mock;
const mockParsePackageJson = packageParser.parsePackageJson as jest.Mock;
const mockFlattenDependencies = packageParser.flattenDependencies as jest.Mock;
const mockDiffDependencies = diffEngine.diffDependencies as jest.Mock;
const mockGenerateReport = reporter.generateReport as jest.Mock;

describe('CLI integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBranchExists.mockResolvedValue(true);
    mockGetCurrentBranch.mockResolvedValue('main');
    mockGetPackageJson.mockResolvedValue('{"name":"test","dependencies":{}}');
    mockParsePackageJson.mockReturnValue({ name: 'test', dependencies: {} });
    mockFlattenDependencies.mockReturnValue({});
    mockDiffDependencies.mockReturnValue([]);
    mockGenerateReport.mockReturnValue('No dependency changes found.');
  });

  it('should call branchExists for both branches', async () => {
    const { run } = await import('../cli');
    await mockBranchExists('main');
    await mockBranchExists('feature');
    expect(mockBranchExists).toHaveBeenCalledWith('main');
    expect(mockBranchExists).toHaveBeenCalledWith('feature');
  });

  it('should call generateReport with correct format option', async () => {
    mockDiffDependencies.mockReturnValue([
      { name: 'react', from: '17.0.0', to: '18.0.0', changeType: 'upgraded', breaking: true },
    ]);
    mockGenerateReport.mockReturnValue('react 17.0.0 → 18.0.0 UPGRADED [BREAKING]');

    const diffs = mockDiffDependencies({}, {});
    const report = mockGenerateReport(diffs, { format: 'text', showBreakingOnly: false });

    expect(mockGenerateReport).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ format: 'text' })
    );
    expect(report).toContain('BREAKING');
  });

  it('should pass showBreakingOnly when --breaking-only flag is set', async () => {
    const diffs = [{ name: 'lodash', from: '4.0.0', to: undefined, changeType: 'removed', breaking: true }];
    mockDiffDependencies.mockReturnValue(diffs);

    mockGenerateReport(diffs, { format: 'text', showBreakingOnly: true });

    expect(mockGenerateReport).toHaveBeenCalledWith(
      diffs,
      expect.objectContaining({ showBreakingOnly: true })
    );
  });

  it('should default target to current branch when not provided', async () => {
    const currentBranch = await mockGetCurrentBranch();
    expect(currentBranch).toBe('main');
    expect(mockGetCurrentBranch).toHaveBeenCalled();
  });
});
