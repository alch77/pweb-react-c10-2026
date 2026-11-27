import type { Application } from '../types';
import { norm } from './application';

export type SkillCategory = 'Frontend' | 'Backend & Data' | 'DevOps & Tools' | 'Lainnya';

const FRONTEND = new Set([
  'react', 'typescript', 'javascript', 'css', 'html', 'tailwind', 'tailwindcss',
  'next.js', 'nextjs', 'vue', 'svelte', 'redux', 'figma', 'ui', 'ux', 'sass', 'vite', 'gsap',
]);
const BACKEND = new Set([
  'node.js', 'nodejs', 'node', 'express', 'python', 'django', 'flask', 'fastapi',
  'go', 'golang', 'java', 'spring', 'sql', 'postgresql', 'postgres', 'mysql', 'mongodb',
  'graphql', 'rest', 'api', 'php', 'laravel', 'prisma', 'redis',
]);
const DEVOPS = new Set([
  'docker', 'kubernetes', 'git', 'github', 'ci/cd', 'aws', 'gcp', 'azure',
  'linux', 'nginx', 'terraform', 'jest', 'vitest', 'playwright', 'cypress',
]);

export function categorizeSkill(skill: string): SkillCategory {
  const k = norm(skill);
  if (FRONTEND.has(k)) return 'Frontend';
  if (BACKEND.has(k)) return 'Backend & Data';
  if (DEVOPS.has(k)) return 'DevOps & Tools';
  return 'Lainnya';
}

export function groupSkillsByCategory(skills: string[]): { category: SkillCategory; items: string[] }[] {
  const order: SkillCategory[] = ['Frontend', 'Backend & Data', 'DevOps & Tools', 'Lainnya'];
  const map = new Map<SkillCategory, string[]>();
  for (const s of skills) {
    const cat = categorizeSkill(s);
    const list = map.get(cat) ?? [];
    list.push(s);
    map.set(cat, list);
  }
  return order
    .map((category) => ({ category, items: map.get(category) ?? [] }))
    .filter((g) => g.items.length > 0);
}

export function getTopMissingSkills(applications: Application[], mySkills: string[], limit = 6): { skill: string; count: number }[] {
  const owned = new Set(mySkills.map(norm));
  const counts = new Map<string, { skill: string; count: number }>();

  for (const app of applications) {
    for (const req of app.requiredSkills) {
      const k = norm(req);
      if (!k || owned.has(k)) continue;
      const cur = counts.get(k);
      if (cur) cur.count += 1;
      else counts.set(k, { skill: req.trim(), count: 1 });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getProfileReadiness(skills: string[], applications: Application[]): {
  label: string;
  score: number;
  note: string;
} {
  const skillPts = Math.min(skills.length, 6) * 10; // up to 60
  const catPts = Math.min(groupSkillsByCategory(skills).length, 3) * 10; // up to 30
  const hasCv = applications.some((a) => Boolean(a.cvVersion)) ? 10 : 0;
  const score = Math.min(100, skillPts + catPts + hasCv);

  if (score >= 80) return { label: 'Siap Tempur', score, note: 'Profil skill lengkap lintas kategori.' };
  if (score >= 50) return { label: 'Cukup Baik', score, note: 'Tambahkan skill pelengkap untuk menaikkan Match Score.' };
  return { label: 'Perlu Dilengkapi', score, note: 'Isi minimal 4–6 skill inti agar pemindaian lebih akurat.' };
}
