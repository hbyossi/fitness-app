import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import ConfirmDialog from '../components/ConfirmDialog';

function AddExerciseForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('12');
  const [weight, setWeight] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      sets: parseInt(sets) || 3,
      reps: parseInt(reps) || 12,
      weight: parseFloat(weight) || 0
    });
  };

  return (
    <div style={{ marginTop: '0.5rem', padding: '0.6rem', background: 'var(--bg-card)', borderRadius: 8 }}>
      <div className="form-group">
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="שם התרגיל" />
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label className="form-label">סטים</label>
          <input className="form-input" type="number" min="1" value={sets} onChange={e => setSets(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">חזרות</label>
          <input className="form-input" type="number" min="1" value={reps} onChange={e => setReps(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">משקל (ק&quot;ג)</label>
          <input className="form-input" type="number" min="0" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button type="button" className="btn btn-success" style={{ flex: 1 }} onClick={handleSubmit}>✅ הוסף</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>ביטול</button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { state, dispatch } = useWorkout();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);
  const [addingExercise, setAddingExercise] = useState(null); // { planId, workoutId }

  const handleAddExercise = (exercise) => {
    dispatch({
      type: 'ADD_EXERCISE',
      payload: { planId: addingExercise.planId, workoutId: addingExercise.workoutId, exercise }
    });
    setAddingExercise(null);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_PLAN', payload: deleteId });
    setDeleteId(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">התוכניות שלי</h1>
        <span className="badge badge-primary">{state.plans.length} תוכניות</span>
      </div>

      {state.plans.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💪</div>
          <div className="empty-text">אין תוכניות אימון עדיין</div>
          <Link to="/create" className="btn btn-primary">צור תוכנית חדשה</Link>
        </div>
      ) : (
        state.plans.map(plan => (
          <div key={plan.id} className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{plan.name}</div>
                <div className="card-subtitle">
                  {plan.workouts.length} אימונים
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(`/edit/${plan.id}`)}
                  title="ערוך"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setDeleteId(plan.id)}
                  title="מחק"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* List workouts inside the plan */}
            <div style={{ marginTop: '0.4rem' }}>
              {plan.workouts.map(workout => (
                <React.Fragment key={workout.id}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-input)',
                    borderRadius: 8,
                    padding: '0.6rem 0.8rem',
                    marginBottom: '0.4rem'
                  }}>
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
                        onClick={() => setAddingExercise(
                          addingExercise?.workoutId === workout.id ? null : { planId: plan.id, workoutId: workout.id }
                        )}
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
                    <AddExerciseForm
                      onAdd={handleAddExercise}
                      onCancel={() => setAddingExercise(null)}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))
      )}

      {deleteId && (
        <ConfirmDialog
          title="מחיקת תוכנית"
          text="האם למחוק את התוכנית? לא ניתן לשחזר."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
