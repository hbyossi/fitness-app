import React, { useState, useMemo } from 'react';
import { useHistory } from '../context/AppProvider';
import { formatDate } from '../utils/helpers';

interface DataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
}

function MiniLineChart({ points, color, label }: { points: DataPoint[]; color: string; label: string }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.maxWeight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const W = 300;
  const H = 120;
  const PAD = 24;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const coords = points.map((p, i) => ({
    x: PAD + (i / (points.length - 1)) * plotW,
    y: PAD + plotH - ((p.maxWeight - min) / range) * plotH,
    point: p,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;
  const diffPct = first > 0 ? Math.round((diff / first) * 100) : 0;

  // Find the PR (all-time max) index
  const prIdx = values.indexOf(Math.max(...values));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <div className="card-title" style={{ fontSize: '0.9rem' }}>
          {label}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: diff > 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--text-muted)',
          }}
        >
          {diff > 0 ? '+' : ''}
          {diff} ק&quot;ג ({diffPct > 0 ? '+' : ''}
          {diffPct}%)
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = PAD + plotH - frac * plotH;
          const val = Math.round(min + frac * range);
          return (
            <g key={frac}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4" />
              <text x={PAD - 4} y={y + 3} textAnchor="end" fontSize="8" fill="var(--text-muted)">
                {val}
              </text>
            </g>
          );
        })}
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={i === prIdx ? 5 : 3} fill={i === prIdx ? 'var(--warning)' : color} />
            {i === prIdx && (
              <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="9" fill="var(--warning)">🏆</text>
            )}
          </g>
        ))}
        {/* Date labels — first and last */}
        <text x={coords[0].x} y={H - 4} textAnchor="start" fontSize="7" fill="var(--text-muted)">
          {formatDate(points[0].date)}
        </text>
        <text
          x={coords[coords.length - 1].x}
          y={H - 4}
          textAnchor="end"
          fontSize="7"
          fill="var(--text-muted)"
        >
          {formatDate(points[points.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}

export default function ProgressPage() {
  const { history } = useHistory();
  const [filter, setFilter] = useState('');

  // Build per-exercise progression data
  const exerciseData = useMemo(() => {
    const map = new Map<string, DataPoint[]>();
    // History is newest-first, reverse for chronological order
    const chronological = [...history].reverse();
    for (const entry of chronological) {
      for (const ex of entry.exercises) {
        const doneSets = ex.sets.filter((s) => s.done);
        if (doneSets.length === 0) continue;
        const key = ex.name;
        const maxWeight = Math.max(...doneSets.map((s) => s.weight));
        const totalVolume = doneSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ date: entry.date, maxWeight, totalVolume });
      }
    }
    // Sort by number of data points (most data first)
    return [...map.entries()]
      .filter(([, pts]) => pts.length >= 2)
      .sort((a, b) => b[1].length - a[1].length);
  }, [history]);

  const filteredData = filter ? exerciseData.filter(([name]) => name.includes(filter)) : exerciseData;

  // Overall weekly volume chart
  const weeklyVolume = useMemo(() => {
    if (history.length === 0) return [];
    const chronological = [...history].reverse();
    const weekMap = new Map<string, number>();
    for (const entry of chronological) {
      const d = new Date(entry.date);
      // Week key: start of ISO week
      const day = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day + 1);
      const weekKey = monday.toISOString().slice(0, 10);
      const vol = entry.exercises.reduce(
        (acc, ex) => acc + ex.sets.filter((s) => s.done).reduce((s, set) => s + set.weight * set.reps, 0),
        0,
      );
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + vol);
    }
    return [...weekMap.entries()].map(([date, vol]) => ({
      date,
      maxWeight: vol, // reusing the chart component — maxWeight represents volume here
      totalVolume: vol,
    }));
  }, [history]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">מעקב התקדמות</h1>
        <span className="badge badge-primary">{exerciseData.length} תרגילים</span>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📈</div>
          <div className="empty-text">אין נתוני אימונים עדיין — התחל להתאמן כדי לראות גרפים</div>
        </div>
      ) : (
        <>
          {/* Weekly total volume chart */}
          {weeklyVolume.length >= 2 && (
            <MiniLineChart points={weeklyVolume} color="var(--warning)" label="📊 נפח שבועי כולל (ק&quot;ג)" />
          )}

          {/* Search filter */}
          {exerciseData.length > 0 && (
            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
              <input
                className="form-input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="חפש תרגיל..."
              />
            </div>
          )}

          {filteredData.length === 0 && exerciseData.length > 0 && (
            <div className="empty-state">
              <div className="empty-text">צריך לפחות 2 אימונים עם אותו תרגיל כדי לראות גרף</div>
            </div>
          )}

          {/* Per-exercise charts */}
          {filteredData.map(([name, points]) => (
            <MiniLineChart key={name} points={points} color="var(--primary-light)" label={name} />
          ))}
        </>
      )}
    </div>
  );
}
