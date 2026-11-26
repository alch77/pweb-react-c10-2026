import { useEffect, useState } from 'react';
import { INTERVIEW_QUESTIONS } from '../utils/application';

const START = 120;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function InterviewTimer() {
  const [idx, setIdx] = useState(0);
  const [secs, setSecs] = useState(START);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id); // cleanup: saat pause / unmount / dependency berubah
  }, [running]);

  useEffect(() => {
    if (secs === 0) setRunning(false);
  }, [secs]);

  const next = () => { setIdx((i) => (i + 1) % INTERVIEW_QUESTIONS.length); setSecs(START); setRunning(false); };

  return (
    <div className="card">
      <div className="between"><b>Latihan Interview</b><small>Soal {idx + 1} / {INTERVIEW_QUESTIONS.length}</small></div>
      <p>"{INTERVIEW_QUESTIONS[idx]}"</p>
      <div className="between">
        <span className={`timer ${secs === 0 ? 'zero' : ''}`}>{fmt(secs)}</span>
        <div className="row">
          <button type="button" className="btn primary" disabled={secs === 0} onClick={() => setRunning((r) => !r)}>{running ? 'Jeda' : 'Mulai'}</button>
          <button type="button" className="btn" onClick={() => { setSecs(START); setRunning(false); }}>Reset</button>
          <button type="button" className="btn" onClick={next}>Lanjut</button>
        </div>
      </div>
    </div>
  );
}
