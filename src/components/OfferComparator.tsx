import { useState } from 'react';
import type { Application } from '../types';
import { scoreOffers, MODE_SCORE } from '../utils/offer';
import type { OfferScore } from '../utils/offer';
import { formatRupiah } from '../utils/application';

function Col({ app, s, best }: { app: Application; s: OfferScore; best: boolean }) {
  return (
    <div className={`card ${best ? 'best' : ''}`}>
      <div className="between"><b>{app.company}</b>{best && <span className="pill green">Rekomendasi Terbaik</span>}</div>
      <small>{app.role}</small>
      <p className="between"><span>Uang Saku</span><span>{formatRupiah(app.salaryOffer ?? 0)} — {s.salary.toFixed(1)} / 50</span></p>
      <p className="between"><span>Mode Kerja</span><span>{app.workMode} ({MODE_SCORE[app.workMode]}) — {s.mode.toFixed(1)} / 25</span></p>
      <p className="between"><span>Kecocokan Skill</span><span>{s.match.score}% ({s.match.matched.length} dari {app.requiredSkills.length}) — {s.skill.toFixed(1)} / 25</span></p>
      <p className="between total"><b>TOTAL SKOR</b><b>{s.total.toFixed(1)}</b></p>
    </div>
  );
}

export function OfferComparator({ applications, skills }: { applications: Application[]; skills: string[] }) {
  const offers = applications.filter((a) => a.status === 'OFFER' && (a.salaryOffer ?? 0) > 0);
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  if (offers.length < 2) return <div className="state">Belum cukup offer. Butuh minimal 2 lamaran berstatus OFFER untuk dibandingkan (saat ini: {offers.length}).</div>;

  const a = offers.find((o) => o.id === aId) ?? offers[0];
  const b = offers.find((o) => o.id === bId) ?? offers.find((o) => o.id !== a.id) ?? offers[1];
  const [sa, sb] = scoreOffers(a, b, skills);
  const options = offers.map((o) => <option key={o.id} value={o.id}>{o.company} — {o.role}</option>);

  return (
    <div>
      <div className="row">
        <select value={a.id} onChange={(e) => setAId(e.target.value)}>{options}</select>
        <span>vs</span>
        <select value={b.id} onChange={(e) => setBId(e.target.value)}>{options}</select>
      </div>
      {a.id === b.id ? <div className="state">Pilih dua offer yang berbeda.</div> : (
        <div className="grid">
          <Col app={a} s={sa} best={sa.total >= sb.total} />
          <Col app={b} s={sb} best={sb.total > sa.total} />
        </div>
      )}
      <small>Bobot: Gaji 50% (dinormalisasi terhadap gaji tertinggi) • Mode Kerja 25% • Skill Match 25%</small>
    </div>
  );
}
