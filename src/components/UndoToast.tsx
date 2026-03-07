import React, { useEffect, useRef, useState } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export default function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, duration);

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100));
      if (elapsed < duration) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, onDismiss]);

  return (
    <div className="undo-toast">
      <span className="undo-toast-message">{message}</span>
      <button className="undo-toast-btn" onClick={onUndo}>
        ↩ ביטול
      </button>
      <div className="undo-toast-progress" style={{ width: `${progress}%` }} />
    </div>
  );
}
