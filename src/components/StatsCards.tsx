import type { Application } from '../types';
import { isGhostingRisk } from '../utils/ghosting';

const RESPONDED = ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];

// Semua angka = derived state, tidak disimpan di useState.
export function StatsCards({ applications }: { applications: Application[] }) {
  const applied = applications.filter((a) => a.status !== 'WISHLIST').length;
  const responded = applications.filter((a) => RESPONDED.includes(a.status)).length;
  const interviewed = applications.filter(
    (a) => a.status === 'INTERVIEW' || a.status === 'OFFER' || a.interviewDateTime !== undefined,
  ).length;
  const ghost = applications.filter((a) => isGhostingRisk(a)).length;
  const offers = applications.filter((a) => a.status === 'OFFER').length;
  const pct = (n: number) => (applied === 0 ? 0 : Math.round((n / applied) * 100));

  return (
    <section className="kpi-strip" aria-label="Ringkasan statistik lamaran">
      <div className="kpi-cell anchor">
        <span className="kpi-label">Total Lamaran</span>
        <strong className="kpi-value">{applications.length}</strong>
        <span className="kpi-sub"><span className="mono">{applied}</span> sudah dikirim</span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Response Rate</span>
        <strong className="kpi-value tone-signal">{pct(responded)}%</strong>
        <span className="kpi-sub"><span className="mono">{responded}/{applied}</span> diproses</span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Interview Rate</span>
        <strong className="kpi-value">{pct(interviewed)}%</strong>
        <span className="kpi-sub"><span className="mono">{interviewed}</span> wawancara</span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Rawan Ghosting</span>
        <strong className={`kpi-value ${ghost > 0 ? 'tone-danger' : ''}`}>{ghost}</strong>
        <span className="kpi-sub">&gt; 14 hari pasif</span>
      </div>

      <div className="kpi-cell">
        <span className="kpi-label">Offer Diterima</span>
        <strong className={`kpi-value ${offers > 0 ? 'tone-success' : ''}`}>{offers}</strong>
        <span className="kpi-sub">{offers >= 2 ? 'Siap dibandingkan' : 'Target minimal 2'}</span>
      </div>
    </section>
  );
}
