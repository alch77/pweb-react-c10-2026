import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Plus, RefreshCw, Search, Target } from 'lucide-react';
import type { Application, JobListing } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useJobs } from '../hooks/useJobs';
import type { JobSource } from '../services/jobService';
import { calcSkillMatch } from '../utils/skillMatch';
import { guessWorkMode, isDuplicate, norm } from '../utils/application';
import { ScrollRevealTitle } from './ScrollRevealTitle';
import { MotionCard } from './MotionCard';

interface Props { skills: string[]; applications: Application[]; onSave: (job: JobListing, source: JobSource) => void }

const badgeTone = (s: number) => (s >= 70 ? 'green' : s >= 40 ? 'yellow' : 'red');

export function JobExplorer({ skills, applications, onSave }: Props) {
  const [source, setSource] = useState<JobSource>('live');
  const { jobs, loading, error, retry } = useJobs(source);
  const [keyword, setKeyword] = useState('');
  const debounced = useDebounce(keyword, 400);
  const [category, setCategory] = useState('ALL');
  const [sortMatch, setSortMatch] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Tekan "/" untuk fokus ke kolom pencarian
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

  useEffect(() => {
    if (!loading) ScrollTrigger.refresh();
  }, [loading, rows.length]);

  return (
    <div>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Sumber data lowongan">
          <button type="button" className={source === 'live' ? 'on' : ''} onClick={() => setSource('live')}>
            Remotive Live
          </button>
          <button type="button" className={source === 'local' ? 'on' : ''} onClick={() => setSource('local')}>
            Dataset Lokal
          </button>
        </div>

        <div className="search-wrap">
          <Search size={15} />
          <input
            ref={searchRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari posisi atau perusahaan... (tekan /)"
            aria-label="Cari posisi atau perusahaan"
          />
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter kategori">
          <option value="ALL">Semua Kategori</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select value={sortMatch ? 'match' : 'default'} onChange={(e) => setSortMatch(e.target.value === 'match')} aria-label="Urutkan lowongan">
          <option value="match">Match Tertinggi</option>
          <option value="default">Urutan Asli</option>
        </select>
      </div>

      {!loading && !error && (
        <div style={{ marginBottom: 14 }}>
          <small>
            Menampilkan <span className="mono">{rows.length}</span> lowongan dari {source === 'live' ? 'Remotive API' : 'Dataset Magang ID'}.
          </small>
        </div>
      )}

      {loading && (
        <div className="grid" aria-busy="true" aria-label="Memuat daftar lowongan">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <div className="between">
                <div className="skeleton-line" style={{ width: 96 }} />
                <div className="skeleton-line" style={{ width: 78 }} />
              </div>
              <div className="skeleton-line" style={{ width: '80%', height: 18 }} />
              <div className="skeleton-line" style={{ width: '55%' }} />
              <div className="skeleton-line" style={{ width: '100%', height: 6, marginTop: 6 }} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="state errbox">
          <p style={{ marginBottom: 14 }}>{error}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn" onClick={retry}>
              <RefreshCw size={14} /> Coba Lagi
            </button>
            <button type="button" className="btn primary" onClick={() => setSource('local')}>
              Pakai Dataset Lokal
            </button>
          </div>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="state">
          <p>Tidak ada lowongan yang cocok dengan filter saat ini. Coba kata kunci lain atau pilih Semua Kategori.</p>
        </div>
      )}

      <div className="grid">
        {!loading && rows.map(({ job, match }, idx) => {
          const saved = isDuplicate(applications, job.company_name, job.title);
          const mode = guessWorkMode(job.candidate_required_location);
          const tone = badgeTone(match.score);
          const totalSkills = match.matched.length + match.missing.length;
          return (
            <MotionCard key={job.id} index={idx}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {job.company_name}
                  </div>
                  <small>{mode} · {job.candidate_required_location}</small>
                </div>
                <span className={`badge ${tone} mono`}>
                  <Target size={11} />
                  {match.score}%
                </span>
              </div>

              <ScrollRevealTitle as="h4" text={job.title} />

              <div className="tags">
                {match.matched.map((t) => <span key={t} className="tag ok">{t}</span>)}
                {match.missing.map((t) => <span key={t} className="tag miss">{t}</span>)}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                <div className="bar">
                  <div className={`bar-fill ${tone}`} style={{ width: `${match.score}%` }} />
                </div>
                <div className="between" style={{ marginTop: 10 }}>
                  <small>
                    <span className="mono">{match.matched.length}/{totalSkills}</span> cocok · {job.salary || 'Gaji tidak dicantumkan'}
                  </small>
                  <button
                    type="button"
                    className={saved ? 'btn sm' : 'btn accent sm'}
                    disabled={saved}
                    onClick={() => onSave(job, source)}
                  >
                    {saved ? <><Check size={13} /> Sudah Dilamar</> : <><Plus size={13} /> Simpan ke Wishlist</>}
                  </button>
                </div>
              </div>
            </MotionCard>
          );
        })}
      </div>
    </div>
  );
}
