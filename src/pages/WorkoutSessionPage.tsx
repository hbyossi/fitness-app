import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlans, useHistory } from '../context/AppProvider';
import RestTimer from '../components/RestTimer';
import { InstructionsToggle, hasInstructions } from '../components/ExerciseInstructions';
import type { Instructions, HistorySet } from '../types';

interface SessionSet {
  setNum: number;
  weight: number;
  reps: number;
  done: boolean;
}

interface SessionExercise {
  exerciseId: string;
  name: string;
  instructions: Instructions | string;
  restTime: number;
  supersetGroup?: string;
  sets: SessionSet[];
}

interface SavedSession {
  planId: string;
  workoutId: string;
  session: SessionExercise[];
  currentExIndex: number;
  startTime: number;
  notes: string;
}

const SESSION_KEY = 'fitness_workout_session';

function loadSession(): SavedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data: SavedSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded */
  }
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export default function WorkoutSessionPage() {
  const { planId, workoutId } = useParams();
  const { plans } = usePlans();
  const { history, dispatchHistory } = useHistory();
  const navigate = useNavigate();
  const [finished, setFinished] = useState(false);

  const plan = plans.find((p) => p.id === planId);
  const workout = plan?.workouts.find((w) => w.id === workoutId);

  const saved = useRef<SavedSession | null>(loadSession());
  const isResume = saved.current?.planId === planId && saved.current?.workoutId === workoutId;
  const startTimeRef = useRef(isResume ? saved.current!.startTime : Date.now());

  // Find last logged workout for this exercise to pre-fill weights (ID primary, name fallback)
  const getLastWeight = (exerciseId: string, exerciseName: string): HistorySet[] | null => {
    for (const entry of history) {
      const found =
        entry.exercises.find((e) => e.exerciseId === exerciseId) ||
        entry.exercises.find((e) => e.name === exerciseName);
      if (found) {
        const doneSets = found.sets.filter((s) => s.done);
        if (doneSets.length > 0) return doneSets;
      }
    }
    return null;
  };

  // Get all-time max weight for an exercise (for PR detection)
  const getMaxWeight = (exerciseId: string, exerciseName: string): number => {
    let max = 0;
    for (const entry of history) {
      const found =
        entry.exercises.find((e) => e.exerciseId === exerciseId) ||
        entry.exercises.find((e) => e.name === exerciseName);
      if (found) {
        for (const s of found.sets) {
          if (s.done && s.weight > max) max = s.weight;
        }
      }
    }
    return max;
  };

  // Build session state: each exercise has sets with weight/reps/done
  const [session, setSession] = useState<SessionExercise[]>(() => {
    if (isResume) return saved.current!.session;
    if (!workout) return [];
    return workout.exercises.map((ex) => {
      const lastSets = getLastWeight(ex.id, ex.name);
      return {
        exerciseId: ex.id,
        name: ex.name,
        instructions: ex.instructions || '',
        restTime: ex.restTime || 90,
        supersetGroup: ex.supersetGroup,
        sets: Array.from({ length: ex.sets }, (_, i) => ({
          setNum: i + 1,
          weight: lastSets?.[i]?.weight ?? (ex.weight || 0),
          reps: lastSets?.[i]?.reps ?? ex.reps,
          done: false,
        })),
      };
    });
  });

  const [currentExIndex, setCurrentExIndex] = useState(isResume ? saved.current!.currentExIndex : 0);
  const [restTimerSignal, setRestTimerSignal] = useState(0);
  const [notes, setNotes] = useState(isResume ? saved.current!.notes || '' : '');

  // Persist session to sessionStorage on every change
  useEffect(() => {
    if (finished) return;
    saveSession({ planId: planId!, workoutId: workoutId!, session, currentExIndex, startTime: startTimeRef.current, notes });
  }, [session, currentExIndex, finished, planId, workoutId, notes]);

  // Prevent accidental page close/refresh during workout
  useEffect(() => {
    if (finished) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
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

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: number) => {
    setSession((prev) => {
      const copy = prev.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
      copy[exIdx].sets[setIdx][field] = value;
      return copy;
    });
  };

  const toggleSetDone = (exIdx: number, setIdx: number) => {
    setSession((prev) => {
      const copy = prev.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
      const wasDone = copy[exIdx].sets[setIdx].done;
      copy[exIdx].sets[setIdx].done = !wasDone;
      // Auto-start rest timer when marking a set as done (skip if next exercise is in same superset)
      if (!wasDone) {
        const inSuperset = copy[exIdx].supersetGroup &&
          exIdx < copy.length - 1 &&
          copy[exIdx + 1].supersetGroup === copy[exIdx].supersetGroup;
        if (!inSuperset) {
          setRestTimerSignal((s) => s + 1);
        }
      }
      // Auto-advance to next exercise if all sets done
      if (copy[exIdx].sets.every((s) => s.done) && exIdx < copy.length - 1) {
        setTimeout(() => setCurrentExIndex(exIdx + 1), 400);
      }
      return copy;
    });
  };

  const addSet = (exIdx: number) => {
    setSession((prev) => {
      const copy = prev.map((ex) => ({ ...ex, sets: ex.sets.map((s) => ({ ...s })) }));
      const lastSet = copy[exIdx].sets[copy[exIdx].sets.length - 1];
      copy[exIdx].sets.push({
        setNum: copy[exIdx].sets.length + 1,
        weight: lastSet?.weight ?? 0,
        reps: lastSet?.reps ?? 12,
        done: false,
      });
      return copy;
    });
  };

  const completedSets = session.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
  const totalSets = session.reduce((acc, ex) => acc + ex.sets.length, 0);
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const finishWorkout = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    dispatchHistory({
      type: 'LOG_WORKOUT',
      payload: {
        planId: plan.id,
        planName: plan.name,
        workoutName: workout.name,
        exercises: session.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets.map((s) => ({
            weight: s.weight,
            reps: s.reps,
            done: s.done,
          })),
        })),
        duration,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
    });
    setFinished(true);
    clearSession();
    navigate('/summary', {
      state: {
        summary: {
          workoutName: workout.name,
          planName: plan.name,
          exercises: session.map((ex) => ({
            exerciseId: ex.exerciseId,
            name: ex.name,
            sets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps, done: s.done })),
          })),
          duration,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      },
    });
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

  // PR detection: check if any done set exceeds the all-time max for current exercise
  const currentPrMax = currentEx ? getMaxWeight(currentEx.exerciseId, currentEx.name) : 0;
  const currentExHasPR = currentEx?.sets.some((s) => s.done && s.weight > currentPrMax && currentPrMax > 0) ?? false;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={handleQuit} title="יציאה">
            ✕
          </button>
          <div>
            <h1 className="page-title">{workout.name}</h1>
            <div className="card-subtitle">{plan.name}</div>
          </div>
        </div>
        <span className="badge badge-primary">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          background: 'var(--bg-input)',
          borderRadius: 3,
          marginBottom: '1rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: progress === 100 ? 'var(--success)' : 'var(--primary)',
            borderRadius: 3,
            transition: 'width 0.3s',
          }}
        />
      </div>

      {/* Exercise navigation */}
      <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.3rem', alignItems: 'center' }}>
        {session.map((ex, i) => {
          const allDone = ex.sets.every((s) => s.done);
          const isLinkedToNext = ex.supersetGroup && i < session.length - 1 && session[i + 1].supersetGroup === ex.supersetGroup;
          return (
            <React.Fragment key={i}>
            <button
              className="btn"
              onClick={() => setCurrentExIndex(i)}
              style={{
                background: i === currentExIndex ? 'var(--primary)' : allDone ? 'var(--success)' : 'var(--bg-input)',
                fontSize: '0.8rem',
                padding: '0.4rem 0.7rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {ex.name}
            </button>
            {isLinkedToNext && <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', flexShrink: 0 }}>🔗</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current exercise sets */}
      {currentEx && (
        <div className="card">
          {currentEx.supersetGroup && (
            <div style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginBottom: '0.3rem', fontWeight: 600 }}>🔗 סופרסט</div>
          )}
          <div className="card-title" style={{ marginBottom: '0.3rem' }}>
            {currentEx.name}
            {currentExHasPR && (
              <span style={{ marginRight: '0.5rem', fontSize: '0.8rem', color: 'var(--warning)' }}>🏆 שיא חדש!</span>
            )}
          </div>
          {hasInstructions(currentEx.instructions) && (
            <div style={{ marginBottom: '0.6rem' }}>
              <InstructionsToggle instructions={currentEx.instructions} />
            </div>
          )}

          <div
            className="set-row"
            style={{ color: 'var(--text-muted)', fontSize: '0.8rem', borderBottom: '1px solid var(--border)' }}
          >
            <span className="set-number">סט</span>
            <span style={{ textAlign: 'center' }}>משקל (ק&quot;ג)</span>
            <span style={{ textAlign: 'center' }}>חזרות</span>
            <span>✓</span>
          </div>

          {currentEx.sets.map((set, sIdx) => {
            const isPR = set.done && set.weight > currentPrMax && currentPrMax > 0;
            return (
            <div key={sIdx} className="set-row">
              <span className="set-number">{set.setNum}</span>
              <input
                className="set-input"
                type="number"
                min="0"
                step="0.5"
                value={set.weight}
                onChange={(e) => updateSet(currentExIndex, sIdx, 'weight', parseFloat(e.target.value) || 0)}
              />
              <input
                className="set-input"
                type="number"
                min="0"
                value={set.reps}
                onChange={(e) => updateSet(currentExIndex, sIdx, 'reps', parseInt(e.target.value) || 0)}
              />
              <button
                className={`set-check ${set.done ? 'done' : ''}`}
                onClick={() => toggleSetDone(currentExIndex, sIdx)}
              >
                {isPR ? '🏆' : '✓'}
              </button>
            </div>
            );
          })}

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addSet(currentExIndex)}
            style={{ fontSize: '0.8rem', marginTop: '0.4rem', width: '100%', border: '1px dashed var(--border)' }}
          >
            ➕ סט נוסף
          </button>

          {/* Navigate exercises */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem' }}>
            <button
              className="btn btn-ghost"
              disabled={currentExIndex === 0}
              onClick={() => setCurrentExIndex((i) => i - 1)}
            >
              → תרגיל קודם
            </button>
            <button
              className="btn btn-ghost"
              disabled={currentExIndex === session.length - 1}
              onClick={() => setCurrentExIndex((i) => i + 1)}
            >
              תרגיל הבא ←
            </button>
          </div>
        </div>
      )}

      <RestTimer defaultSeconds={currentEx?.restTime || 90} autoStartSignal={restTimerSignal} />

      {/* Workout notes */}
      <div className="card" style={{ marginTop: '0.8rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>📝 הערות לאימון</div>
        <textarea
          className="form-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הערות, תחושות, שינויים..."
          rows={2}
          style={{ resize: 'vertical' }}
        />
      </div>

      <button className="btn btn-success btn-full" onClick={finishWorkout} style={{ marginTop: '1rem' }}>
        🏁 סיים אימון ({completedSets}/{totalSets} סטים)
      </button>
    </div>
  );
}
