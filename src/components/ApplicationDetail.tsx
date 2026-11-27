import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft, ChevronDown, ChevronUp, FileText, ListChecks, Plus, Sparkles, Timer, Trash2, X } from 'lucide-react';
import type { Application, ApplicationStatus, TransitionPayload, WorkMode } from '../types';
import type { Store } from '../hooks/useApplications';
import { TRANSITIONS, validateTransition } from '../utils/stateMachine';
import { calcSkillMatch } from '../utils/skillMatch';
import { formatDateTime } from '../utils/application';
import { InterviewTimer } from './InterviewTimer';

interface Props { app: Application; skills: string[]; store: Store; onClose: () => void }
const STAGES: ApplicationStatus[] = ['WISHLIST', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER'];

function getLogIcon(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('dibuat') || lower.includes('disimpan') || lower.includes('dicatat')) {
    return <Sparkles size={12} />;
  }
  if (lower.includes('pindah') || lower.includes('status') || lower.includes('→') || lower.includes('simulasi')) {
    return <ArrowRightLeft size={12} />;
  }
  return <FileText size={12} />;
}

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
  const [showDrill, setShowDrill] = useState(app.status === 'INTERVIEW');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const match = calcSkillMatch(app.requiredSkills, skills);
  const next = TRANSITIONS[app.status];
  const done = app.checklist.filter((c) => c.done).length;
  const total = app.checklist.length;
  const checklistPct = total ? Math.round((done / total) * 100) : 0;

  const confirm = () => {
    if (!target) return;
    const payload: TransitionPayload = {
      cvVersion: cv,
      appliedDate: date,
      interviewDateTime: dt,
      salaryOffer: salary ? Number(salary) : undefined,
      workMode: mode,
    };
    const err = validateTransition(app.status, target, payload);
    if (err) return setError(err);
    store.transition(app.id, target, payload);
    setTarget(null);
    setError('');
    setCv('');
    setDate('');
    setDt('');
    setSalary('');
  };

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    store.addItem(app.id, newItem);
    setNewItem('');
  };

  const addNote = (e: FormEvent) => {
    e.preventDefault();
    store.addNote(app.id, note);
    setNote('');
  };

  return (
    <motion.div
      className="overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <motion.div
        className="modal wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <h3 id="detail-modal-title">{app.role} — {app.company}</h3>
              <span className={`badge st-${app.status}`}>{app.status}</span>
            </div>
            <small style={{ display: 'block', marginTop: 6 }}>
              {app.workMode} · CV: {app.cvVersion ?? '-'} · Match <span className="mono">{match.score}%</span>
              {app.interviewDateTime && <> · Interview <span className="mono">{formatDateTime(app.interviewDateTime)}</span></>}
            </small>
            <div className="stages">
              {STAGES.map((s) => (
                <span key={s} className={s === app.status ? 'on' : ''}>{s}</span>
              ))}
              {(app.status === 'REJECTED' || app.status === 'GHOSTED') && <span className="on">{app.status}</span>}
            </div>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Tutup detail">
            <X size={16} /> Tutup
          </button>
        </div>

        <section className="modal-section">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <b>Transisi Status:</b>
            {next.length === 0 ? (
              <small>Status final — tidak ada transisi lanjutan.</small>
            ) : (
              next.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`btn sm ${target === s ? 'primary' : ''}`}
                  onClick={() => {
                    setTarget(s);
                    setError('');
                  }}
                >
                  {s}
                </button>
              ))
            )}
          </div>
          {target === 'APPLIED' && (
            <div className="row">
              <input placeholder="Versi CV (mis. CV-v2.pdf)" value={cv} onChange={(e) => setCv(e.target.value)} aria-label="Versi CV" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Tanggal melamar" />
            </div>
          )}
          {target === 'INTERVIEW' && (
            <div className="row">
              <input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} aria-label="Jadwal interview" />
            </div>
          )}
          {target === 'OFFER' && (
            <div className="row">
              <input type="number" min="1" placeholder="Gaji / uang saku (Rp)" value={salary} onChange={(e) => setSalary(e.target.value)} aria-label="Nominal gaji" />
              <select value={mode} onChange={(e) => setMode(e.target.value as WorkMode)} aria-label="Mode kerja">
                <option>Remote</option>
                <option>Hybrid</option>
                <option>Onsite</option>
              </select>
            </div>
          )}
          {target && (
            <div className="row">
              <button type="button" className="btn primary sm" onClick={confirm}>Konfirmasi Transisi</button>
            </div>
          )}
          {error && <p className="err">{error}</p>}
        </section>

        <section className="modal-section cols">
          <div>
            <div className="between" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ListChecks size={16} color="#9ee6a8" />
                <b>Daftar Persiapan</b>
              </div>
              <small className="mono">{done}/{total} ({checklistPct}%)</small>
            </div>
            <div className="bar" style={{ marginBottom: 12 }}>
              <div className="bar-fill green" style={{ width: `${checklistPct}%` }} />
            </div>
            {app.checklist.length === 0 && (
              <small style={{ display: 'block', marginBottom: 8 }}>Belum ada tugas persiapan.</small>
            )}
            {app.checklist.map((c) => (
              <div className="between check" key={c.id}>
                <label className={c.done ? 'done' : ''}>
                  <input type="checkbox" checked={c.done} onChange={() => store.toggleItem(app.id, c.id)} />
                  {c.text}
                </label>
                <button type="button" className="x" aria-label={`Hapus ${c.text}`} onClick={() => store.removeItem(app.id, c.id)}>
                  ×
                </button>
              </div>
            ))}
            <form className="row" onSubmit={addItem}>
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Tambah tugas persiapan..." aria-label="Tugas persiapan baru" />
              <button type="submit" className="btn primary sm">
                <Plus size={14} /> Tambah
              </button>
            </form>
          </div>

          <div>
            <b>Riwayat & Catatan</b>
            <ul className="log">
              {[...app.activityLogs].reverse().map((l) => (
                <li key={l.id}>
                  <span className="log-dot" aria-hidden="true">
                    {getLogIcon(l.message)}
                  </span>
                  <div className="log-content">
                    <span className="log-time">{formatDateTime(l.timestamp)}</span>
                    {l.message}
                  </div>
                </li>
              ))}
            </ul>
            <form className="row" onSubmit={addNote}>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambah catatan manual..." aria-label="Catatan manual" />
              <button type="submit" className="btn sm">Catat</button>
            </form>
          </div>
        </section>

        <section className="modal-section">
          <div className="between">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Timer size={15} color="#9ee6a8" />
              <b>Latihan Interview Cepat</b>
            </div>
            <button type="button" className="btn ghost sm" onClick={() => setShowDrill((v) => !v)}>
              {showDrill ? <><ChevronUp size={14} /> Sembunyikan</> : <><ChevronDown size={14} /> Buka Timer</>}
            </button>
          </div>
          {showDrill && (
            <div style={{ marginTop: 14 }}>
              <InterviewTimer compact embedded />
            </div>
          )}
        </section>

        <div className="row end" style={{ marginTop: 16 }}>
          {(app.status === 'APPLIED' || app.status === 'SCREENING') && (
            <button type="button" className="btn" onClick={() => store.simulate15(app.id)}>
              Simulasi +15 Hari
            </button>
          )}
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              store.remove(app.id);
              onClose();
            }}
          >
            <Trash2 size={14} /> Hapus Lamaran
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
