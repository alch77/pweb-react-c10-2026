export interface SkillMatch { score: number; matched: string[]; missing: string[] }

export function calcSkillMatch(required: string[], mine: string[]): SkillMatch {
  const set = new Set(mine.map((s) => s.trim().toLowerCase()));
  const matched = required.filter((s) => set.has(s.trim().toLowerCase()));
  const missing = required.filter((s) => !set.has(s.trim().toLowerCase()));
  const score = required.length === 0 ? 0 : Math.round((matched.length / required.length) * 100);
  return { score, matched, missing };
}
