import type { Application } from '../types';
import { isGhostingRisk } from '../utils/ghosting';

const RESPONDED = ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];

// Semua angka = derived state, tidak disimpan di useState.
export function StatsCards({ applications }: { applications: Application[] }) {
  const applied = applications.filter((a) => a.status !== 'WISHLIST').length;
  const responded = applications.filter((a) => RESPONDED.includes(a.status)).length;
  const interviewed = applications.filter((a) => a.status === 'INTERVIEW' || a.status === 'OFFER' || a.interviewDateTime !== undefined).length;
  const ghost = applications.filter((a) => isGhostingRisk(a)).length;
  const offers = applications.filter((a) => a.status === 'OFFER').length;
  const pct = (n: number) => (applied === 0 ? 0 : Math.round((n / applied) * 100));
  const cards: [string, string, string][] = [
    ['Total Lamaran', String(applications.length), `${applied} sudah dikirim`],
    ['Response Rate', `${pct(responded)}%`, `${responded} dari ${applied} diproses`],
    ['Interview Rate', `${pct(interviewed)}%`, `${interviewed} masuk wawancara`],
    ['Rawan Ghosting', String(ghost), '> 14 hari tanpa kabar'],
    ['Offer Diterima', String(offers), 'Siap dibandingkan'],
  ];
  return (
    <div className="stats">
      {cards.map(([label, value, sub]) => (
        <div className="card stat" key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
          <small>{sub}</small>
        </div>
      ))}
    </div>
  );
}
