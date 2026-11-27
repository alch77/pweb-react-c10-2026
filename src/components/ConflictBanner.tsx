import { AlertTriangle } from 'lucide-react';
import type { Application } from '../types';
import { formatDateTime } from '../utils/application';

export function ConflictBanner({ conflicts }: { conflicts: [Application, Application][] }) {
  if (conflicts.length === 0) return null;
  return (
    <div className="banner" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <div>
        <b>Peringatan Konflik Jadwal Interview:</b>{' '}
        {conflicts
          .map(
            ([a, b]) =>
              `${a.company} (${formatDateTime(a.interviewDateTime ?? '')}) dan ${b.company} (${formatDateTime(b.interviewDateTime ?? '')})`,
          )
          .join('; ')}{' '}
        berselisih kurang dari 60 menit.
      </div>
    </div>
  );
}
