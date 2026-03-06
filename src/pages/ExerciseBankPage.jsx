import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { MUSCLE_GROUPS } from '../utils/helpers';
import ConfirmDialog from '../components/ConfirmDialog';
import { InstructionsFields, InstructionsToggle, normalizeInstructions, hasInstructions } from '../components/ExerciseInstructions';

export default function ExerciseBankPage() {
  const { state, dispatch } = useWorkout();
  const bank = state.exerciseBank || [];

  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState({ startingPosition: '', execution: '', tempo: '', notes: '' });
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [defaultSets, setDefaultSets] = useState('3');
  const [defaultReps, setDefaultReps] = useState('12');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editInstructions, setEditInstructions] = useState({ startingPosition: '', execution: '', tempo: '', notes: '' });
  const [editMuscle, setEditMuscle] = useState('');
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({
      type: 'ADD_BANK_EXERCISE',
      payload: {
        name: name.trim(),
        instructions,
        muscleGroup,
        defaultSets: parseInt(defaultSets) || 3,
        defaultReps: parseInt(defaultReps) || 12
      }
    });
    setName('');
    setInstructions({ startingPosition: '', execution: '', tempo: '', notes: '' });
    setDefaultSets('3');
    setDefaultReps('12');
  };

  const startEdit = (ex) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditInstructions(normalizeInstructions(ex.instructions));
    setEditMuscle(ex.muscleGroup);
    setEditSets(String(ex.defaultSets || 3));
    setEditReps(String(ex.defaultReps || 12));
  };

  const saveEdit = () => {
    if (!editName.trim()) return;
    dispatch({
      type: 'UPDATE_BANK_EXERCISE',
      payload: {
        id: editingId,
        name: editName.trim(),
        instructions: editInstructions,
        muscleGroup: editMuscle,
        defaultSets: parseInt(editSets) || 3,
        defaultReps: parseInt(editReps) || 12
      }
    });
    setEditingId(null);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_BANK_EXERCISE', payload: deleteId });
    setDeleteId(null);
  };

  const filtered = filter
    ? bank.filter(ex => ex.muscleGroup === filter)
    : bank;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">מאגר תרגילים</h1>
        <span className="badge badge-primary">{bank.length} תרגילים</span>
      </div>

      {/* Add Exercise Form */}
      <form onSubmit={handleAdd} className="card">
        <div className="card-title" style={{ marginBottom: '0.6rem' }}>תרגיל חדש</div>
        <div className="form-group">
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="שם התרגיל"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">קבוצת שרירים</label>
          <select className="form-select" value={muscleGroup} onChange={e => setMuscleGroup(e.target.value)}>
            {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">סטים ברירת מחדל</label>
            <input className="form-input" type="number" min="1" value={defaultSets} onChange={e => setDefaultSets(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">חזרות ברירת מחדל</label>
            <input className="form-input" type="number" min="1" value={defaultReps} onChange={e => setDefaultReps(e.target.value)} />
          </div>
        </div>
        <InstructionsFields value={instructions} onChange={setInstructions} />
        <button type="submit" className="btn btn-success btn-full" style={{ marginTop: '0.5rem' }}>✅ הוסף למאגר</button>
      </form>

      {/* Filter by muscle group */}
      {bank.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}>
          <button
            className="btn"
            onClick={() => setFilter('')}
            style={{
              background: !filter ? 'var(--primary)' : 'var(--bg-input)',
              fontSize: '0.75rem',
              padding: '0.3rem 0.6rem',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            הכל
          </button>
          {MUSCLE_GROUPS.map(g => {
            const count = bank.filter(ex => ex.muscleGroup === g).length;
            if (count === 0) return null;
            return (
              <button
                key={g}
                className="btn"
                onClick={() => setFilter(g === filter ? '' : g)}
                style={{
                  background: filter === g ? 'var(--primary)' : 'var(--bg-input)',
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.6rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {g} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Exercise List */}
      {filtered.map(ex => (
        <div key={ex.id} className="card">
          {editingId === ex.id ? (
            <div>
              <div className="form-group">
                <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <select className="form-select" value={editMuscle} onChange={e => setEditMuscle(e.target.value)}>
                  {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">סטים</label>
                  <input className="form-input" type="number" min="1" value={editSets} onChange={e => setEditSets(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">חזרות</label>
                  <input className="form-input" type="number" min="1" value={editReps} onChange={e => setEditReps(e.target.value)} />
                </div>
              </div>
              <InstructionsFields value={editInstructions} onChange={setEditInstructions} />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={saveEdit}>✅ שמור</button>
                <button className="btn btn-ghost" onClick={() => setEditingId(null)}>ביטול</button>
              </div>
            </div>
          ) : (
            <>
              <div className="card-header">
                <div>
                  <div className="card-title">{ex.name}</div>
                  <div className="card-subtitle">
                    {ex.muscleGroup} · {ex.defaultSets || 3}×{ex.defaultReps || 12}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn btn-ghost" onClick={() => startEdit(ex)}>✏️</button>
                  <button className="btn btn-ghost" onClick={() => setDeleteId(ex.id)}>🗑️</button>
                </div>
              </div>
              {hasInstructions(ex.instructions) && (
                <div style={{ marginTop: '0.3rem' }}><InstructionsToggle instructions={ex.instructions} /></div>
              )}
            </>
          )}
        </div>
      ))}

      {bank.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <div className="empty-text">המאגר ריק — הוסף תרגילים כדי לשמור אותם לשימוש חוזר</div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="מחיקת תרגיל"
          text="האם למחוק את התרגיל מהמאגר?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
