import { useMemo, useState } from 'react';
import type { Application, ApplicationStatus } from '../types';
import { calcSkillMatch } from '../utils/skillMatch';
import { isGhostingRisk } from '../utils/ghosting';
import { formatDateTime, formatRupiah, norm } from '../utils/application';

type Sort = 'newest' | 'interview' | 'offer';
interface Props {
  applications: Application[];
  skills: string[];
  onOpen: (id: string) => void;
  onSimulate: (id: string) => void;
  onDelete: (id: string) => void;
}
const STATUSES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'GHOSTED'];
const FAR = Number.MAX_SAFE_INTEGER;

export function Pipeline({ applications, skills, onOpen, onSimulate, onDelete }: Props) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [onlyGhost, setOnlyGhost] = useState(false);
  const [sort, setSort] = useState<Sort>('newest');

  const rows = useMemo(() => {
    const kw = norm(q);
    const list = applications.filter(
      (a) => (!kw || norm(a.company).includes(kw) || norm(a.role).includes(kw)) &&
        (status === 'ALL' || a.status === status) && (!onlyGhost || isGhostingRisk(a)),
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

  return (
    <div>
      <div className="row filters">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari company / role..." />
        <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus | 'ALL')}>
          <option value="ALL">Semua Status</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="newest">Terbaru</option>
          <option value="interview">Jadwal Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>
        <label className="radio"><input type="checkbox" checked={onlyGhost} onChange={(e) => setOnlyGhost(e.target.checked)} /> Hanya Rawan Ghosting</label>
      </div>

      {applications.length === 0 && <div className="state">Belum ada lamaran. Simpan lowongan atau catat lamaran manual.</div>}
      {applications.length > 0 && rows.length === 0 && <div className="state">Tidak ada lamaran yang cocok dengan filter.</div>}

      {rows.map((a) => {
        const done = a.checklist.filter((c) => c.done).length;
        const match = calcSkillMatch(a.requiredSkills, skills).score;
        return (
          <div className="card item" key={a.id}>
            <div onClick={() => onOpen(a.id)} className="grow">
              <b>{a.company}</b> — {a.role} <span className={`pill st-${a.status}`}>{a.status}</span>
              {isGhostingRisk(a) && <span className="pill red">Rawan Ghosting</span>}
              <br />
              <small>
                {a.workMode} • CV: {a.cvVersion ?? '-'} • Checklist {done}/{a.checklist.length} • Match {match}%
                {a.interviewDateTime && ` • Interview ${formatDateTime(a.interviewDateTime)}`}
                {a.salaryOffer ? ` • Offer ${formatRupiah(a.salaryOffer)}` : ''}
              </small>
            </div>
            <div className="row">
              <button className="btn" onClick={() => onOpen(a.id)}>Detail</button>
              {(a.status === 'APPLIED' || a.status === 'SCREENING') && <button className="btn" onClick={() => onSimulate(a.id)}>Simulasi +15 Hari</button>}
              <button className="btn danger" onClick={() => onDelete(a.id)}>Hapus</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
