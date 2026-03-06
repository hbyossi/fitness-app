import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { formatDate, formatTime } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HistoryPage() {
  const { state, dispatch } = useWorkout();
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = () => {
    dispatch({ type: 'DELETE_HISTORY', payload: deleteId });
    setDeleteId(null);
  };

  // Weekly stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = state.history.filter(e => new Date(e.date) >= weekAgo);
  const weeklyVolume = thisWeek.reduce((acc, entry) =>
    acc + entry.exercises.reduce((a, ex) =>
      a + ex.sets.filter(s => s.done).reduce((s, set) => s + set.weight * set.reps, 0), 0), 0
  );

  // Group by date
  const grouped = {};
  state.history.forEach(entry => {
    const dateKey = new Date(entry.date).toLocaleDateString('he-IL');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">היסטוריית אימונים</h1>
        <span className="badge badge-primary">{state.history.length} אימונים</span>
      </div>

      {state.history.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🏋️ אימונים השבוע</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-light)' }}>{thisWeek.length}</div>
          </div>
          <div className="card" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📊 נפח שבועי</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--warning)' }}>{weeklyVolume.toLocaleString()} ק"ג</div>
          </div>
        </div>
      )}

      {state.history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">עדיין לא ביצעת אימונים</div>
        </div>
      ) : (
        Object.entries(grouped).map(([dateKey, entries]) => (
          <div key={dateKey}>
            <div className="history-date">{dateKey}</div>
            {entries.map(entry => {
              const completedSets = entry.exercises.reduce(
                (acc, ex) => acc + ex.sets.filter(s => s.done).length, 0
              );
              const totalSets = entry.exercises.reduce(
                (acc, ex) => acc + ex.sets.length, 0
              );

              return (
                <div key={entry.id} className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">{entry.workoutName || entry.planName}</div>
                      <div className="card-subtitle">
                        {entry.planName} · {completedSets}/{totalSets} סטים · {formatTime(entry.duration)}
                      </div>
                      <div className="card-subtitle" style={{ color: 'var(--warning)' }}>
                        נפח: {entry.exercises.reduce((a, ex) => a + ex.sets.filter(s => s.done).reduce((s, set) => s + set.weight * set.reps, 0), 0).toLocaleString()} ק"ג
                      </div>
                    </div>
                    <button className="btn btn-ghost" onClick={() => setDeleteId(entry.id)}>🗑️</button>
                  </div>

                  {entry.exercises.map((ex, i) => (
                    <div key={i} className="history-item" style={{ marginBottom: '0.3rem' }}>
                      <span className="history-exercise">{ex.name}</span>
                      <span className="history-sets">
                        {ex.sets
                          .filter(s => s.done)
                          .map(s => `${s.weight}ק"ג×${s.reps}`)
                          .join(' | ')}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))
      )}

      {deleteId && (
        <ConfirmDialog
          title="מחיקת אימון"
          text="האם למחוק את רשומת האימון?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
