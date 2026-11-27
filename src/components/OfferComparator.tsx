import { useState } from 'react';
import { GitCompareArrows, Trophy } from 'lucide-react';
import type { Application } from '../types';
import { scoreOffers, MODE_SCORE } from '../utils/offer';
import type { OfferScore } from '../utils/offer';
import { formatRupiah } from '../utils/application';
import { ScrollRevealTitle } from './ScrollRevealTitle';
import { MotionCard } from './MotionCard';

function OfferPanel({ app, s, best, index }: { app: Application; s: OfferScore; best: boolean; index: number }) {
  return (
    <MotionCard className={best ? 'best' : undefined} index={index} hover={false}>
      <div className="between" style={{ marginBottom: 4 }}>
        <ScrollRevealTitle as="h3" text={app.company} />
        {best && (
          <span className="badge green">
            <Trophy size={12} /> Rekomendasi Terbaik
          </span>
        )}
      </div>
      <small style={{ display: 'block', marginBottom: 14 }}>{app.role}</small>

      <div className="metric-row">
        <span style={{ color: 'var(--text-secondary)' }}>Uang Saku (50%)</span>
        <span className="mono">{formatRupiah(app.salaryOffer ?? 0)} · <b>{s.salary.toFixed(1)}</b>/50</span>
      </div>
      <div className="bar" style={{ marginBottom: 8 }}>
        <div className="bar-fill" style={{ width: `${(s.salary / 50) * 100}%` }} />
      </div>

      <div className="metric-row">
        <span style={{ color: 'var(--text-secondary)' }}>Mode Kerja (25%)</span>
        <span className="mono">{app.workMode} ({MODE_SCORE[app.workMode]}) · <b>{s.mode.toFixed(1)}</b>/25</span>
      </div>
      <div className="bar" style={{ marginBottom: 8 }}>
        <div className="bar-fill signal" style={{ width: `${(s.mode / 25) * 100}%` }} />
      </div>

      <div className="metric-row">
        <span style={{ color: 'var(--text-secondary)' }}>Kecocokan Skill (25%)</span>
        <span className="mono">{s.match.score}% ({s.match.matched.length}/{app.requiredSkills.length}) · <b>{s.skill.toFixed(1)}</b>/25</span>
      </div>
      <div className="bar" style={{ marginBottom: 10 }}>
        <div className="bar-fill green" style={{ width: `${s.match.score}%` }} />
      </div>

      {app.requiredSkills.length > 0 && (
        <div className="tags" style={{ marginBottom: 6 }}>
          {s.match.matched.map((t) => <span key={t} className="tag ok">{t}</span>)}
          {s.match.missing.map((t) => <span key={t} className="tag miss">{t}</span>)}
        </div>
      )}

      <div className="between total">
        <b>Total Skor</b>
        <b style={{ fontSize: 18, color: best ? 'var(--accent-sage)' : 'var(--text-primary)' }}>
          {s.total.toFixed(1)} / 100
        </b>
      </div>
    </MotionCard>
  );
}

export function OfferComparator({ applications, skills }: { applications: Application[]; skills: string[] }) {
  const offers = applications.filter((a) => a.status === 'OFFER' && (a.salaryOffer ?? 0) > 0);
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  if (offers.length < 2) {
    return (
      <div className="state">
        <p>
          Belum cukup offer untuk dibandingkan. Butuh minimal 2 lamaran berstatus <b>OFFER</b> dengan nominal gaji (saat ini: <span className="mono">{offers.length}</span>).
        </p>
      </div>
    );
  }

  const a = offers.find((o) => o.id === aId) ?? offers[0];
  const b = offers.find((o) => o.id === bId) ?? offers.find((o) => o.id !== a.id) ?? offers[1];
  const [sa, sb] = scoreOffers(a, b, skills);
  const options = offers.map((o) => <option key={o.id} value={o.id}>{o.company} — {o.role}</option>);

  const aWins = sa.total >= sb.total;
  const winner = aWins ? a : b;
  const winScore = aWins ? sa : sb;
  const loseScore = aWins ? sb : sa;
  const diff = Math.abs(sa.total - sb.total);

  const reasons: string[] = [];
  if (winScore.salary > loseScore.salary) reasons.push('uang saku lebih tinggi');
  if (winScore.mode > loseScore.mode) reasons.push(`mode kerja ${winner.workMode}`);
  if (winScore.skill > loseScore.skill) reasons.push(`kecocokan skill ${winScore.match.score}%`);

  return (
    <div>
      <div className="toolbar">
        <select value={a.id} onChange={(e) => setAId(e.target.value)} style={{ flex: 1 }} aria-label="Pilih Offer A">
          {options}
        </select>
        <span className="badge signal">
          <GitCompareArrows size={12} /> vs
        </span>
        <select value={b.id} onChange={(e) => setBId(e.target.value)} style={{ flex: 1 }} aria-label="Pilih Offer B">
          {options}
        </select>
      </div>

      {a.id === b.id ? (
        <div className="state">
          <p>Pilih dua offer yang berbeda untuk melihat perbandingan skor.</p>
        </div>
      ) : (
        <>
          <div className="rec-banner" role="status">
            <div>
              <b>{winner.company}</b> unggul{' '}
              <span className="mono">+{diff.toFixed(1)}</span> poin
              {reasons.length > 0 ? ` berkat ${reasons.join(', ')}.` : ' dengan skor seimbang.'}
            </div>
            <span className="badge green mono">{winScore.total.toFixed(1)} / 100</span>
          </div>

          <div className="compare-grid">
            <OfferPanel app={a} s={sa} best={aWins} index={0} />
            <OfferPanel app={b} s={sb} best={!aWins} index={1} />
          </div>
        </>
      )}

      <small>
        Bobot penilaian: Gaji <span className="mono">50%</span> (dinormalisasi terhadap gaji tertinggi) · Mode Kerja <span className="mono">25%</span> · Skill Match <span className="mono">25%</span>.
      </small>
    </div>
  );
}
