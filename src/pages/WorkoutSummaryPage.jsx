import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatTime } from '../utils/helpers';

export default function WorkoutSummaryPage() {
  const { state: routeState } = useLocation();
  const navigate = useNavigate();

  if (!routeState?.summary) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <div className="empty-text">אין נתוני אימון</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>חזרה לבית</button>
      </div>
    );
  }

  const { workoutName, planName, exercises, duration } = routeState.summary;

  const completedSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalVolume = exercises.reduce((acc, ex) =>
    acc + ex.sets.filter(s => s.done).reduce((sum, s) => sum + (s.weight * s.reps), 0), 0
  );
  const totalReps = exercises.reduce((acc, ex) =>
    acc + ex.sets.filter(s => s.done).reduce((sum, s) => sum + s.reps, 0), 0
  );

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
        <h1 className="page-title">כל הכבוד!</h1>
        <div className="card-subtitle">{workoutName} · {planName}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ זמן</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-light)' }}>{formatTime(duration)}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✅ סטים</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{completedSets}/{totalSets}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🏋️ נפח כולל</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)' }}>{totalVolume.toLocaleString()} ק"ג</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔁 חזרות</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-light)' }}>{totalReps}</div>
        </div>
      </div>

      {exercises.map((ex, i) => {
        const doneSets = ex.sets.filter(s => s.done);
        if (doneSets.length === 0) return null;
        return (
          <div key={i} className="card">
            <div className="card-title" style={{ fontSize: '0.95rem' }}>{ex.name}</div>
            <div className="exercise-detail">
              {doneSets.map((s, j) => `${s.weight}ק"ג×${s.reps}`).join(' | ')}
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/')}>
          🏠 חזרה לבית
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/history')} style={{ whiteSpace: 'nowrap' }}>
          📊 היסטוריה
        </button>
      </div>
    </div>
  );
}
