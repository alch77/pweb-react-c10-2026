import { useMemo } from 'react';
import {
  Activity,
  ArrowUpRight,
  Compass,
  Crosshair,
  RadioTower,
  Trophy,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '../types';
import { formatDateTime } from '../utils/application';
import { isGhostingRisk } from '../utils/ghosting';
import { getProfileReadiness, getTopMissingSkills } from '../utils/skills';
import { ScrollRevealTitle } from './ScrollRevealTitle';

interface Props {
  applications: Application[];
  skills: string[];
  conflictsCount: number;
  onAddSkill: (skill: string) => void;
  onOpenApp: (id: string) => void;
  onJumpStage: (stage: ApplicationStatus | 'ALL') => void;
  onNavigate: (tab: 'explore' | 'pipeline' | 'prep' | 'compare') => void;
  onRegister: () => void;
}

const RESPONDED = ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];

const STAGES: { status: ApplicationStatus; label: string; color: string; cx: number; cy: number }[] = [
  { status: 'WISHLIST', label: 'Wishlist', color: '#8f9ca8', cx: 50, cy: 48 },
  { status: 'APPLIED', label: 'Applied', color: '#93c5fd', cx: 96, cy: 44 },
  { status: 'SCREENING', label: 'Screening', color: '#c4b5fd', cx: 106, cy: 84 },
  { status: 'INTERVIEW', label: 'Interview', color: '#7dd3fc', cx: 64, cy: 104 },
  { status: 'OFFER', label: 'Offer', color: '#9ee6a8', cx: 72, cy: 72 },
  { status: 'GHOSTED', label: 'Ghosted', color: '#f5b062', cx: 36, cy: 86 },
  { status: 'REJECTED', label: 'Rejected', color: '#f87171', cx: 88, cy: 108 },
];

