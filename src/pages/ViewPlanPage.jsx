import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { InstructionsToggle, hasInstructions } from '../components/ExerciseInstructions';

export default function ViewPlanPage() {
  const { planId } = useParams();
  const { state } = useWorkout();
  const plan = state.plans.find(p => p.id === planId);

  if (!plan) {
    return (
      <div className="empty-state">
        <div className="empty-icon">❌</div>
        <div className="empty-text">תוכנית לא נמצאה</div>
      </div>
    );
  }

  const totalExercises = plan.workouts.reduce((sum, w) => sum + w.exercises.length, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{plan.name}</h1>
          <div className="card-subtitle">{plan.workouts.length} אימונים · {totalExercises} תרגילים</div>
        </div>
        <Link to={`/edit/${plan.id}`} className="btn btn-ghost" title="ערוך">✏️</Link>
      </div>

      {plan.workouts.map(workout => (
        <div key={workout.id} className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{workout.name}</div>
              <div className="card-subtitle">{workout.muscleGroup} · {workout.exercises.length} תרגילים</div>
            </div>
            <Link
              to={`/workout/${plan.id}/${workout.id}`}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
            >
              🏋️ התחל
            </Link>
          </div>

          {workout.exercises.map((ex, idx) => (
            <div key={ex.id} className="exercise-item">
              <div className="exercise-info">
                <div className="exercise-name">
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>{idx + 1}.</span>
                  {ex.name}
                </div>
                <div className="exercise-detail">
                  {ex.sets} סטים × {ex.reps} חזרות{ex.weight > 0 && ` · ${ex.weight} ק"ג`}
                </div>
                {hasInstructions(ex.instructions) && <InstructionsToggle instructions={ex.instructions} />}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
