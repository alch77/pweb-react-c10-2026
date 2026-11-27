import { useEffect, useMemo, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Eye, Kanban, List, RadioTower, Search, Trash2 } from 'lucide-react';
import type { Application, ApplicationStatus } from '../types';
import { calcSkillMatch } from '../utils/skillMatch';
import { isGhostingRisk } from '../utils/ghosting';
import { formatDateTime, formatRupiah, norm } from '../utils/application';
import { ScrollRevealTitle } from './ScrollRevealTitle';
import { MotionCard } from './MotionCard';

type Sort = 'newest' | 'interview' | 'offer';
type ViewMode = 'kanban' | 'list';

interface Props {
  applications: Application[];
  skills: string[];
  initialStatus?: ApplicationStatus | 'ALL';
  onOpen: (id: string) => void;
  onSimulate: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_META: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'WISHLIST', label: 'Wishlist', color: '#64748b' },
  { status: 'APPLIED', label: 'Applied', color: '#60a5fa' },
  { status: 'SCREENING', label: 'Screening', color: '#a78bfa' },
  { status: 'INTERVIEW', label: 'Interview', color: '#38bdf8' },
  { status: 'OFFER', label: 'Offer', color: '#22c55e' },
  { status: 'GHOSTED', label: 'Ghosted', color: '#fb923c' },
  { status: 'REJECTED', label: 'Rejected', color: '#f87171' },
];
const FAR = Number.MAX_SAFE_INTEGER;

