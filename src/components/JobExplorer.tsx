import { useEffect, useMemo, useRef, useState } from 'react';
import type { Application, JobListing } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useJobs } from '../hooks/useJobs';
import type { JobSource } from '../services/jobService';
import { calcSkillMatch } from '../utils/skillMatch';
import { isDuplicate, norm } from '../utils/application';

interface Props { skills: string[]; applications: Application[]; onSave: (job: JobListing, source: JobSource) => void }

const badge = (s: number) => (s >= 70 ? 'green' : s >= 40 ? 'yellow' : 'red');

export function JobExplorer({ skills, applications, onSave }: Props) {
  const [source, setSource] = useState<JobSource>('live');
  const { jobs, loading, error, retry } = useJobs(source);
  const [keyword, setKeyword] = useState('');
  const debounced = useDebounce(keyword, 400);
  const [category, setCategory] = useState('ALL');
  const [sortMatch, setSortMatch] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Bonus: tekan "/" untuk fokus ke kolom pencarian
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (e.key === '/' && !(el instanceof HTMLInputElement) && !(el instanceof HTMLSelectElement) && !(el instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const categories = useMemo(() => Array.from(new Set(jobs.map((j) => j.category))), [jobs]);

  const rows = useMemo(() => {
    const q = norm(debounced);
    const list = jobs
      .filter((j) => (category === 'ALL' || j.category === category) && (!q || norm(j.title).includes(q) || norm(j.company_name).includes(q)))
      .map((job) => ({ job, match: calcSkillMatch(job.tags, skills) }));
    return sortMatch ? [...list].sort((a, b) => b.match.score - a.match.score) : list;
  }, [jobs, debounced, category, sortMatch, skills]);

  return (
    <div>
      <div className="card">
        <b>Sumber Data Lowongan</b>
        <label className="radio"><input type="radio" checked={source === 'live'} onChange={() => setSource('live')} /> Remotive API (Live)</label>
        <label className="radio"><input type="radio" checked={source === 'local'} onChange={() => setSource('local')} /> Dataset Magang ID (Lokal)</label>
      </div>
      <div className="row filters">
        <input ref={searchRef} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Cari posisi atau perusahaan... (tekan /)" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="ALL">Semua Kategori</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sortMatch ? 'match' : 'default'} onChange={(e) => setSortMatch(e.target.value === 'match')}>
          <option value="match">Match Tertinggi</option>
          <option value="default">Urutan Asli</option>
        </select>
      </div>

      {loading && <div className="state">⏳ Memuat lowongan...</div>}
      {!loading && error && (
        <div className="state errbox">
          <p>❌ {error}</p>
          <button className="btn" onClick={retry}>Coba Lagi</button>{' '}
          <button className="btn primary" onClick={() => setSource('local')}>Pakai Fallback Lokal</button>
        </div>
      )}
      {!loading && !error && rows.length === 0 && <div className="state">Tidak ada lowongan yang cocok.</div>}

      <div className="grid">
        {!loading && rows.map(({ job, match }) => {
          const saved = isDuplicate(applications, job.company_name, job.title);
          return (
            <div className="card" key={job.id}>
              <div className="between">
                <div><b>{job.company_name}</b><br /><small>{job.candidate_required_location}</small></div>
                <span className={`pill ${badge(match.score)}`}>{match.score}% Match</span>
              </div>
              <h4>{job.title}</h4>
              <div className="tags">
                {match.matched.map((t) => <span key={t} className="tag ok">{t}</span>)}
                {match.missing.map((t) => <span key={t} className="tag miss">{t}</span>)}
              </div>
              <div className="between">
                <small>{job.salary || '-'}</small>
                <button className="btn primary" disabled={saved} onClick={() => onSave(job, source)}>
                  {saved ? 'Sudah Dilamar' : 'Simpan ke Wishlist'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
