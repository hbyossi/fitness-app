import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HomePage() {
  const { state, dispatch } = useWorkout();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);

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
                <div key={workout.id} style={{
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
                  <Link
                    to={`/workout/${plan.id}/${workout.id}`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  >
                    🏋️ התחל
                  </Link>
                </div>
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
