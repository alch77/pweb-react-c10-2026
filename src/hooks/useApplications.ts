import { useEffect, useRef, useState } from 'react';
import type { Application, ApplicationStatus, TransitionPayload } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { createApplication, isDuplicate, makeLog, uid } from '../utils/application';
import type { NewApplicationInput } from '../utils/application';
import { validateTransition } from '../utils/stateMachine';

const DAY = 86_400_000;
export interface PendingDelete { app: Application; index: number }
export type Store = ReturnType<typeof useApplications>;

export function useApplications() {
  const [applications, setApplications] = useLocalStorage<Application[]>('amm:applications', []);
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); }, []);

  const patch = (id: string, fn: (a: Application) => Application) =>
    setApplications((prev) => prev.map((a) => (a.id === id ? fn(a) : a)));

  const add = (input: NewApplicationInput): string | null => {
    if (isDuplicate(applications, input.company, input.role)) return 'Lamaran company + role ini sudah ada.';
    setApplications((prev) => [createApplication(input), ...prev]);
    return null;
  };

  const transition = (id: string, to: ApplicationStatus, p: TransitionPayload) =>
    patch(id, (a) => {
      if (validateTransition(a.status, to, p) !== null) return a;
      const detail = to === 'APPLIED' ? ` (CV: ${p.cvVersion?.trim()})` : to === 'INTERVIEW' ? ` (jadwal ${p.interviewDateTime})` : to === 'OFFER' ? ` (Rp ${p.salaryOffer})` : '';
      return {
        ...a,
        status: to,
        lastUpdatedAt: new Date().toISOString(),
        ...(to === 'APPLIED' ? { cvVersion: p.cvVersion?.trim(), appliedDate: p.appliedDate } : {}),
        ...(to === 'INTERVIEW' ? { interviewDateTime: p.interviewDateTime } : {}),
        ...(to === 'OFFER' ? { salaryOffer: p.salaryOffer, workMode: p.workMode ?? a.workMode } : {}),
        activityLogs: [...a.activityLogs, makeLog(`Pindah ${a.status} → ${to}${detail}`)],
      };
    });

  const toggleItem = (id: string, itemId: string) =>
    patch(id, (a) => ({ ...a, checklist: a.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) }));
  const addItem = (id: string, text: string) => {
    const t = text.trim();
    if (t) patch(id, (a) => ({ ...a, checklist: [...a.checklist, { id: uid(), text: t, done: false }] }));
  };
  const removeItem = (id: string, itemId: string) =>
    patch(id, (a) => ({ ...a, checklist: a.checklist.filter((c) => c.id !== itemId) }));
  const addNote = (id: string, text: string) => {
    const t = text.trim();
    if (t) patch(id, (a) => ({ ...a, activityLogs: [...a.activityLogs, makeLog(`Catatan: ${t}`)] }));
  };
  const simulate15 = (id: string) =>
    patch(id, (a) => ({
      ...a,
      lastUpdatedAt: new Date(Date.parse(a.lastUpdatedAt) - 15 * DAY).toISOString(),
      activityLogs: [...a.activityLogs, makeLog('Simulasi +15 hari')],
    }));

  const remove = (id: string) => {
    const index = applications.findIndex((a) => a.id === id);
    if (index < 0) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current); // bersihkan timer lama
    setPending({ app: applications[index], index });
    setApplications((prev) => prev.filter((a) => a.id !== id));
    timerRef.current = window.setTimeout(() => { setPending(null); timerRef.current = null; }, 5000);
  };

  const undo = () => {
    if (!pending) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const { app, index } = pending;
    setApplications((prev) => {
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, app);
      return next;
    });
    setPending(null);
  };

  return { applications, pending, add, transition, toggleItem, addItem, removeItem, addNote, simulate15, remove, undo };
}