export function MissionOverview({
  applications,
  skills,
  conflictsCount,
  onAddSkill,
  onOpenApp,
  onJumpStage,
  onNavigate,
  onRegister,
}: Props) {
  const applied = applications.filter((a) => a.status !== 'WISHLIST').length;
  const responded = applications.filter((a) => RESPONDED.includes(a.status)).length;
  const interviewed = applications.filter(
    (a) => a.status === 'INTERVIEW' || a.status === 'OFFER' || a.interviewDateTime !== undefined,
  ).length;
  const ghostApps = useMemo(() => applications.filter((a) => isGhostingRisk(a)), [applications]);
  const offers = applications.filter((a) => a.status === 'OFFER').length;
  const pct = (n: number) => (applied === 0 ? 0 : Math.round((n / applied) * 100));

  const stageCounts = useMemo(() => {
    const map: Record<ApplicationStatus, number> = {
      WISHLIST: 0,
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      GHOSTED: 0,
    };
    for (const a of applications) map[a.status] += 1;
    return map;
  }, [applications]);

  const nextInterview = useMemo(
    () =>
      applications
        .filter((a) => Boolean(a.interviewDateTime))
        .sort((a, b) => Date.parse(a.interviewDateTime ?? '') - Date.parse(b.interviewDateTime ?? ''))[0] ?? null,
    [applications],
  );

  const focusMission = nextInterview ?? applications[0] ?? null;

  const recentActivity = useMemo(
    () =>
      applications
        .flatMap((a) => a.activityLogs.map((log) => ({ ...log, appId: a.id, company: a.company, status: a.status })))
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(0, 4),
    [applications],
  );

  const topMissing = useMemo(() => getTopMissingSkills(applications, skills, 3), [applications, skills]);
  const readiness = useMemo(() => getProfileReadiness(skills, applications), [skills, applications]);

  const systemTone = conflictsCount > 0 ? 'danger' : ghostApps.length > 0 ? 'warn' : '';
  const systemText = conflictsCount > 0 ? 'CONFLICT ALERT' : ghostApps.length > 0 ? 'GHOST RISK' : 'NOMINAL';

  return (
    <div>
      <section className="nova-stage" aria-label="NOVA Mission Control Overview">
        <div className="nova-backdrop" aria-hidden="true" />

        <div className="nova-hero-grid">
          <div className="nova-hero-copy">
            <h1 className="nova-display">
              <ScrollRevealTitle as="span" text="EXPLORE." />
              <br />
              <ScrollRevealTitle as="span" text="PREPARE." />
              <br />
              <ScrollRevealTitle as="span" text="LAND IT." className="nova-display-accent" />
            </h1>

            <p className="nova-lead">
              Kendalikan seluruh perjalanan magang pertamamu — pindai lowongan, pantau pipeline, cegah ghosting, dan bandingkan offer terbaik.
            </p>

            <div className="nova-cta-row">
              <button type="button" className="btn primary lg" onClick={onRegister}>
                Launch Mission <ArrowUpRight size={15} />
              </button>
              <button type="button" className="btn lg" onClick={() => onNavigate('explore')}>
                Scan Missions <Crosshair size={15} />
              </button>
            </div>
          </div>

          <div className="nova-target-col">
            <div className="status-chip" role="status">
              <span>Status</span>
              <span className={`status-dot ${systemTone}`} aria-hidden="true" />
              <span className={`status-val ${systemTone}`}>{systemText}</span>
            </div>

            <button
              type="button"
              className="nova-target-tag"
              onClick={() => (focusMission ? onOpenApp(focusMission.id) : onNavigate('explore'))}
            >
              <span className="nova-target-label">
                <span className="status-dot" aria-hidden="true" />
                {nextInterview ? 'Next Interview Target' : focusMission ? 'Active Target' : 'Primary Mission'}
              </span>
              <div className="nova-target-title">
                {focusMission ? focusMission.company : 'First Internship'}
              </div>
              <div className="nova-target-meta">
                {nextInterview?.interviewDateTime
                  ? formatDateTime(nextInterview.interviewDateTime)
                  : focusMission
                    ? `${focusMission.status} · ${focusMission.workMode}`
                    : `${skills.length} skills armed`}
              </div>
            </button>
          </div>

          <aside className="nova-telemetry-rail" aria-label="5 Statistik Utama Lamaran">
            <div className="rail-metric">
              <Compass size={16} className="rail-metric-icon" aria-hidden="true" />
              <span className="rail-metric-val">{String(applications.length).padStart(2, '0')}</span>
              <span className="rail-metric-lbl">Total Lamaran</span>
            </div>
            <div className="rail-metric">
              <Activity size={16} className="rail-metric-icon" aria-hidden="true" />
              <span className="rail-metric-val sage">{pct(responded)}%</span>
              <span className="rail-metric-lbl">Response Rate</span>
            </div>
            <div className="rail-metric">
              <Crosshair size={16} className="rail-metric-icon" aria-hidden="true" />
              <span className="rail-metric-val">{pct(interviewed)}%</span>
              <span className="rail-metric-lbl">Interview Rate</span>
            </div>
            <div className="rail-metric">
              <RadioTower size={16} className="rail-metric-icon" aria-hidden="true" />
              <span className={`rail-metric-val ${ghostApps.length > 0 ? 'danger' : ''}`}>
                {String(ghostApps.length).padStart(2, '0')}
              </span>
              <span className="rail-metric-lbl">Rawan Ghosting</span>
            </div>
            <div className="rail-metric">
              <Trophy size={16} className="rail-metric-icon" aria-hidden="true" />
              <span className={`rail-metric-val ${offers > 0 ? 'sage' : ''}`}>
                {String(offers).padStart(2, '0')}
              </span>
              <span className="rail-metric-lbl">Total Offer</span>
            </div>
          </aside>
        </div>

        {/* NOVA 4-Column Flight Module Deck */}
        <div className="nova-deck">
          {/* 1. Captain Readiness (Fleet Status style) */}
          <article className="nova-module">
            <div className="nova-module-head">
              <h2 className="nova-module-title">Captain Readiness</h2>
              <span className="nova-module-meta">{skills.length} skills</span>
            </div>

            <div className="tags">
              {skills.slice(0, 6).map((s) => (
                <span className="tag ok" key={s}>{s}</span>
              ))}
              {topMissing.map(({ skill }) => (
                <button
                  type="button"
                  key={skill}
                  className="tag miss"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onAddSkill(skill)}
                  title="Tambahkan skill ini ke profil"
                >
                  + {skill}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div className="between" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{readiness.label}</div>
                  <small>{readiness.note}</small>
                </div>
                <span className="mono" style={{ color: 'var(--accent-sage)', fontWeight: 600 }}>
                  {readiness.score}%
                </span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${readiness.score}%` }} />
              </div>
            </div>
          </article>

          {/* 2. Next Mission */}
          <article className="nova-module">
            <div className="nova-module-head">
              <h2 className="nova-module-title">Next Mission</h2>
              <span className="nova-module-meta">
                {focusMission ? focusMission.status : 'STANDBY'}
              </span>
            </div>

            {focusMission ? (
              <>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>{focusMission.company}</h3>
                  <small style={{ display: 'block', marginTop: 4 }}>{focusMission.role}</small>
                </div>
                <div className="tags">
                  <span className="tag">{focusMission.workMode}</span>
                  {focusMission.cvVersion && <span className="tag">CV {focusMission.cvVersion}</span>}
                </div>
                <div className="between" style={{ marginTop: 'auto' }}>
                  <small className="mono">
                    {focusMission.interviewDateTime
                      ? formatDateTime(focusMission.interviewDateTime)
                      : `Checklist ${focusMission.checklist.filter((c) => c.done).length}/${focusMission.checklist.length}`}
                  </small>
                  <button
                    type="button"
                    className="nova-icon-btn"
                    aria-label={`Buka detail ${focusMission.company}`}
                    onClick={() => onOpenApp(focusMission.id)}
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
                  Belum ada misi aktif. Pindai lowongan di Job Explorer atau daftarkan lamaran pertamamu.
                </p>
                <div className="between" style={{ marginTop: 'auto' }}>
                  <small>Siap diluncurkan</small>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => onNavigate('explore')}
                  >
                    Explore <ArrowUpRight size={13} />
                  </button>
                </div>
              </>
            )}
          </article>

          {/* 3. System Scan · Live Radar */}
          <article className="nova-module">
            <div className="nova-module-head">
              <h2 className="nova-module-title">System Scan</h2>
              <span className="nova-module-meta" style={{ color: 'var(--accent-sage)' }}>LIVE</span>
            </div>

            <div className="nova-radar-wrap">
              <svg className="nova-radar-svg" viewBox="0 0 144 144" aria-hidden="true">
                <circle cx="72" cy="72" r="66" fill="rgba(7,9,13,0.7)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <circle cx="72" cy="72" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <circle cx="72" cy="72" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <line x1="72" y1="6" x2="72" y2="138" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="6" y1="72" x2="138" y2="72" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <g className="radar-sweep">
                  <path d="M72 72 L72 6 A66 66 0 0 1 124 32 Z" fill="rgba(158,230,168,0.14)" />
                  <line x1="72" y1="72" x2="72" y2="6" stroke="#9EE6A8" strokeWidth="1.2" strokeOpacity="0.8" />
                </g>
                {STAGES.map((st) => {
                  const active = stageCounts[st.status] > 0;
                  return (
                    <circle
                      key={st.status}
                      cx={st.cx}
                      cy={st.cy}
                      r={active ? 4.2 : 2.2}
                      fill={active ? st.color : 'rgba(255,255,255,0.22)'}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="between" style={{ marginTop: 'auto' }}>
              <div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
                  {ghostApps.length}
                </div>
                <small>{ghostApps.length > 0 ? 'Rawan ghosting' : 'Sinyal stabil'}</small>
              </div>
              <button type="button" className="btn sm" onClick={() => onJumpStage('ALL')}>
                View <ArrowUpRight size={13} />
              </button>
            </div>
          </article>

          {/* 4. Mission Timeline · Upcoming / Recent */}
          <article className="nova-module">
            <div className="nova-module-head">
              <h2 className="nova-module-title">Mission Timeline</h2>
              <span className="nova-module-meta">
                {recentActivity.length > 0 ? `${recentActivity.length} LOGS` : 'READY'}
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <ol className="nova-timeline">
                <li>
                  <span className="nova-tl-rail"><span className="nova-tl-dot active" /></span>
                  <button type="button" className="nova-tl-btn" onClick={() => onNavigate('explore')}>
                    <div className="nova-tl-name">Kalibrasi Skill Profile</div>
                    <span className="nova-tl-desc">{skills.length} skill aktif · siap scan</span>
                  </button>
                </li>
                <li>
                  <span className="nova-tl-rail"><span className="nova-tl-dot" /></span>
                  <button type="button" className="nova-tl-btn" onClick={() => onNavigate('explore')}>
                    <div className="nova-tl-name">Pindai Lowongan Magang</div>
                    <span className="nova-tl-desc">Simpan target ke Wishlist</span>
                  </button>
                </li>
                <li>
                  <span className="nova-tl-rail"><span className="nova-tl-dot" /></span>
                  <button type="button" className="nova-tl-btn" onClick={() => onNavigate('prep')}>
                    <div className="nova-tl-name">Latihan Interview 2 Menit</div>
                    <span className="nova-tl-desc">Buka Training Simulator</span>
                  </button>
                </li>
              </ol>
            ) : (
              <ol className="nova-timeline">
                {recentActivity.map((item, idx) => (
                  <li key={item.id}>
                    <span className="nova-tl-rail">
                      <span className={`nova-tl-dot ${idx === 0 ? 'active' : ''}`} />
                    </span>
                    <button type="button" className="nova-tl-btn" onClick={() => onOpenApp(item.appId)}>
                      <div className="between">
                        <span className="nova-tl-name">{item.company}</span>
                        <span className="mono" style={{ fontSize: 12, color: idx === 0 ? 'var(--accent-sage)' : 'var(--text-muted)' }}>
                          {new Date(item.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <span className="nova-tl-desc">{item.message}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </article>
        </div>
      </section>

      {/* Interactive Pipeline Distribution Strip */}
      <section className="nova-pipeline-strip" aria-label="Distribusi status lamaran">
        <div className="between" style={{ flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Pipeline Telemetry</h3>
          <small>
            <span className="mono">{applied}</span> dikirim · <span className="mono">{interviewed}</span> interview · <span className="mono">{offers}</span> offer
          </small>
        </div>

        <div className="pipeline-bar" role="img" aria-label="Proporsi status lamaran">
          {applications.length === 0 ? (
            <div style={{ flexGrow: 1, background: 'rgba(255,255,255,0.08)' }} />
          ) : (
            STAGES.map(({ status }) => {
              const count = stageCounts[status];
              if (count === 0) return null;
              return <div key={status} className={`seg-${status}`} style={{ flexGrow: count }} title={`${status}: ${count}`} />;
            })
          )}
        </div>

        <div className="stage-legend">
          {STAGES.map((st) => (
            <button
              type="button"
              key={st.status}
              className="stage-btn"
              onClick={() => onJumpStage(st.status)}
            >
              <span className="stage-dot" style={{ background: st.color }} />
              <span>{st.label}</span>
              <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {stageCounts[st.status]}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
