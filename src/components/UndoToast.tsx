import { useEffect, useState } from 'react';
import type { PendingDelete } from '../hooks/useApplications';

export function UndoToast({ pending, onUndo }: { pending: PendingDelete | null; onUndo: () => void }) {
  const [left, setLeft] = useState(5);
  useEffect(() => {
    if (!pending) return;
    setLeft(5);
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [pending]);
  if (!pending) return null;
  return (
    <div className="toast" role="status">
      Lamaran <b>{pending.app.company}</b> telah dihapus. <button className="link" onClick={onUndo}>Undo ({left}d)</button>
    </div>
  );
}
