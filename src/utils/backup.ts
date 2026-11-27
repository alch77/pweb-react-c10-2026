import type { Application, ApplicationStatus, WorkMode } from '../types';

// Key ini sama dengan yang dipakai useApplications & App (useLocalStorage).
export const APPLICATIONS_KEY = 'amm:applications';
export const SKILLS_KEY = 'amm:skills';

export interface BackupFile {
  app: 'aku-mw-magang';
  version: 1;
  exportedAt: string;
  applications: Application[];
  skills: string[];
}

export type ParseResult = { ok: true; data: BackupFile } | { ok: false; error: string };

const MODES: readonly string[] = ['Remote', 'Hybrid', 'Onsite'] satisfies WorkMode[];
const STATUSES: readonly string[] = ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED'] satisfies ApplicationStatus[];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isOptStr = (v: unknown): boolean => v === undefined || isStr(v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function isApplication(v: unknown): v is Application {
  if (!isRecord(v)) return false;
  const checklistOk = Array.isArray(v.checklist) &&
    v.checklist.every((c) => isRecord(c) && isStr(c.id) && isStr(c.text) && typeof c.done === 'boolean');
  const logsOk = Array.isArray(v.activityLogs) &&
    v.activityLogs.every((l) => isRecord(l) && isStr(l.id) && isStr(l.timestamp) && isStr(l.message));
  return (
    isStr(v.id) && isStr(v.company) && isStr(v.role) &&
    isStr(v.workMode) && MODES.includes(v.workMode) &&
    isStr(v.status) && STATUSES.includes(v.status) &&
    isStrArray(v.requiredSkills) &&
    isStr(v.lastUpdatedAt) && !Number.isNaN(Date.parse(v.lastUpdatedAt)) &&
    isOptStr(v.cvVersion) && isOptStr(v.appliedDate) && isOptStr(v.interviewDateTime) &&
    (v.salaryOffer === undefined || typeof v.salaryOffer === 'number') &&
    checklistOk && logsOk
  );
}

export function buildBackup(applications: Application[], skills: string[]): BackupFile {
  return { app: 'aku-mw-magang', version: 1, exportedAt: new Date().toISOString(), applications, skills };
}

export function backupFileName(now: Date = new Date()): string {
  return `aku-mw-magang-backup-${now.toISOString().slice(0, 10)}.json`;
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File bukan JSON yang valid.' };
  }
  if (!isRecord(raw) || raw.app !== 'aku-mw-magang') return { ok: false, error: 'Ini bukan file backup Aku Mw Magang.' };
  if (raw.version !== 1) return { ok: false, error: 'Versi backup tidak didukung.' };
  if (!Array.isArray(raw.applications) || !raw.applications.every(isApplication)) {
    return { ok: false, error: 'Data lamaran di file rusak atau formatnya salah.' };
  }
  if (!isStrArray(raw.skills)) return { ok: false, error: 'Data skill di file rusak.' };
  const ids = raw.applications.map((a) => a.id);
  if (new Set(ids).size !== ids.length) return { ok: false, error: 'Ada ID lamaran ganda di file.' };
  return {
    ok: true,
    data: {
      app: 'aku-mw-magang',
      version: 1,
      exportedAt: isStr(raw.exportedAt) ? raw.exportedAt : '',
      applications: raw.applications,
      skills: raw.skills,
    },
  };
}
