import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Application, ApplicationStatus, TransitionPayload, WorkMode } from '../types';
import type { Store } from '../hooks/useApplications';
import { TRANSITIONS, validateTransition } from '../utils/stateMachine';
import { calcSkillMatch } from '../utils/skillMatch';
import { formatDateTime } from '../utils/application';
import { InterviewTimer } from './InterviewTimer';

interface Props { app: Application; skills: string[]; store: Store; onClose: () => void }
const STAGES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'];

export function ApplicationDetail({ app, skills, store, onClose }: Props) {
  const [target, setTarget] = useState<ApplicationStatus | null>(null);
  const [cv, setCv] = useState('');
  const [date, setDate] = useState('');
  const [dt, setDt] = useState('');
  const [salary, setSalary] = useState('');
  const [mode, setMode] = useState<WorkMode>(app.workMode);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState('');
  const [note, setNote] = useState('');

  const next = TRANSITIONS[app.status];
  const done = app.checklist.filter((c) => c.done).length;
  const total = app.checklist.length;
  const match = calcSkillMatch(app.requiredSkills, skills);

  const confirm = () => {
    if (!target) return;
    const payload: TransitionPayload = { cvVersion: cv, appliedDate: date, interviewDateTime: dt, salaryOffer: Number(salary), workMode: mode };
    const err = validateTransition(app.status, target, payload);
    if (err) return setError(err);
    store.transition(app.id, target, payload);
    setTarget(null); setError(''); setCv(''); setDate(''); setDt(''); setSalary('');
  };
  const addItem = (e: FormEvent) => { e.preventDefault(); store.addItem(app.id, newItem); setNewItem(''); };
  const addNote = (e: FormEvent) => { e.preventDefault(); store.addNote(app.id, note); setNote(''); };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <div>
            <h3>{app.role} — {app.company}</h3>
            <small>{app.workMode} • CV: {app.cvVersion ?? '-'} • Match {match.score}%{app.interviewDateTime && ` • Interview ${formatDateTime(app.interviewDateTime)}`}</small>
          </div>
          <button className="btn" onClick={onClose}>Tutup</button>
        </div>

        <div className="stages">
          {STAGES.map((s, i) => <span key={s} className={s === app.status ? 'on' : ''}>{i + 1}. {s}</span>)}
          {(app.status === 'REJECTED' || app.status === 'GHOSTED') && <span className="on">{app.status}</span>}
        </div>

        <div className="card">
          <b>Pindahkan status ke:</b>{' '}
          {next.length === 0 ? <small>Status final — tidak ada transisi.</small> : next.map((s) => (
            <button key={s} className={`btn ${target === s ? 'primary' : ''}`} onClick={() => { setTarget(s); setError(''); }}>{s}</button>
          ))}
          {target === 'APPLIED' && (
            <div className="row">
              <input placeholder="Versi CV" value={cv} onChange={(e) => setCv(e.target.value)} />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
          {target === 'INTERVIEW' && <div className="row"><input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} /></div>}
          {target === 'OFFER' && (
            <div className="row">
              <input type="number" min="1" placeholder="Gaji / uang saku (Rp)" value={salary} onChange={(e) => setSalary(e.target.value)} />
              <select value={mode} onChange={(e) => setMode(e.target.value as WorkMode)}><option>Remote</option><option>Hybrid</option><option>Onsite</option></select>
            </div>
          )}
          {target && <div className="row"><button className="btn primary" onClick={confirm}>Konfirmasi</button></div>}
          {error && <p className="err">{error}</p>}
        </div>

        <div className="cols">
          <div>
            <div className="between"><b>Daftar Persiapan</b><small>{done} / {total} selesai</small></div>
            <div className="bar"><div style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
            {app.checklist.map((c) => (
              <div className="between check" key={c.id}>
                <label className={c.done ? 'done' : ''}><input type="checkbox" checked={c.done} onChange={() => store.toggleItem(app.id, c.id)} /> {c.text}</label>
                <button className="x" aria-label="Hapus item" onClick={() => store.removeItem(app.id, c.id)}>×</button>
              </div>
            ))}
            <form className="row" onSubmit={addItem}>
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Tambah tugas persiapan baru..." />
              <button className="btn primary">Tambah</button>
            </form>
          </div>
          <div>
            <InterviewTimer />
            <b>Riwayat Aktivitas</b>
            <ul className="log">
              {[...app.activityLogs].reverse().map((l) => <li key={l.id}><small>{formatDateTime(l.timestamp)}</small><br />{l.message}</li>)}
            </ul>
            <form className="row" onSubmit={addNote}>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan manual..." />
              <button className="btn">Catat</button>
            </form>
          </div>
        </div>

        <div className="row end">
          {(app.status === 'APPLIED' || app.status === 'SCREENING') && <button className="btn" onClick={() => store.simulate15(app.id)}>Simulasi +15 Hari</button>}
          <button className="btn danger" onClick={() => { store.remove(app.id); onClose(); }}>Hapus</button>
        </div>
      </div>
    </div>
  );
}
