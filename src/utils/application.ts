import type { ActivityLog, Application, WorkMode } from '../types';

export const norm = (s: string): string => s.trim().toLowerCase();
export const uid = (): string => crypto.randomUUID();
export const makeLog = (message: string): ActivityLog => ({ id: uid(), timestamp: new Date().toISOString(), message });
export const formatRupiah = (n: number): string => 'Rp ' + n.toLocaleString('id-ID');
export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export const splitSkills = (s: string): string[] => {
  const seen = new Set<string>();
  return s.split(',').map((x) => x.trim()).filter((x) => {
    const k = x.toLowerCase();
    if (!x || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const isDuplicate = (apps: Application[], company: string, role: string): boolean =>
  apps.some((a) => norm(a.company) === norm(company) && norm(a.role) === norm(role));

export function guessWorkMode(loc: string): WorkMode {
  if (/hybrid/i.test(loc)) return 'Hybrid';
  if (/on-?site/i.test(loc)) return 'Onsite';
  return 'Remote';
}

export interface NewApplicationInput {
  company: string;
  role: string;
  workMode: WorkMode;
  status: 'WISHLIST' | 'APPLIED';
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
  source?: string;
}

export function createApplication(i: NewApplicationInput): Application {
  return {
    id: uid(),
    company: i.company.trim(),
    role: i.role.trim(),
    workMode: i.workMode,
    status: i.status,
    requiredSkills: i.requiredSkills,
    cvVersion: i.status === 'APPLIED' ? i.cvVersion?.trim() : undefined,
    appliedDate: i.status === 'APPLIED' ? i.appliedDate : undefined,
    lastUpdatedAt: new Date().toISOString(),
    checklist: [],
    activityLogs: [makeLog(`Lamaran dibuat dengan status ${i.status}${i.source ? ` (${i.source})` : ''}`)],
  };
}

export const INTERVIEW_QUESTIONS: string[] = [
  'Ceritakan tentang dirimu dan kenapa tertarik magang di posisi ini.',
  'Apa perbedaan useState dan useRef di React?',
  'Jelaskan kapan useEffect dijalankan dan kenapa butuh cleanup.',
  'Ceritakan bug tersulit di proyekmu dan bagaimana kamu memperbaikinya.',
  'Apa itu REST API dan bagaimana cara menangani error saat fetch?',
  'Apa kelebihan TypeScript dibanding JavaScript biasa?',
];
