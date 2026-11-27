import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { PendingDelete } from '../hooks/useApplications';

export function UndoToast({ pending, onUndo }: { pending: PendingDelete | null; onUndo: () => void }) {
  const [left, setLeft] = useState(5);

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      clearInterval(id);
      setLeft(5);
    };
  }, [pending]);

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          key={pending.app.id}
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="between">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={17} color="#9ee6a8" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Mission dihapus</div>
                <small>{pending.app.company} — {pending.app.role}</small>
              </div>
            </div>
            <button type="button" className="link" onClick={onUndo} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <RotateCcw size={13} />
              Undo · {left}s
            </button>
          </div>
          <div className="toast-bar">
            <div className="toast-bar-fill" style={{ width: `${(left / 5) * 100}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
