import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatTime } from '../utils/helpers';

export default function RestTimer({
  defaultSeconds = 90,
  autoStartSignal = 0,
}: {
  defaultSeconds?: number;
  /** Increment this value to auto-start the timer (e.g. when a set is marked done) */
  autoStartSignal?: number;
}) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when defaultSeconds changes (exercise switch)
  useEffect(() => {
    if (!running) {
      setSeconds(defaultSeconds);
    }
  }, [defaultSeconds]);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Auto-start when a set is completed
  const prevSignal = useRef(autoStartSignal);
  useEffect(() => {
    if (autoStartSignal > 0 && autoStartSignal !== prevSignal.current) {
      prevSignal.current = autoStartSignal;
      setSeconds(defaultSeconds);
      setRunning(true);
    }
  }, [autoStartSignal, defaultSeconds]);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, stop]);

  const start = () => {
    if (seconds === 0) setSeconds(defaultSeconds);
    setRunning(true);
  };

  const reset = () => {
    stop();
    setSeconds(defaultSeconds);
  };

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>טיימר מנוחה</div>
      <div className="timer-display">{formatTime(seconds)}</div>
      <div className="timer-controls">
        {!running ? (
          <button className="btn btn-primary" onClick={start} style={{ minWidth: 80 }}>
            {seconds === 0 ? 'איפוס' : 'התחל'}
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stop} style={{ minWidth: 80 }}>
            עצור
          </button>
        )}
        <button className="btn btn-ghost" onClick={reset}>
          🔄
        </button>
      </div>
    </div>
  );
}
