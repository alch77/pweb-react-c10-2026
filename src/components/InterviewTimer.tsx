import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { INTERVIEW_QUESTIONS } from '../utils/application';

const START = 120;
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function InterviewTimer({ compact = false, embedded = false }: { compact?: boolean; embedded?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [secs, setSecs] = useState(START);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const selectQuestion = (nextIdx: number) => {
    setIdx(nextIdx);
    setSecs(START);
    setRunning(false);
  };

  const next = () => selectQuestion((idx + 1) % INTERVIEW_QUESTIONS.length);

  const reset = () => {
    setSecs(START);
    setRunning(false);
  };

  const statusText = secs === 0 ? 'Time Up' : running ? 'Running' : 'Ready';
  const statusTone = secs === 0 ? 'red' : running ? 'green' : 'signal';
  const ratio = (secs / START) * 100;

  const body = (
    <>
      <div className="between">
        <small>
          Pertanyaan <span className="mono">{String(idx + 1).padStart(2, '0')} / {String(INTERVIEW_QUESTIONS.length).padStart(2, '0')}</span>
        </small>
        <span className={`badge ${statusTone}`}>{statusText}</span>
      </div>

      <div className={`timer-display ${compact ? 'compact' : ''} ${secs === 0 ? 'zero' : ''}`} role="timer" aria-live="off">
        {fmt(secs)}
      </div>

      <div className="bar" style={{ marginBottom: 16 }}>
        <div className={`bar-fill ${secs <= 20 ? 'red' : secs <= 45 ? 'yellow' : ''}`} style={{ width: `${ratio}%` }} />
      </div>

      <div className="question-box">
        "{INTERVIEW_QUESTIONS[idx]}"
        <small style={{ display: 'block', marginTop: 8 }}>
          Ambil napas sejenak, Captain. Jawab dengan terstruktur dalam dua menit.
        </small>
      </div>

      <div className="row" style={{ justifyContent: compact ? 'flex-start' : 'center' }}>
        <button type="button" className="btn primary" disabled={secs === 0} onClick={() => setRunning((r) => !r)}>
          {running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}
        </button>
        <button type="button" className="btn" onClick={reset}>
          <RotateCcw size={15} /> Reset
        </button>
        <button type="button" className="btn" onClick={next}>
          <SkipForward size={15} /> Next Question
        </button>
      </div>

      {!compact && (
        <div className="q-nav" role="group" aria-label="Pilih nomor pertanyaan">
          {INTERVIEW_QUESTIONS.map((_, i) => (
            <button
              type="button"
              key={i}
              className={`btn sm ${i === idx ? 'accent' : 'ghost'}`}
              onClick={() => selectQuestion(i)}
            >
              <span className="mono">Q{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return <div>{body}</div>;

  return <section className="panel simulator-shell" aria-label="Training Simulator">{body}</section>;
}
