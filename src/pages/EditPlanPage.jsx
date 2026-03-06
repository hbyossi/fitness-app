import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { MUSCLE_GROUPS, generateId } from '../utils/helpers';
import { InstructionsFields, InstructionsToggle, hasInstructions, normalizeInstructions } from '../components/ExerciseInstructions';

function ExerciseForm({ onAdd, exerciseBank }) {
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('12');
  const [exWeight, setExWeight] = useState('');
  const [exInstructions, setExInstructions] = useState({ startingPosition: '', execution: '', tempo: '', notes: '' });

  const pickFromBank = (id) => {
    const ex = exerciseBank.find(e => e.id === id);
    if (!ex) return;
    setExName(ex.name);
    setExInstructions(normalizeInstructions(ex.instructions));
    setExSets(String(ex.defaultSets || 3));
    setExReps(String(ex.defaultReps || 12));
  };

  const handleAdd = () => {
    if (!exName.trim()) return;
    onAdd({
      id: generateId(),
      name: exName.trim(),
      sets: parseInt(exSets) || 3,
      reps: parseInt(exReps) || 12,
      weight: parseFloat(exWeight) || 0,
      instructions: exInstructions
    });
    setExName('');
    setExWeight('');
    setExInstructions({ startingPosition: '', execution: '', tempo: '', notes: '' });
  };

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {exerciseBank.length > 0 && (
        <div className="form-group">
          <label className="form-label">בחר מהמאגר</label>
          <select className="form-select" onChange={e => pickFromBank(e.target.value)} value="">
            <option value="">בחר תרגיל...</option>
            {exerciseBank.map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscleGroup})</option>)}
          </select>
        </div>
      )}
      <div className="form-group">
        <input className="form-input" value={exName} onChange={e => setExName(e.target.value)} placeholder="שם התרגיל" />
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
      <InstructionsFields value={exInstructions} onChange={setExInstructions} />
      <button type="button" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }} onClick={handleAdd}>➕ הוסף תרגיל</button>
    </div>
  );
}

export default function EditPlanPage() {
  const { planId } = useParams();
  const { state, dispatch } = useWorkout();
  const navigate = useNavigate();

  const plan = state.plans.find(p => p.id === planId);
  const exerciseBank = state.exerciseBank || [];

  const [planName, setPlanName] = useState(plan?.name || '');
  const [workouts, setWorkouts] = useState(() =>
    (plan?.workouts || []).map(w => ({ ...w, tempId: w.id || generateId() }))
  );

  const [wName, setWName] = useState('');
  const [wMuscle, setWMuscle] = useState(MUSCLE_GROUPS[0]);
  const [editingWorkoutIdx, setEditingWorkoutIdx] = useState(null);

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
      type: 'UPDATE_PLAN',
      payload: {
        id: planId,
        name: planName.trim(),
        workouts: workouts.map(w => ({
          id: w.id || w.tempId,
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
      <h1 className="page-title" style={{ marginBottom: '1rem' }}>עריכת תוכנית</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">שם התוכנית</label>
          <input className="form-input" value={planName} onChange={e => setPlanName(e.target.value)} required />
        </div>

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

            {w.exercises.map(ex => (
              <div key={ex.id} className="exercise-item">
                <div className="exercise-info">
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-detail">
                    {ex.sets} סטים × {ex.reps} חזרות{ex.weight > 0 && ` · ${ex.weight} ק"ג`}
                  </div>
                  {hasInstructions(ex.instructions) && <InstructionsToggle instructions={ex.instructions} />}
                </div>
                <button type="button" className="btn btn-danger" onClick={() => removeExercise(wIdx, ex.id)}>הסר</button>
              </div>
            ))}

            {editingWorkoutIdx === wIdx && (
              <ExerciseForm onAdd={(ex) => addExerciseToWorkout(wIdx, ex)} exerciseBank={exerciseBank} />
            )}
          </div>
        ))}

        {/* Add Workout */}
        <div className="card" style={{ border: '1px dashed var(--border)' }}>
          <div className="card-title" style={{ marginBottom: '0.6rem' }}>הוסף אימון</div>
          <div className="form-group">
            <input className="form-input" value={wName} onChange={e => setWName(e.target.value)} placeholder='לדוגמה: יום רגליים' />
          </div>
          <div className="form-group">
            <label className="form-label">קבוצת שרירים</label>
            <select className="form-select" value={wMuscle} onChange={e => setWMuscle(e.target.value)}>
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button type="button" className="btn btn-primary btn-full" onClick={addWorkout}>➕ הוסף אימון</button>
        </div>

        <button type="submit" className="btn btn-success btn-full" style={{ marginTop: '0.5rem' }} disabled={!planName.trim() || workouts.length === 0 || totalExercises === 0}>
          ✅ שמור שינויים
        </button>
      </form>
    </div>
  );
}
