import type { ApplicationStatus, TransitionPayload } from '../types';

// SESUAIKAN dengan Diagram State Machine di soal jika berbeda.
export const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ['APPLIED'],
  APPLIED: ['SCREENING', 'REJECTED', 'GHOSTED'],
  SCREENING: ['INTERVIEW', 'REJECTED', 'GHOSTED'],
  INTERVIEW: ['OFFER', 'REJECTED', 'GHOSTED'],
  OFFER: [],
  REJECTED: [],
  GHOSTED: ['SCREENING'],
};

export function validateTransition(from: ApplicationStatus, to: ApplicationStatus, p: TransitionPayload): string | null {
  if (!TRANSITIONS[from].includes(to)) return `Transisi ${from} → ${to} tidak diizinkan.`;
  if (to === 'APPLIED' && (!p.cvVersion?.trim() || !p.appliedDate)) return 'Versi CV dan tanggal lamaran wajib diisi.';
  if (to === 'INTERVIEW' && !p.interviewDateTime) return 'Jadwal interview wajib diisi.';
  if (to === 'OFFER' && (!p.salaryOffer || p.salaryOffer <= 0 || !p.workMode)) return 'Gaji (> 0) dan mode kerja wajib diisi.';
  return null;
}
