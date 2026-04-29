import * as fs from 'fs';
import * as path from 'path';
import {
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
  generateSnapshotId,
  getSnapshotPath,
  Snapshot,
} from '../snapshotManager';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

const sampleSnapshot: Snapshot = {
  id: 'main_1700000000000',
  branch: 'main',
  timestamp: '2024-01-01T00:00:00.000Z',
  dependencies: { react: '18.0.0', lodash: '4.17.21' },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.existsSync.mockReturnValue(true);
  mockFs.mkdirSync.mockImplementation(() => undefined);
  mockFs.writeFileSync.mockImplementation(() => undefined);
});

describe('generateSnapshotId', () => {
  it('should include branch name in id', () => {
    const id = generateSnapshotId('feature/my-branch');
    expect(id).toContain('feature_my-branch');
  });

  it('should include a numeric timestamp', () => {
    const id = generateSnapshotId('main');
    const parts = id.split('_');
    expect(Number(parts[parts.length - 1])).toBeGreaterThan(0);
  });
});

describe('saveSnapshot', () => {
  it('should write snapshot file and update index', () => {
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ snapshots: [] }));
    saveSnapshot(sampleSnapshot);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      getSnapshotPath(sampleSnapshot.id),
      expect.stringContaining('main'),
      'utf-8'
    );
  });
});

describe('loadSnapshot', () => {
  it('should return snapshot when file exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(sampleSnapshot));
    const result = loadSnapshot(sampleSnapshot.id);
    expect(result).toEqual(sampleSnapshot);
  });

  it('should return null when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    const result = loadSnapshot('nonexistent');
    expect(result).toBeNull();
  });

  it('should return null on parse error', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('invalid json{');
    const result = loadSnapshot('bad_id');
    expect(result).toBeNull();
  });
});

describe('listSnapshots', () => {
  it('should return empty array when index missing', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(listSnapshots()).toEqual([]);
  });

  it('should return snapshot entries from index', () => {
    const index = { snapshots: [{ id: 'main_1', branch: 'main', timestamp: '2024-01-01' }] };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(index));
    const result = listSnapshots();
    expect(result).toHaveLength(1);
    expect(result[0].branch).toBe('main');
  });
});

describe('deleteSnapshot', () => {
  it('should return false if snapshot does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(deleteSnapshot('ghost')).toBe(false);
  });

  it('should unlink file and update index when snapshot exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ snapshots: [{ id: 'main_1', branch: 'main', timestamp: '' }] }));
    const result = deleteSnapshot('main_1');
    expect(result).toBe(true);
    expect(mockFs.unlinkSync).toHaveBeenCalled();
  });
});
