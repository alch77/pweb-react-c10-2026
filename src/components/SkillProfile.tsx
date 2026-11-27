import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Application } from '../types';
import { norm } from '../utils/application';
import { getProfileReadiness, getTopMissingSkills, groupSkillsByCategory } from '../utils/skills';
import { ScrollRevealTitle } from './ScrollRevealTitle';

interface Props {
  skills: string[];
  applications: Application[];
  onChange: (next: string[]) => void;
}

export function SkillProfile({ skills, applications, onChange }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const groups = useMemo(() => groupSkillsByCategory(skills), [skills]);
  const missing = useMemo(() => getTopMissingSkills(applications, skills, 6), [applications, skills]);
  const readiness = useMemo(() => getProfileReadiness(skills, applications), [skills, applications]);

  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s) return setError('Skill tidak boleh kosong.');
    if (skills.some((x) => norm(x) === norm(s))) return setError('Skill sudah ada.');
    onChange([...skills, s]);
    setText('');
    setError('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    addSkill(text);
  };

  return (
    <aside className="panel" aria-label="Profil skill Captain">
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <ScrollRevealTitle as="h3" text="Captain Skill Profile" />
        <span className="badge signal mono">{skills.length} skill</span>
      </div>

      <div className="readiness-row">
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{readiness.label}</div>
          <small>{readiness.note}</small>
        </div>
        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-sage)' }}>
          {readiness.score}%
        </span>
      </div>

      <form className="row" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tambah skill (mis. Docker)..."
          aria-label="Tambah skill baru"
        />
        <button className="btn primary sm" type="submit">
          <Plus size={14} /> Tambah
        </button>
      </form>
      {error && <p className="err">{error}</p>}

      {groups.length === 0 ? (
        <small style={{ display: 'block', marginTop: 14 }}>
          Belum ada skill. Tambahkan skill utama agar Match Score lowongan terhitung akurat.
        </small>
      ) : (
        <div className="skill-cat-list">
          {groups.map((g) => (
            <div key={g.category}>
              <div className="skill-cat-title">{g.category}</div>
              <div className="tags">
                {g.items.map((s) => (
                  <span className="tag ok" key={s}>
                    {s}
                    <button
                      type="button"
                      className="x"
                      aria-label={`Hapus ${s}`}
                      onClick={() => onChange(skills.filter((x) => x !== s))}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {missing.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-hairline)' }}>
          <div className="skill-cat-title">Sering Dibutuhkan di Lamaranmu</div>
          <div className="tags">
            {missing.map(({ skill, count }) => (
              <button
                type="button"
                key={skill}
                className="tag miss"
                style={{ cursor: 'pointer' }}
                onClick={() => addSkill(skill)}
                title="Klik untuk menambahkan ke profil skill"
              >
                + {skill} <span className="mono">({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
