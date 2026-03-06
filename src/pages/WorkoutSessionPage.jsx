import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import RestTimer from '../components/RestTimer';
import { InstructionsToggle, hasInstructions } from '../components/ExerciseInstructions';

const SESSION_KEY = 'fitness_workout_session';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export default function WorkoutSessionPage() {
  const { planId, workoutId } = useParams();
  const { state, dispatch } = useWorkout();
  const navigate = useNavigate();
  const [finished, setFinished] = useState(false);

  const plan = state.plans.find(p => p.id === planId);
  const workout = plan?.workouts.find(w => w.id === workoutId);

  const saved = useRef(loadSession());
  const isResume = saved.current?.planId === planId && saved.current?.workoutId === workoutId;
  const startTimeRef = useRef(isResume ? saved.current.startTime : Date.now());

  // Find last logged workout for this exercise to pre-fill weights
  const getLastWeight = (exerciseName) => {
    for (const entry of state.history) {
      const found = entry.exercises.find(e => e.name === exerciseName);
      if (found) {
        const doneSets = found.sets.filter(s => s.done);
        if (doneSets.length > 0) return doneSets;
      }
    }
    return null;
  };

  // Build session state: each exercise has sets with weight/reps/done
  const [session, setSession] = useState(() => {
    if (isResume) return saved.current.session;
    if (!workout) return [];
    return workout.exercises.map(ex => {
      const lastSets = getLastWeight(ex.name);
      return {
        exerciseId: ex.id,
        name: ex.name,
        instructions: ex.instructions || '',
        restTime: ex.restTime || 90,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNum: i + 1,
          weight: lastSets?.[i]?.weight ?? (ex.weight || 0),
          reps: lastSets?.[i]?.reps ?? ex.reps,
          done: false
        }))
      };
    });
  });

  const [currentExIndex, setCurrentExIndex] = useState(isResume ? saved.current.currentExIndex : 0);

  // Persist session to sessionStorage on every change
  useEffect(() => {
    if (finished) return;
    saveSession({ planId, workoutId, session, currentExIndex, startTime: startTimeRef.current });
  }, [session, currentExIndex, finished, planId, workoutId]);

  // Prevent accidental page close/refresh during workout
  useEffect(() => {
    if (finished) return;
    const handler = (e) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [finished]);

  if (!plan || !workout) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <div className="empty-text">אימון לא נמצא</div>
      </div>
    );
  }

  const updateSet = (exIdx, setIdx, field, value) => {
    setSession(prev => {
      const copy = prev.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) }));
      copy[exIdx].sets[setIdx][field] = value;
      return copy;
    });
  };

  const toggleSetDone = (exIdx, setIdx) => {
    setSession(prev => {
      const copy = prev.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) }));
      copy[exIdx].sets[setIdx].done = !copy[exIdx].sets[setIdx].done;
      // Auto-advance to next exercise if all sets done
      if (copy[exIdx].sets.every(s => s.done) && exIdx < copy.length - 1) {
        setTimeout(() => setCurrentExIndex(exIdx + 1), 400);
      }
      return copy;
    });
  };

  const completedSets = session.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0);
  const totalSets = session.reduce((acc, ex) => acc + ex.sets.length, 0);
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const finishWorkout = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    dispatch({
      type: 'LOG_WORKOUT',
      payload: {
        planId: plan.id,
        planName: plan.name,
        workoutName: workout.name,
        exercises: session.map(ex => ({
          name: ex.name,
          sets: ex.sets.map(s => ({
            weight: s.weight,
            reps: s.reps,
            done: s.done
          }))
        })),
        duration
      }
    });
    setFinished(true);
    clearSession();
    navigate('/summary', { state: { summary: { workoutName: workout.name, planName: plan.name, exercises: session.map(ex => ({ name: ex.name, sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps, done: s.done })) })), duration } } });
  };

  const handleQuit = () => {
    if (completedSets > 0) {
      if (!window.confirm('יש סטים שהושלמו. לצאת מהאימון בלי לשמור?')) return;
    }
    setFinished(true);
    clearSession();
    navigate('/');
  };

  const currentEx = session[currentExIndex];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={handleQuit} title="יציאה">✕</button>
          <div>
            <h1 className="page-title">{workout.name}</h1>
            <div className="card-subtitle">{plan.name}</div>
          </div>
        </div>
        <span className="badge badge-primary">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 6,
        background: 'var(--bg-input)',
        borderRadius: 3,
        marginBottom: '1rem',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: progress === 100 ? 'var(--success)' : 'var(--primary)',
          borderRadius: 3,
          transition: 'width 0.3s'
        }} />
      </div>

      {/* Exercise navigation */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
        {session.map((ex, i) => {
          const allDone = ex.sets.every(s => s.done);
          return (
            <button
              key={i}
              className="btn"
              onClick={() => setCurrentExIndex(i)}
              style={{
                background: i === currentExIndex ? 'var(--primary)' : allDone ? 'var(--success)' : 'var(--bg-input)',
                fontSize: '0.8rem',
                padding: '0.4rem 0.7rem',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {ex.name}
            </button>
          );
        })}
      </div>

      {/* Current exercise sets */}
      {currentEx && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '0.3rem' }}>{currentEx.name}</div>
          {hasInstructions(currentEx.instructions) && (
            <div style={{ marginBottom: '0.6rem' }}><InstructionsToggle instructions={currentEx.instructions} /></div>
          )}

          <div className="set-row" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', borderBottom: '1px solid var(--border)' }}>
            <span className="set-number">סט</span>
            <span style={{ textAlign: 'center' }}>משקל (ק&quot;ג)</span>
            <span style={{ textAlign: 'center' }}>חזרות</span>
            <span>✓</span>
          </div>

          {currentEx.sets.map((set, sIdx) => (
            <div key={sIdx} className="set-row">
              <span className="set-number">{set.setNum}</span>
              <input
                className="set-input"
                type="number"
                min="0"
                step="0.5"
                value={set.weight}
                onChange={e => updateSet(currentExIndex, sIdx, 'weight', parseFloat(e.target.value) || 0)}
              />
              <input
                className="set-input"
                type="number"
                min="0"
                value={set.reps}
                onChange={e => updateSet(currentExIndex, sIdx, 'reps', parseInt(e.target.value) || 0)}
              />
              <button
                className={`set-check ${set.done ? 'done' : ''}`}
                onClick={() => toggleSetDone(currentExIndex, sIdx)}
              >
                ✓
              </button>
            </div>
          ))}

          {/* Navigate exercises */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem' }}>
            <button
              className="btn btn-ghost"
              disabled={currentExIndex === 0}
              onClick={() => setCurrentExIndex(i => i - 1)}
            >
              → תרגיל קודם
            </button>
            <button
              className="btn btn-ghost"
              disabled={currentExIndex === session.length - 1}
              onClick={() => setCurrentExIndex(i => i + 1)}
            >
              תרגיל הבא ←
            </button>
          </div>
        </div>
      )}

      <RestTimer defaultSeconds={currentEx?.restTime || 90} />

      <button
        className="btn btn-success btn-full"
        onClick={finishWorkout}
        style={{ marginTop: '1rem' }}
      >
        🏁 סיים אימון ({completedSets}/{totalSets} סטים)
      </button>
    </div>
  );
}
