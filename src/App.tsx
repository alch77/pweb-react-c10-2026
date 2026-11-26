import { useMemo, useState } from 'react';
import type { JobListing } from './types';
import type { JobSource } from './services/jobService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useApplications } from './hooks/useApplications';
import { findConflicts } from './utils/conflict';
import { guessWorkMode } from './utils/application';
import { StatsCards } from './components/StatsCards';
import { ConflictBanner } from './components/ConflictBanner';
import { SkillProfile } from './components/SkillProfile';
import { JobExplorer } from './components/JobExplorer';
import { ApplicationForm } from './components/ApplicationForm';
import { Pipeline } from './components/Pipeline';
import { ApplicationDetail } from './components/ApplicationDetail';
import { OfferComparator } from './components/OfferComparator';
import { UndoToast } from './components/UndoToast';

type Tab = 'explore' | 'pipeline' | 'compare';

export default function App() {
  const [tab, setTab] = useState<Tab>('explore');
  const [skills, setSkills] = useLocalStorage<string[]>('amm:skills', ['React', 'TypeScript', 'CSS']);
  const store = useApplications();
  const { applications } = store;
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conflicts = useMemo(() => findConflicts(applications), [applications]); // dari SEMUA data
  const selected = applications.find((a) => a.id === selectedId) ?? null;
  const offerCount = applications.filter((a) => a.status === 'OFFER').length;

  const saveJob = (job: JobListing, source: JobSource) =>
    store.add({
      company: job.company_name,
      role: job.title,
      workMode: guessWorkMode(job.candidate_required_location),
      status: 'WISHLIST',
      requiredSkills: job.tags,
      source: source === 'live' ? 'Remotive' : 'Dataset Lokal',
    });

  return (
    <div className="app">
      <header className="top">
        <b>Aku Mw Magang</b>
        <nav>
          <button className={tab === 'explore' ? 'on' : ''} onClick={() => setTab('explore')}>Eksplorasi Lowongan</button>
          <button className={tab === 'pipeline' ? 'on' : ''} onClick={() => setTab('pipeline')}>Pipeline Lamaran ({applications.length})</button>
          <button className={tab === 'compare' ? 'on' : ''} onClick={() => setTab('compare')}>Bandingkan Offer ({offerCount})</button>
        </nav>
        <button className="btn primary" onClick={() => setShowForm(true)}>+ Catat Lamaran</button>
      </header>

      <main>
        <ConflictBanner conflicts={conflicts} />
        <StatsCards applications={applications} />
        {tab === 'explore' && (
          <div className="layout">
            <SkillProfile skills={skills} onChange={setSkills} />
            <JobExplorer skills={skills} applications={applications} onSave={saveJob} />
          </div>
        )}
        {tab === 'pipeline' && (
          <Pipeline applications={applications} skills={skills} onOpen={setSelectedId} onSimulate={store.simulate15} onDelete={store.remove} />
        )}
        {tab === 'compare' && <OfferComparator applications={applications} skills={skills} />}
      </main>

      {showForm && <ApplicationForm onSubmit={store.add} onClose={() => setShowForm(false)} />}
      {selected && <ApplicationDetail key={selected.id} app={selected} skills={skills} store={store} onClose={() => setSelectedId(null)} />}
      <UndoToast pending={store.pending} onUndo={store.undo} />
    </div>
  );
}
