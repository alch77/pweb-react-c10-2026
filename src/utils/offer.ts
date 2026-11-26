import type { Application, WorkMode } from '../types';
import { calcSkillMatch } from './skillMatch';
import type { SkillMatch } from './skillMatch';

export const MODE_SCORE: Record<WorkMode, number> = { Remote: 100, Hybrid: 75, Onsite: 50 };

export interface OfferScore { salary: number; mode: number; skill: number; total: number; match: SkillMatch }

function scoreOne(app: Application, maxSalary: number, mine: string[]): OfferScore {
  const match = calcSkillMatch(app.requiredSkills, mine);
  const salary = ((app.salaryOffer ?? 0) / maxSalary) * 100 * 0.5; // normalisasi terhadap gaji tertinggi
  const mode = MODE_SCORE[app.workMode] * 0.25;
  const skill = match.score * 0.25;
  return { salary, mode, skill, total: salary + mode + skill, match };
}

export function scoreOffers(a: Application, b: Application, mine: string[]): [OfferScore, OfferScore] {
  const max = Math.max(a.salaryOffer ?? 0, b.salaryOffer ?? 0) || 1;
  return [scoreOne(a, max, mine), scoreOne(b, max, mine)];
}
