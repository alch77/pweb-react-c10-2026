import type { Application } from '../types';

const HOUR = 60 * 60 * 1000;

/** Cek dari SELURUH data (bukan data ter-filter). */
export function findConflicts(apps: Application[]): [Application, Application][] {
  const list: { app: Application; t: number }[] = [];
  for (const app of apps) {
    if (app.status !== 'INTERVIEW' || !app.interviewDateTime) continue;
    const t = new Date(app.interviewDateTime).getTime();
    if (!Number.isNaN(t)) list.push({ app, t });
  }
  list.sort((x, y) => x.t - y.t);
  const res: [Application, Application][] = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (list[j].t - list[i].t < HOUR) res.push([list[i].app, list[j].app]);
      else break;
    }
  }
  return res;
}
