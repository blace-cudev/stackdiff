import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getAuditLogPath,
  readAuditLog,
  writeAuditEntry,
  buildAuditEntry,
  clearAuditLog,
  AuditEntry,
} from '../auditLogger';

describe('auditLogger', () => {
  let tmpDir: string;
  let logPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdiff-audit-'));
    logPath = path.join(tmpDir, 'audit.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getAuditLogPath', () => {
    it('returns custom path when provided', () => {
      expect(getAuditLogPath('/custom/path.json')).toBe('/custom/path.json');
    });

    it('returns default path under home directory', () => {
      const result = getAuditLogPath();
      expect(result).toContain('.stackdiff');
      expect(result).toContain('audit.json');
    });
  });

  describe('readAuditLog', () => {
    it('returns empty log when file does not exist', () => {
      const log = readAuditLog(logPath);
      expect(log.entries).toEqual([]);
      expect(log.version).toBe('1');
    });

    it('returns empty log on malformed JSON', () => {
      fs.writeFileSync(logPath, 'not-json', 'utf-8');
      const log = readAuditLog(logPath);
      expect(log.entries).toEqual([]);
    });

    it('reads existing log correctly', () => {
      const data = { version: '1', entries: [{ timestamp: '2024-01-01T00:00:00.000Z' }] };
      fs.writeFileSync(logPath, JSON.stringify(data), 'utf-8');
      const log = readAuditLog(logPath);
      expect(log.entries).toHaveLength(1);
    });
  });

  describe('buildAuditEntry', () => {
    it('builds a valid audit entry', () => {
      const entry = buildAuditEntry('diff', 'main', 'feature/x', 5, 2, 0, 123);
      expect(entry.command).toBe('diff');
      expect(entry.baseBranch).toBe('main');
      expect(entry.compareBranch).toBe('feature/x');
      expect(entry.totalChanges).toBe(5);
      expect(entry.breakingChanges).toBe(2);
      expect(entry.exitCode).toBe(0);
      expect(entry.durationMs).toBe(123);
      expect(entry.timestamp).toBeDefined();
    });
  });

  describe('writeAuditEntry', () => {
    it('writes an entry and persists it', () => {
      const entry = buildAuditEntry('diff', 'main', 'dev', 3, 1, 0, 200);
      writeAuditEntry(entry, logPath);
      const log = readAuditLog(logPath);
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].baseBranch).toBe('main');
    });

    it('appends multiple entries', () => {
      const e1 = buildAuditEntry('diff', 'main', 'dev', 1, 0, 0, 100);
      const e2 = buildAuditEntry('diff', 'main', 'feat', 2, 1, 1, 150);
      writeAuditEntry(e1, logPath);
      writeAuditEntry(e2, logPath);
      const log = readAuditLog(logPath);
      expect(log.entries).toHaveLength(2);
    });
  });

  describe('clearAuditLog', () => {
    it('clears all entries', () => {
      const entry = buildAuditEntry('diff', 'main', 'dev', 3, 1, 0, 200);
      writeAuditEntry(entry, logPath);
      clearAuditLog(logPath);
      const log = readAuditLog(logPath);
      expect(log.entries).toHaveLength(0);
    });
  });
});
