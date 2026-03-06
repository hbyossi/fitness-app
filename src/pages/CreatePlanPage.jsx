import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { MUSCLE_GROUPS, generateId } from '../utils/helpers';

function ExerciseForm({ onAdd }) {
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('12');
  const [exWeight, setExWeight] = useState('');

  const handleAdd = () => {
    if (!exName.trim()) return;
    onAdd({
      id: generateId(),
      name: exName.trim(),
      sets: parseInt(exSets) || 3,
      reps: parseInt(exReps) || 12,
      weight: parseFloat(exWeight) || 0
    });
    setExName('');
    setExWeight('');
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div className="form-group">
        <input
          className="form-input"
          value={exName}
          onChange={e => setExName(e.target.value)}
          placeholder="שם התרגיל"
        />
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label className="form-label">סטים</label>
          <input className="form-input" type="number" min="1" value={exSets} onChange={e => setExSets(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">חזרות</label>
          <input className="form-input" type="number" min="1" value={exReps} onChange={e => setExReps(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">משקל (ק&quot;ג)</label>
          <input className="form-input" type="number" min="0" step="0.5" value={exWeight} onChange={e => setExWeight(e.target.value)} placeholder="0" />
        </div>
      </div>
      <button type="button" className="btn btn-primary btn-full" onClick={handleAdd}>
        ➕ הוסף תרגיל
      </button>
    </div>
  );
}

export default function CreatePlanPage() {
  const { dispatch } = useWorkout();
  const navigate = useNavigate();

  const [planName, setPlanName] = useState('');
  const [workouts, setWorkouts] = useState([]);

  // New workout form
  const [wName, setWName] = useState('');
  const [wMuscle, setWMuscle] = useState(MUSCLE_GROUPS[0]);

  const [editingWorkoutIdx, setEditingWorkoutIdx] = useState(null);

  const addWorkout = () => {
    if (!wName.trim()) return;
    setWorkouts(prev => [...prev, {
      tempId: generateId(),
      name: wName.trim(),
      muscleGroup: wMuscle,
      exercises: []
    }]);
    setEditingWorkoutIdx(workouts.length);
    setWName('');
    setWMuscle(MUSCLE_GROUPS[0]);
  };

  const removeWorkout = (idx) => {
    setWorkouts(prev => prev.filter((_, i) => i !== idx));
    if (editingWorkoutIdx === idx) setEditingWorkoutIdx(null);
    else if (editingWorkoutIdx > idx) setEditingWorkoutIdx(editingWorkoutIdx - 1);
  };

  const addExerciseToWorkout = (wIdx, exercise) => {
    setWorkouts(prev => prev.map((w, i) =>
      i === wIdx ? { ...w, exercises: [...w.exercises, exercise] } : w
    ));
  };

  const removeExercise = (wIdx, exId) => {
    setWorkouts(prev => prev.map((w, i) =>
      i === wIdx ? { ...w, exercises: w.exercises.filter(e => e.id !== exId) } : w
    ));
  };

  const totalExercises = workouts.reduce((sum, w) => sum + w.exercises.length, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!planName.trim() || workouts.length === 0 || totalExercises === 0) return;
    dispatch({
      type: 'ADD_PLAN',
      payload: {
        name: planName.trim(),
        workouts: workouts.map(w => ({
          name: w.name,
          muscleGroup: w.muscleGroup,
          exercises: w.exercises
        }))
      }
    });
    navigate('/');
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1rem' }}>תוכנית חדשה</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">שם התוכנית</label>
          <input
            className="form-input"
            value={planName}
            onChange={e => setPlanName(e.target.value)}
            placeholder='לדוגמה: תוכנית 4 ימים'
            required
          />
        </div>

        {/* Existing Workouts */}
        {workouts.map((w, wIdx) => (
          <div key={w.tempId} className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{w.name}</div>
                <div className="card-subtitle">{w.muscleGroup} · {w.exercises.length} תרגילים</div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingWorkoutIdx(editingWorkoutIdx === wIdx ? null : wIdx)}>
                  {editingWorkoutIdx === wIdx ? '▲' : '▼'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => removeWorkout(wIdx)}>🗑️</button>
              </div>
            </div>

            {/* Exercise list */}
            {w.exercises.map(ex => (
              <div key={ex.id} className="exercise-item">
                <div className="exercise-info">
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-detail">
                    {ex.sets} סטים × {ex.reps} חזרות{ex.weight > 0 && ` · ${ex.weight} ק"ג`}
                  </div>
                </div>
                <button type="button" className="btn btn-danger" onClick={() => removeExercise(wIdx, ex.id)}>הסר</button>
              </div>
            ))}

            {/* Inline exercise form when expanded */}
            {editingWorkoutIdx === wIdx && (
              <ExerciseForm onAdd={(ex) => addExerciseToWorkout(wIdx, ex)} />
            )}
          </div>
        ))}

        {/* Add Workout Form */}
        <div className="card" style={{ borderStyle: 'dashed', border: '1px dashed var(--border)' }}>
          <div className="card-title" style={{ marginBottom: '0.6rem' }}>הוסף אימון</div>
          <div className="form-group">
            <input
              className="form-input"
              value={wName}
              onChange={e => setWName(e.target.value)}
              placeholder='לדוגמה: יום חזה + יד קדמית'
            />
          </div>
          <div className="form-group">
            <label className="form-label">קבוצת שרירים</label>
            <select className="form-select" value={wMuscle} onChange={e => setWMuscle(e.target.value)}>
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
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
          ✅ שמור תוכנית
        </button>
      </form>
    </div>
  );
}
