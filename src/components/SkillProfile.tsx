import { useState } from 'react';
import type { FormEvent } from 'react';
import { norm } from '../utils/application';

interface Props { skills: string[]; onChange: (next: string[]) => void }

export function SkillProfile({ skills, onChange }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = text.trim();
    if (!s) return setError('Skill tidak boleh kosong.');
    if (skills.some((x) => norm(x) === norm(s))) return setError('Skill sudah ada.');
    onChange([...skills, s]);
    setText('');
    setError('');
  };

  return (
    <div className="card">
      <h3>Profil Skill Kapten</h3>
      <form className="row" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tambah skill..." />
        <button className="btn primary">Tambah</button>
      </form>
      {error && <p className="err">{error}</p>}
      <div className="tags">
        {skills.map((s) => (
          <span className="tag" key={s}>
            {s} <button className="x" aria-label={`Hapus ${s}`} onClick={() => onChange(skills.filter((x) => x !== s))}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
