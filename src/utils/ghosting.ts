import type { Application } from '../types';

const DAY = 86_400_000;

export function isGhostingRisk(a: Application, now: number = Date.now()): boolean {
  return (a.status === 'APPLIED' || a.status === 'SCREENING') && now - Date.parse(a.lastUpdatedAt) > 14 * DAY;
}
