import { useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Bell, Menu, Plus, Search, UserRound, X } from 'lucide-react';
import type { ApplicationStatus, JobListing } from './types';
import type { JobSource } from './services/jobService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useApplications } from './hooks/useApplications';
import { findConflicts } from './utils/conflict';
import { isGhostingRisk } from './utils/ghosting';
import { guessWorkMode, norm } from './utils/application';
import { ConflictBanner } from './components/ConflictBanner';
import { MissionOverview } from './components/MissionOverview';
import { SkillProfile } from './components/SkillProfile';
import { JobExplorer } from './components/JobExplorer';
import { ApplicationForm } from './components/ApplicationForm';
import { Pipeline } from './components/Pipeline';
import { ApplicationDetail } from './components/ApplicationDetail';
import { OfferComparator } from './components/OfferComparator';
import { InterviewTimer } from './components/InterviewTimer';
import { UndoToast } from './components/UndoToast';
import { ScrollRevealTitle } from './components/ScrollRevealTitle';
import { ThemeToggle } from './components/ThemeToggle';
import { BackupPanel } from './components/BackupPanel';

type Tab = 'overview' | 'explore' | 'pipeline' | 'prep' | 'compare';

const TAB_META: Record<Tab, { label: string; title: string; subtitle: string }> = {
  overview: {
    label: 'Dashboard',
    title: 'Mission Overview',
    subtitle: 'Kendalikan progres lamaran, jadwal wawancara, dan kesiapan skill.',
  },
  explore: {
    label: 'Missions',
    title: 'Job Explorer',
    subtitle: 'Pindai lowongan magang dan ukur kecocokan terhadap profil skill Kapten.',
  },
  pipeline: {
    label: 'War Room',
    title: 'War Room Pipeline',
    subtitle: 'Pantau seluruh tahapan lamaran, risiko ghosting, dan jadwal interview.',
  },
  prep: {
    label: 'Simulator',
    title: 'Interview Prep',
    subtitle: 'Latihan jawaban interview 2 menit tanpa distraksi.',
  },
  compare: {
    label: 'Offers',
    title: 'Offer Comparator',
    subtitle: 'Bandingkan dua offer secara objektif dengan skor berbobot.',
  },
};

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [pipelineFilter, setPipelineFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [menuOpen, setMenuOpen] = useState(false);
  const [skills, setSkills] = useLocalStorage<string[]>('amm:skills', ['React', 'TypeScript', 'CSS']);
  const store = useApplications();
  const { applications } = store;
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conflicts = useMemo(() => findConflicts(applications), [applications]); // dari SEMUA data
  const ghostCount = useMemo(() => applications.filter((a) => isGhostingRisk(a)).length, [applications]);
  const selected = applications.find((a) => a.id === selectedId) ?? null;
  const offerCount = applications.filter((a) => a.status === 'OFFER').length;
  const hasAlert = conflicts.length > 0 || ghostCount > 0;

  const saveJob = (job: JobListing, source: JobSource) =>
    store.add({
      company: job.company_name,
      role: job.title,
      workMode: guessWorkMode(job.candidate_required_location),
      status: 'WISHLIST',
      requiredSkills: job.tags,
      source: source === 'live' ? 'Remotive' : 'Dataset Lokal',
    });

  const addSkillIfMissing = (skill: string) => {
    const clean = skill.trim();
    if (!clean || skills.some((s) => norm(s) === norm(clean))) return;
    setSkills([...skills, clean]);
  };

  const selectTab = (next: Tab) => {
    setTab(next);
    setMenuOpen(false);
  };

  const jumpToStage = (stage: ApplicationStatus | 'ALL') => {
    setPipelineFilter(stage);
    setTab('pipeline');
    setMenuOpen(false);
  };

  const meta = TAB_META[tab];

  return (
    <MotionConfig reducedMotion="user">
      <div className="nova-shell">
        <header className="nova-header">
          <div className="nova-header-inner">
            <button type="button" className="nova-brand" onClick={() => selectTab('overview')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="2" fill="var(--accent-sage)" />
              </svg>
              <span className="nova-brand-name">AKU MW MAGANG</span>
            </button>

            <nav className="nova-nav-pill" aria-label="Navigasi utama">
              {(['overview', 'explore', 'pipeline', 'prep', 'compare'] as Tab[]).map((key) => {
                const count = key === 'pipeline' ? applications.length : key === 'compare' ? offerCount : null;
                return (
                  <button
                    type="button"
                    key={key}
                    className={`nova-nav-btn ${tab === key ? 'on' : ''}`}
                    onClick={() => {
                      if (key === 'pipeline') setPipelineFilter('ALL');
                      selectTab(key);
                    }}
                  >
                    <span>{TAB_META[key].label}</span>
                    {count !== null && count > 0 && <span className="nova-nav-count">{count}</span>}
                  </button>
                );
              })}
            </nav>

            <div className="nova-actions">
              <div className="tools">
                <ThemeToggle />
                <BackupPanel applications={applications} skills={skills} />
              </div>

              <button
                type="button"
                className="nova-icon-btn"
                aria-label="Cari lowongan di Job Explorer"
                title="Pindai Lowongan"
                onClick={() => selectTab('explore')}
              >
                <Search size={16} />
              </button>

              <button
                type="button"
                className="nova-icon-btn"
                aria-label="Buka peringatan War Room"
                title={hasAlert ? 'Ada peringatan jadwal atau ghosting' : 'Tidak ada peringatan'}
                onClick={() => jumpToStage('ALL')}
              >
                <Bell size={16} />
                {hasAlert && <span className="alert-pip" aria-hidden="true" />}
              </button>

              <button
                type="button"
                className="nova-captain-chip"
                onClick={() => selectTab('explore')}
                title="Profil Skill Captain"
              >
                <span className="captain-avatar" aria-hidden="true">
                  <UserRound size={14} />
                </span>
                <span className="captain-label">Captain</span>
              </button>

              <button
                type="button"
                className="menu-btn"
                aria-label="Toggle menu navigasi"
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="mobile-drawer" aria-label="Navigasi mobile">
              {(['overview', 'explore', 'pipeline', 'prep', 'compare'] as Tab[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  className={`nova-nav-btn ${tab === key ? 'on' : ''}`}
                  onClick={() => {
                    if (key === 'pipeline') setPipelineFilter('ALL');
                    selectTab(key);
                  }}
                >
                  <span>{TAB_META[key].label}</span>
                  {key === 'pipeline' && <span className="nova-nav-count">{applications.length}</span>}
                  {key === 'compare' && <span className="nova-nav-count">{offerCount}</span>}
                </button>
              ))}
              <div className="row" style={{ marginTop: 8 }}>
                <ThemeToggle />
                <BackupPanel applications={applications} skills={skills} />
              </div>
              <button
                type="button"
                className="btn primary"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setMenuOpen(false);
                  setShowForm(true);
                }}
              >
                <Plus size={15} /> Launch Mission
              </button>
            </nav>
          )}
        </header>

        <main className="nova-main">
          <ConflictBanner conflicts={conflicts} />

          {tab !== 'overview' && (
            <div className="page-intro">
              <div>
                <ScrollRevealTitle as="h2" text={meta.title} />
                <p>{meta.subtitle}</p>
              </div>
              <button type="button" className="btn primary" onClick={() => setShowForm(true)}>
                <Plus size={15} /> Launch Mission
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === 'overview' && (
                <MissionOverview
                  applications={applications}
                  skills={skills}
                  conflictsCount={conflicts.length}
                  onAddSkill={addSkillIfMissing}
                  onOpenApp={setSelectedId}
                  onJumpStage={jumpToStage}
                  onNavigate={selectTab}
                  onRegister={() => setShowForm(true)}
                />
              )}
              {tab === 'explore' && (
                <div className="layout">
                  <SkillProfile skills={skills} applications={applications} onChange={setSkills} />
                  <JobExplorer skills={skills} applications={applications} onSave={saveJob} />
                </div>
              )}
              {tab === 'pipeline' && (
                <Pipeline
                  applications={applications}
                  skills={skills}
                  initialStatus={pipelineFilter}
                  onOpen={setSelectedId}
                  onSimulate={store.simulate15}
                  onDelete={store.remove}
                />
              )}
              {tab === 'prep' && <InterviewTimer />}
              {tab === 'compare' && <OfferComparator applications={applications} skills={skills} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {showForm && <ApplicationForm onSubmit={store.add} onClose={() => setShowForm(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {selected && (
            <ApplicationDetail
              key={selected.id}
              app={selected}
              skills={skills}
              store={store}
              onClose={() => setSelectedId(null)}
            />
          )}
        </AnimatePresence>
        <UndoToast pending={store.pending} onUndo={store.undo} />
      </div>
    </MotionConfig>
  );
}
