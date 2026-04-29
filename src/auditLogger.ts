import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
  timestamp: string;
  command: string;
  baseBranch: string;
  compareBranch: string;
  totalChanges: number;
  breakingChanges: number;
  exitCode: number;
  durationMs: number;
}

export interface AuditLog {
  version: string;
  entries: AuditEntry[];
}

const AUDIT_LOG_VERSION = '1';

export function getAuditLogPath(customPath?: string): string {
  if (customPath) return customPath;
  return path.join(os.homedir(), '.stackdiff', 'audit.json');
}

export function ensureAuditLogDir(logPath: string): void {
  const dir = path.dirname(logPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readAuditLog(logPath: string): AuditLog {
  ensureAuditLogDir(logPath);
  if (!fs.existsSync(logPath)) {
    return { version: AUDIT_LOG_VERSION, entries: [] };
  }
  try {
    const raw = fs.readFileSync(logPath, 'utf-8');
    return JSON.parse(raw) as AuditLog;
  } catch {
    return { version: AUDIT_LOG_VERSION, entries: [] };
  }
}

export function writeAuditEntry(entry: AuditEntry, logPath?: string): void {
  const resolvedPath = getAuditLogPath(logPath);
  ensureAuditLogDir(resolvedPath);
  const log = readAuditLog(resolvedPath);
  log.entries.push(entry);
  fs.writeFileSync(resolvedPath, JSON.stringify(log, null, 2), 'utf-8');
}

export function buildAuditEntry(
  command: string,
  baseBranch: string,
  compareBranch: string,
  totalChanges: number,
  breakingChanges: number,
  exitCode: number,
  durationMs: number
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    command,
    baseBranch,
    compareBranch,
    totalChanges,
    breakingChanges,
    exitCode,
    durationMs,
  };
}

export function clearAuditLog(logPath?: string): void {
  const resolvedPath = getAuditLogPath(logPath);
  const empty: AuditLog = { version: AUDIT_LOG_VERSION, entries: [] };
  ensureAuditLogDir(resolvedPath);
  fs.writeFileSync(resolvedPath, JSON.stringify(empty, null, 2), 'utf-8');
}
