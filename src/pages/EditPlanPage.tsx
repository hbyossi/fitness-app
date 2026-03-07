import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlans, useBank } from '../context/AppProvider';
import { MUSCLE_GROUPS, generateId } from '../utils/helpers';
import ExerciseForm from '../components/ExerciseForm';
import SortableExerciseList from '../components/SortableExerciseList';
import type { Exercise } from '../types';

interface TempWorkout {
  tempId: string;
  id?: string;
  name: string;
  muscleGroup: string;
  exercises: Exercise[];
}

export default function EditPlanPage() {
  const { planId } = useParams();
  const { plans, dispatchPlans } = usePlans();
  const { exerciseBank } = useBank();
  const navigate = useNavigate();

  const plan = plans.find((p) => p.id === planId);

  const [planName, setPlanName] = useState(plan?.name || '');
  const [workouts, setWorkouts] = useState<TempWorkout[]>(() =>
    (plan?.workouts || []).map((w) => ({ ...w, tempId: w.id || generateId() })),
  );

  const [wName, setWName] = useState('');
  const [wMuscle, setWMuscle] = useState(MUSCLE_GROUPS[0]);
  const [editingWorkoutIdx, setEditingWorkoutIdx] = useState<number | null>(null);

  if (!plan) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <div className="empty-text">תוכנית לא נמצאה</div>
      </div>
    );
  }

  const addWorkout = () => {
    if (!wName.trim()) return;
    setWorkouts((prev) => [
      ...prev,
      {
        tempId: generateId(),
        name: wName.trim(),
        muscleGroup: wMuscle,
        exercises: [],
      },
    ]);
    setEditingWorkoutIdx(workouts.length);
    setWName('');
    setWMuscle(MUSCLE_GROUPS[0]);
  };

  const removeWorkout = (idx: number) => {
    setWorkouts((prev) => prev.filter((_, i) => i !== idx));
    if (editingWorkoutIdx === idx) setEditingWorkoutIdx(null);
    else if (editingWorkoutIdx !== null && editingWorkoutIdx > idx) setEditingWorkoutIdx(editingWorkoutIdx - 1);
  };

  const addExerciseToWorkout = (wIdx: number, exercise: Exercise) => {
    setWorkouts((prev) => prev.map((w, i) => (i === wIdx ? { ...w, exercises: [...w.exercises, exercise] } : w)));
  };

  const removeExercise = (wIdx: number, exId: string) => {
    setWorkouts((prev) =>
      prev.map((w, i) => (i === wIdx ? { ...w, exercises: w.exercises.filter((e) => e.id !== exId) } : w)),
    );
  };

  const updateExercise = (wIdx: number, exId: string, updates: Partial<Exercise>) => {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wIdx ? { ...w, exercises: w.exercises.map((e) => (e.id === exId ? { ...e, ...updates } : e)) } : w,
      ),
    );
  };

  const reorderExercises = (wIdx: number, newExercises: Exercise[]) => {
    setWorkouts((prev) => prev.map((w, i) => (i === wIdx ? { ...w, exercises: newExercises } : w)));
  };

  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || workouts.length === 0 || totalExercises === 0 || !planId) return;
    dispatchPlans({
      type: 'UPDATE_PLAN',
      payload: {
        id: planId,
        name: planName.trim(),
        workouts: workouts.map((w) => ({
          id: w.id || w.tempId,
          name: w.name,
          muscleGroup: w.muscleGroup,
          exercises: w.exercises,
        })),
      },
    });
    navigate('/');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
          ← חזרה
        </button>
        <h1 className="page-title">עריכת תוכנית</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">שם התוכנית</label>
          <input className="form-input" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
        </div>

        {workouts.map((w, wIdx) => (
          <div key={w.tempId} className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{w.name}</div>
                <div className="card-subtitle">
                  {w.muscleGroup} · {w.exercises.length} תרגילים
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditingWorkoutIdx(editingWorkoutIdx === wIdx ? null : wIdx)}
                >
                  {editingWorkoutIdx === wIdx ? '▲' : '▼'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => removeWorkout(wIdx)}>
                  🗑️
                </button>
              </div>
            </div>

            <SortableExerciseList
              exercises={w.exercises}
              onReorder={(newExercises) => reorderExercises(wIdx, newExercises)}
              onRemove={(exId) => removeExercise(wIdx, exId)}
              onUpdate={(exId, updates) => updateExercise(wIdx, exId, updates)}
              showSupersetLinks
            />

            {editingWorkoutIdx === wIdx && (
              <ExerciseForm onAdd={(ex) => addExerciseToWorkout(wIdx, ex)} exerciseBank={exerciseBank} />
            )}
          </div>
        ))}

        {/* Add Workout */}
        <div className="card" style={{ border: '1px dashed var(--border)' }}>
          <div className="card-title" style={{ marginBottom: '0.6rem' }}>
            הוסף אימון
          </div>
          <div className="form-group">
            <input
              className="form-input"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="לדוגמה: יום רגליים"
            />
          </div>
          <div className="form-group">
            <label className="form-label">קבוצת שרירים</label>
            <select className="form-select" value={wMuscle} onChange={(e) => setWMuscle(e.target.value)}>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-primary btn-full" onClick={addWorkout}>
            ➕ הוסף אימון
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-success btn-full"
          style={{ marginTop: '0.5rem' }}
          disabled={!planName.trim() || workouts.length === 0 || totalExercises === 0}
        >
          ✅ שמור שינויים
        </button>
      </form>
    </div>
  );
}
