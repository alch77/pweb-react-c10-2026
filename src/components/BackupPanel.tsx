import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Application } from '../types';
import { APPLICATIONS_KEY, SKILLS_KEY, backupFileName, buildBackup, parseBackup } from '../utils/backup';
import type { BackupFile } from '../utils/backup';

interface Props { applications: Application[]; skills: string[] }

export function BackupPanel({ applications, skills }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [error, setError] = useState('');

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(buildBackup(applications, skills), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // supaya file yang sama bisa dipilih ulang
    if (!file) return;
    const result = parseBackup(await file.text());
    if (!result.ok) { setError(result.error); setPending(null); return; }
    setError('');
    setPending(result.data); // tunggu konfirmasi sebelum menimpa data
  };

  const confirmImport = () => {
    if (!pending) return;
    // useLocalStorage membaca storage saat mount, jadi tulis lalu muat ulang halaman.
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(pending.applications));
    localStorage.setItem(SKILLS_KEY, JSON.stringify(pending.skills));
    window.location.reload();
  };

  return (
    <>
      <button type="button" className="btn" onClick={exportJson}>⬇ Ekspor</button>
      <button type="button" className="btn" onClick={() => fileRef.current?.click()}>⬆ Impor</button>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onPick} aria-label="File backup JSON" />
      {error && <span className="err backup-err" role="alert">{error}</span>}
      {pending && (
        <div className="overlay" onClick={() => setPending(null)}>
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Impor backup?</h3>
            <p>
              File berisi <b>{pending.applications.length}</b> lamaran dan <b>{pending.skills.length}</b> skill.
              Data yang ada sekarang akan <b>ditimpa</b>.
            </p>
            <div className="row end">
              <button type="button" className="btn" onClick={() => setPending(null)}>Batal</button>
              <button type="button" className="btn primary" onClick={confirmImport}>Ya, timpa data</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
