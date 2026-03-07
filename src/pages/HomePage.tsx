import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlans, useBank, useHistory, useImportData } from '../context/AppProvider';
import UndoToast from '../components/UndoToast';
import ExerciseForm from '../components/ExerciseForm';
import { exportData, validateImportData, getStorageUsage } from '../utils/storage';
import type { Exercise, Plan } from '../types';

function StorageUsageBar() {
  const [usage, setUsage] = useState({ usedKB: 0, percentUsed: 0, estimatedLimitMB: 0 });
  useEffect(() => {
    getStorageUsage().then((u) =>
      setUsage({ usedKB: u.usedKB, percentUsed: u.percentUsed, estimatedLimitMB: Math.round(u.estimatedLimit / 1024 / 1024) }),
    );
  }, []);
  const { usedKB, percentUsed, estimatedLimitMB } = usage;
  const isWarning = percentUsed > 70;
  const isDanger = percentUsed > 90;
  const color = isDanger ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--primary)';

  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '0.3rem',
        }}
      >
        <span>💿 אחסון: {usedKB} KB</span>
        <span>{percentUsed}% מ-{estimatedLimitMB || '?'} MB</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(percentUsed, 100)}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.3s',
          }}
        />
      </div>
      {isDanger && (
        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.3rem' }}>
          ⚠️ האחסון כמעט מלא! מומלץ לייצא גיבוי ולמחוק היסטוריה ישנה.
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { plans, dispatchPlans } = usePlans();
  const { exerciseBank } = useBank();
  const { history } = useHistory();
  const importData = useImportData();
  const navigate = useNavigate();
  const [deletedPlan, setDeletedPlan] = useState<Plan | null>(null);
  const [addingExercise, setAddingExercise] = useState<{ planId: string; workoutId: string } | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (!validateImportData(data)) {
          alert('קובץ הגיבוי לא תקין. ודא שזהו קובץ JSON שיוצא מהאפליקציה.');
          return;
        }
        if (
          !window.confirm(
            `ייבוא יחליף את כל הנתונים הנוכחיים. נמצאו ${data.plans.length} תוכניות, ${data.history.length} אימונים ו-${data.exerciseBank.length} תרגילים במאגר. להמשיך?`,
          )
        )
          return;
        importData(data);
        alert('הנתונים יובאו בהצלחה! ✅');
      } catch {
        alert('שגיאה בקריאת הקובץ. ודא שזהו קובץ JSON תקין.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddExercise = (exercise: Exercise) => {
    if (!addingExercise) return;
    dispatchPlans({
      type: 'ADD_EXERCISE',
      payload: {
        planId: addingExercise.planId,
        workoutId: addingExercise.workoutId,
        exercise,
      },
    });
    setAddingExercise(null);
  };

  const handleDelete = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    dispatchPlans({ type: 'DELETE_PLAN', payload: planId });
    setDeletedPlan(plan);
  };

  const handleUndoDelete = () => {
    if (deletedPlan) {
      dispatchPlans({ type: 'RESTORE_PLAN', payload: deletedPlan });
      setDeletedPlan(null);
    }
  };

  // Next workout suggestion: find least recently done workout across all plans
  const nextWorkout = (() => {
    if (plans.length === 0) return null;
    let best: { planId: string; planName: string; workoutId: string; workoutName: string; daysAgo: number | null } | null = null;
    for (const plan of plans) {
      for (const workout of plan.workouts) {
        const lastEntry = history.find(
          (h) => h.planId === plan.id && h.workoutName === workout.name,
        );
        const daysAgo = lastEntry
          ? Math.floor((Date.now() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        // Prefer never-done workouts (daysAgo=null), then oldest
        if (!best || (best.daysAgo !== null && (daysAgo === null || daysAgo > best.daysAgo))) {
          best = { planId: plan.id, planName: plan.name, workoutId: workout.id, workoutName: workout.name, daysAgo };
        }
      }
    }
    return best;
  })();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">התוכניות שלי</h1>
        <span className="badge badge-primary">{plans.length} תוכניות</span>
      </div>

      {/* Next Workout Suggestion */}
      {nextWorkout && plans.length > 0 && (
        <div className="next-workout-card">
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.3rem' }}>
            🎯 האימון הבא שלך
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.15rem' }}>
            {nextWorkout.workoutName}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.6rem' }}>
            {nextWorkout.planName}
            {nextWorkout.daysAgo !== null ? ` · לפני ${nextWorkout.daysAgo} ימים` : ' · טרם בוצע'}
          </div>
          <Link
            to={`/workout/${nextWorkout.planId}/${nextWorkout.workoutId}`}
            className="btn"
            style={{ background: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            🏋️ התחל אימון
          </Link>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💪</div>
          <div className="empty-text">אין תוכניות אימון עדיין</div>
          <Link to="/create" className="btn btn-primary">
            צור תוכנית חדשה
          </Link>
        </div>
      ) : (
        <>
        {plans.length >= 3 && (
          <div className="form-group" style={{ marginBottom: '0.8rem' }}>
            <input
              className="form-input"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              placeholder="🔍 חפש תוכנית..."
            />
          </div>
        )}
        {plans.filter((p) => !planFilter || p.name.includes(planFilter)).map((plan) => (
          <div key={plan.id} className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{plan.name}</div>
                <div className="card-subtitle">{plan.workouts.length} אימונים</div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button className="btn btn-ghost" onClick={() => navigate(`/plan/${plan.id}`)} title="צפייה">
                  👁️
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => dispatchPlans({ type: 'DUPLICATE_PLAN', payload: plan.id })}
                  title="שכפל"
                >
                  📋
                </button>
                <button className="btn btn-ghost" onClick={() => navigate(`/edit/${plan.id}`)} title="ערוך">
                  ✏️
                </button>
                <button className="btn btn-ghost" onClick={() => handleDelete(plan.id)} title="מחק">
                  🗑️
                </button>
              </div>
            </div>

            {/* List workouts inside the plan */}
            <div
              style={{ marginTop: '0.4rem', cursor: 'pointer' }}
              onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.3rem 0' }}>
                {expandedPlan === plan.id ? '▲ הסתר אימונים' : '▼ הצג אימונים (' + plan.workouts.length + ')'}
              </div>
            </div>
            {expandedPlan === plan.id && (
              <div>
                {plan.workouts.map((workout) => (
                  <React.Fragment key={workout.id}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-input)',
                        borderRadius: 8,
                        padding: '0.6rem 0.8rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{workout.name}</div>
                        <div className="exercise-detail">
                          {workout.muscleGroup} · {workout.exercises.length} תרגילים
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                          onClick={() =>
                            setAddingExercise(
                              addingExercise?.workoutId === workout.id
                                ? null
                                : { planId: plan.id, workoutId: workout.id },
                            )
                          }
                          title="הוסף תרגיל"
                        >
                          ➕
                        </button>
                        <Link
                          to={`/workout/${plan.id}/${workout.id}`}
                          className="btn btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                          🏋️ התחל
                        </Link>
                      </div>
                    </div>
                    {addingExercise?.planId === plan.id && addingExercise?.workoutId === workout.id && (
                      <ExerciseForm
                        onAdd={handleAddExercise}
                        onCancel={() => setAddingExercise(null)}
                        exerciseBank={exerciseBank}
                        compact
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
        </>
      )}

      {/* Data Management */}
      <div className="card" style={{ marginTop: '1rem', border: '1px dashed var(--border)' }}>
        <div className="card-title" style={{ marginBottom: '0.6rem' }}>
          💾 גיבוי ושחזור
        </div>
        <div className="card-subtitle" style={{ marginBottom: '0.8rem' }}>
          ייצא את כל הנתונים לקובץ גיבוי, או ייבא גיבוי קיים
        </div>
        <StorageUsageBar />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => exportData()}>
            📤 ייצוא גיבוי
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1, border: '1px solid var(--border)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            📥 ייבוא גיבוי
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>

      {deletedPlan && (
        <UndoToast
          message={`התוכנית "${deletedPlan.name}" נמחקה`}
          onUndo={handleUndoDelete}
          onDismiss={() => setDeletedPlan(null)}
        />
      )}
    </div>
  );
}
