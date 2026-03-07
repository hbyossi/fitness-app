import React, { useState } from 'react';
import { useHistory } from '../context/AppProvider';
import { formatTime } from '../utils/helpers';
import UndoToast from '../components/UndoToast';
import type { HistoryEntry } from '../types';

export default function HistoryPage() {
  const { history, dispatchHistory } = useHistory();
  const [deletedEntry, setDeletedEntry] = useState<{ entry: HistoryEntry; index: number } | null>(null);
  const [deletedAll, setDeletedAll] = useState<HistoryEntry[] | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30' | '90'>('all');

  const handleDelete = (id: string) => {
    const idx = history.findIndex((h) => h.id === id);
    if (idx === -1) return;
    const entry = history[idx];
    dispatchHistory({ type: 'DELETE_HISTORY', payload: id });
    setDeletedEntry({ entry, index: idx });
  };

  const handleUndoDelete = () => {
    if (deletedEntry) {
      dispatchHistory({ type: 'RESTORE_HISTORY', payload: deletedEntry });
      setDeletedEntry(null);
    }
  };

  const handleClearAll = () => {
    if (!window.confirm(`האם למחוק את כל ${history.length} האימונים?`)) return;
    setDeletedAll([...history]);
    dispatchHistory({ type: 'CLEAR_ALL_HISTORY' });
  };

  const handleUndoClearAll = () => {
    if (deletedAll) {
      dispatchHistory({ type: 'IMPORT_HISTORY', payload: deletedAll });
      setDeletedAll(null);
    }
  };

  // Date filter
  const filteredHistory = dateFilter === 'all' ? history : history.filter((e) => {
    const daysAgo = (Date.now() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= parseInt(dateFilter);
  });

  // Weekly stats
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = history.filter((e) => new Date(e.date) >= weekAgo);
  const weeklyVolume = thisWeek.reduce(
    (acc, entry) =>
      acc +
      entry.exercises.reduce(
        (a, ex) => a + ex.sets.filter((s) => s.done).reduce((s, set) => s + set.weight * set.reps, 0),
        0,
      ),
    0,
  );

  // Group by date
  const grouped: Record<string, HistoryEntry[]> = {};
  filteredHistory.forEach((entry) => {
    const dateKey = new Date(entry.date).toLocaleDateString('he-IL');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">היסטוריית אימונים</h1>
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          <span className="badge badge-primary">{history.length} אימונים</span>
          {history.length > 0 && (
            <button className="btn btn-ghost" onClick={handleClearAll} title="מחק הכל" style={{ fontSize: '0.75rem' }}>
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Date filter */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.8rem', overflowX: 'auto' }}>
          {([['all', 'הכל'], ['7', '7 ימים'], ['30', '30 ימים'], ['90', '90 ימים']] as const).map(([val, label]) => (
            <button
              key={val}
              className="btn"
              onClick={() => setDateFilter(val)}
              style={{
                background: dateFilter === val ? 'var(--primary)' : 'var(--bg-input)',
                fontSize: '0.75rem',
                padding: '0.3rem 0.6rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🏋️ אימונים השבוע</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-light)' }}>{thisWeek.length}</div>
          </div>
          <div className="card" style={{ textAlign: 'center', marginBottom: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📊 נפח שבועי</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--warning)' }}>
              {weeklyVolume.toLocaleString()} ק"ג
            </div>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">עדיין לא ביצעת אימונים</div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-text">אין אימונים בתקופה שנבחרה</div>
        </div>
      ) : (
        Object.entries(grouped).map(([dateKey, entries]) => (
          <div key={dateKey}>
            <div className="history-date">{dateKey}</div>
            {entries.map((entry) => {
              const completedSets = entry.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
              const totalSets = entry.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

              return (
                <div key={entry.id} className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">{entry.workoutName || entry.planName}</div>
                      <div className="card-subtitle">
                        {entry.planName} · {completedSets}/{totalSets} סטים · {formatTime(entry.duration)}
                      </div>
                      <div className="card-subtitle" style={{ color: 'var(--warning)' }}>
                        נפח:{' '}
                        {entry.exercises
                          .reduce(
                            (a, ex) =>
                              a + ex.sets.filter((s) => s.done).reduce((s, set) => s + set.weight * set.reps, 0),
                            0,
                          )
                          .toLocaleString()}{' '}
                        ק"ג
                      </div>
                    </div>
                    <button className="btn btn-ghost" onClick={() => handleDelete(entry.id)}>
                      🗑️
                    </button>
                  </div>

                  {entry.exercises.map((ex, i) => (
                    <div key={i} className="history-item" style={{ marginBottom: '0.3rem' }}>
                      <span className="history-exercise">{ex.name}</span>
                      <span className="history-sets">
                        {ex.sets
                          .filter((s) => s.done)
                          .map((s) => `${s.weight}ק"ג×${s.reps}`)
                          .join(' | ')}
                      </span>
                    </div>
                  ))}
                  {entry.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                      📝 {entry.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      )}

      {deletedEntry && (
        <UndoToast
          message="רשומת אימון נמחקה"
          onUndo={handleUndoDelete}
          onDismiss={() => setDeletedEntry(null)}
        />
      )}

      {deletedAll && (
        <UndoToast
          message={`${deletedAll.length} אימונים נמחקו`}
          onUndo={handleUndoClearAll}
          onDismiss={() => setDeletedAll(null)}
        />
      )}
    </div>
  );
}