export function Pipeline({ applications, skills, initialStatus = 'ALL', onOpen, onSimulate, onDelete }: Props) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>(initialStatus);
  const [onlyGhost, setOnlyGhost] = useState(false);
  const [sort, setSort] = useState<Sort>('newest');
  const [view, setView] = useState<ViewMode>('kanban');

  const [prevInitial, setPrevInitial] = useState(initialStatus);
  if (initialStatus !== prevInitial) {
    setPrevInitial(initialStatus);
    setStatus(initialStatus);
  }

  const rows = useMemo(() => {
    const kw = norm(q);
    const list = applications.filter(
      (a) =>
        (!kw || norm(a.company).includes(kw) || norm(a.role).includes(kw)) &&
        (status === 'ALL' || a.status === status) &&
        (!onlyGhost || isGhostingRisk(a)),
    );
    return [...list].sort((a, b) => {
      if (sort === 'newest') return Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt);
      if (sort === 'interview') {
        const ta = a.interviewDateTime ? Date.parse(a.interviewDateTime) : FAR;
        const tb = b.interviewDateTime ? Date.parse(b.interviewDateTime) : FAR;
        return ta - tb;
      }
      return (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0);
    });
  }, [applications, q, status, onlyGhost, sort]);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [rows.length, view]);

  const visibleCols = status === 'ALL' ? STATUS_META : STATUS_META.filter((m) => m.status === status);

  return (
    <div>
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari perusahaan atau posisi..."
            aria-label="Cari perusahaan atau posisi"
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | 'ALL')} aria-label="Filter status">
          <option value="ALL">Semua Status</option>
          {STATUS_META.map((m) => <option key={m.status} value={m.status}>{m.label}</option>)}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Urutkan lamaran">
          <option value="newest">Terbaru</option>
          <option value="interview">Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>

        <label className="check-toggle">
          <input type="checkbox" checked={onlyGhost} onChange={(e) => setOnlyGhost(e.target.checked)} />
          <RadioTower size={14} color="#fb923c" /> Rawan Ghosting
        </label>

        <div className="segmented" role="group" aria-label="Mode tampilan">
          <button type="button" className={view === 'kanban' ? 'on' : ''} onClick={() => setView('kanban')}>
            <Kanban size={14} /> Kanban
          </button>
          <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>
            <List size={14} /> List
          </button>
        </div>
      </div>

      {applications.length === 0 && (
        <div className="state">
          <p>Belum ada lamaran. Simpan lowongan dari Job Explorer atau klik Register Mission untuk mencatat lamaran manual.</p>
        </div>
      )}
      {applications.length > 0 && rows.length === 0 && (
        <div className="state">
          <p>Tidak ada lamaran yang cocok dengan filter saat ini.</p>
        </div>
      )}

      {rows.length > 0 && view === 'kanban' && (
        <div className="kanban-board">
          {visibleCols.map((col) => {
            const colItems = rows.filter((a) => a.status === col.status);
            return (
              <section className="kanban-col" key={col.status} aria-label={`Kolom ${col.label}`}>
                <div className="kanban-col-head">
                  <span className="kanban-col-title">
                    <span className="stage-dot" style={{ background: col.color }} />
                    {col.label}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {colItems.length}
                  </span>
                </div>

                {colItems.length === 0 ? (
                  <div className="kanban-col-empty">Kosong</div>
                ) : (
                  colItems.map((a, idx) => {
                    const done = a.checklist.filter((c) => c.done).length;
                    const total = a.checklist.length;
                    const match = calcSkillMatch(a.requiredSkills, skills).score;
                    const ghost = isGhostingRisk(a);
                    return (
                      <MotionCard className={`kanban-card ${ghost ? 'ghost-alert' : ''}`} key={a.id} index={idx}>
                        <div onClick={() => onOpen(a.id)} style={{ cursor: 'pointer' }}>
                          <div className="between" style={{ alignItems: 'flex-start' }}>
                            <ScrollRevealTitle as="b" text={a.company} />
                            <small>{a.workMode}</small>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>
                            {a.role}
                          </div>
                          {ghost && (
                            <div style={{ marginTop: 8 }}>
                              <span className="badge st-GHOSTED">
                                <RadioTower size={11} /> Rawan Ghosting
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="between">
                          <small>Checklist <span className="mono">{done}/{total}</span></small>
                          <small>Match <span className="mono">{match}%</span></small>
                        </div>

                        {(a.interviewDateTime || a.salaryOffer) && (
                          <small className="mono" style={{ display: 'block', color: 'var(--accent-signal)' }}>
                            {a.interviewDateTime && `Interview ${formatDateTime(a.interviewDateTime)}`}
                            {a.interviewDateTime && a.salaryOffer ? ' · ' : ''}
                            {a.salaryOffer ? formatRupiah(a.salaryOffer) : ''}
                          </small>
                        )}

                        <div className="row" style={{ marginTop: 2 }}>
                          <button type="button" className="btn sm" onClick={() => onOpen(a.id)}>
                            <Eye size={13} /> Detail
                          </button>
                          {(a.status === 'APPLIED' || a.status === 'SCREENING') && (
                            <button type="button" className="btn ghost sm" onClick={() => onSimulate(a.id)}>
                              Simulasi +15 Hari
                            </button>
                          )}
                          <button type="button" className="btn danger sm" aria-label={`Hapus ${a.company}`} onClick={() => onDelete(a.id)} style={{ marginLeft: 'auto' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </MotionCard>
                    );
                  })
                )}
              </section>
            );
          })}
        </div>
      )}

      {rows.length > 0 && view === 'list' &&
        rows.map((a, idx) => {
          const done = a.checklist.filter((c) => c.done).length;
          const match = calcSkillMatch(a.requiredSkills, skills).score;
          const ghost = isGhostingRisk(a);
          return (
            <MotionCard className={`item ${ghost ? 'ghost-alert' : ''}`} key={a.id} index={idx}>
              <div onClick={() => onOpen(a.id)} className="grow">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <ScrollRevealTitle as="b" text={a.company} />
                  <span style={{ color: 'var(--text-muted)' }}>—</span>
                  <ScrollRevealTitle as="span" text={a.role} />
                  <span className={`badge st-${a.status}`}>{a.status}</span>
                  {ghost && (
                    <span className="badge st-GHOSTED">
                      <RadioTower size={11} /> Rawan Ghosting
                    </span>
                  )}
                </div>
                <small style={{ display: 'block', marginTop: 6 }}>
                  {a.workMode} · CV: {a.cvVersion ?? '-'} · Checklist <span className="mono">{done}/{a.checklist.length}</span> · Match <span className="mono">{match}%</span>
                  {a.interviewDateTime && <> · Interview <span className="mono">{formatDateTime(a.interviewDateTime)}</span></>}
                  {a.salaryOffer ? <> · Offer <span className="mono">{formatRupiah(a.salaryOffer)}</span></> : ''}
                </small>
              </div>
              <div className="row" style={{ marginTop: 0 }}>
                <button type="button" className="btn sm" onClick={() => onOpen(a.id)}>
                  <Eye size={13} /> Detail
                </button>
                {(a.status === 'APPLIED' || a.status === 'SCREENING') && (
                  <button type="button" className="btn ghost sm" onClick={() => onSimulate(a.id)}>
                    Simulasi +15 Hari
                  </button>
                )}
                <button type="button" className="btn danger sm" onClick={() => onDelete(a.id)}>
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </MotionCard>
          );
        })}
    </div>
  );
}
