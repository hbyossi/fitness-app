import React, { useState } from 'react';
import { useBank, usePlans } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { MUSCLE_GROUPS, formatReps, parseReps } from '../utils/helpers';
import UndoToast from '../components/UndoToast';
import {
  InstructionsFields,
  InstructionsToggle,
  normalizeInstructions,
  hasInstructions,
} from '../components/ExerciseInstructions';
import { suggestInstructions } from '../utils/exerciseInstructionsDb';
import { fetchClaudeInstructions, hasApiKey } from '../utils/claudeInstructions';
import type { Instructions, BankExercise } from '../types';

export default function ExerciseBankPage() {
  const { exerciseBank, dispatchBank } = useBank();
  const { dispatchPlans } = usePlans();
  const { user } = useAuth();
  const bank = exerciseBank;

  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState<Instructions>({
    startingPosition: '',
    execution: '',
    tempo: '',
    notes: '',
  });
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [defaultSets, setDefaultSets] = useState('3');
  const [defaultReps, setDefaultReps] = useState('12');
  const [bodyweight, setBodyweight] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editInstructions, setEditInstructions] = useState<Instructions>({
    startingPosition: '',
    execution: '',
    tempo: '',
    notes: '',
  });
  const [editMuscle, setEditMuscle] = useState('');
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editBodyweight, setEditBodyweight] = useState(false);

  const [deletedExercise, setDeletedExercise] = useState<BankExercise | null>(null);
  const [filter, setFilter] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [editAiLoading, setEditAiLoading] = useState(false);

  const handleAI = async () => {
    if (!name.trim() || !user) return;
    setAiLoading(true);
    try {
      const result = await fetchClaudeInstructions(name.trim(), user.uid);
      if (result) setInstructions(result);
      else alert('לא הצלחתי לייצר הוראות. ודא שה-API Key מוגדר ב-.env.local');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditAI = async () => {
    if (!editName.trim() || !user) return;
    setEditAiLoading(true);
    try {
      const result = await fetchClaudeInstructions(editName.trim(), user.uid);
      if (result) setEditInstructions(result);
      else alert('לא הצלחתי לייצר הוראות. ודא שה-API Key מוגדר ב-.env.local');
    } finally {
      setEditAiLoading(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { reps, repsMax } = parseReps(defaultReps);
    dispatchBank({
      type: 'ADD_BANK_EXERCISE',
      payload: {
        name: name.trim(),
        instructions,
        muscleGroup,
        defaultSets: parseInt(defaultSets) || 3,
        defaultReps: reps,
        ...(repsMax ? { defaultRepsMax: repsMax } : {}),
        ...(bodyweight ? { bodyweight: true } : {}),
      },
    });
    setName('');
    setInstructions({ startingPosition: '', execution: '', tempo: '', notes: '' });
    setDefaultSets('3');
    setDefaultReps('12');
    setBodyweight(false);
  };

  const startEdit = (ex: BankExercise) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditInstructions(normalizeInstructions(ex.instructions));
    setEditMuscle(ex.muscleGroup);
    setEditSets(String(ex.defaultSets || 3));
    setEditReps(formatReps(ex.defaultReps || 12, ex.defaultRepsMax));
    setEditBodyweight(ex.bodyweight || false);
  };

  const saveEdit = () => {
    if (!editName.trim() || !editingId) return;
    const { reps, repsMax } = parseReps(editReps);
    dispatchBank({
      type: 'UPDATE_BANK_EXERCISE',
      payload: {
        id: editingId,
        name: editName.trim(),
        instructions: editInstructions,
        muscleGroup: editMuscle,
        defaultSets: parseInt(editSets) || 3,
        defaultReps: reps,
        ...(repsMax ? { defaultRepsMax: repsMax } : {}),
        bodyweight: editBodyweight || undefined,
      },
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const ex = bank.find((e) => e.id === id);
    if (!ex) return;
    dispatchBank({ type: 'DELETE_BANK_EXERCISE', payload: id });
    dispatchPlans({ type: 'REMOVE_EXERCISES_BY_NAME', payload: ex.name });
    setDeletedExercise(ex);
  };

  const handleUndoDelete = () => {
    if (deletedExercise) {
      dispatchBank({ type: 'RESTORE_BANK_EXERCISE', payload: deletedExercise });
      setDeletedExercise(null);
    }
  };

  const filtered = filter ? bank.filter((ex) => ex.muscleGroup === filter) : bank;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">מאגר תרגילים</h1>
        <span className="badge badge-primary">{bank.length} תרגילים</span>
      </div>

      {/* Add Exercise Form */}
      <form onSubmit={handleAdd} className="card">
        <div className="card-title" style={{ marginBottom: '0.6rem' }}>
          תרגיל חדש
        </div>
        <div className="form-group">
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם התרגיל"
            required
          />
          {name.trim() && (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
              {!hasInstructions(instructions) && suggestInstructions(name) && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.78rem', color: 'var(--warning)' }}
                  onClick={() => { const s = suggestInstructions(name); if (s) setInstructions(s); }}
                >
                  💡 הצע מקומי
                </button>
              )}
              {hasApiKey() && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '0.78rem', color: 'var(--primary)', opacity: aiLoading ? 0.6 : 1 }}
                  disabled={aiLoading}
                  onClick={handleAI}
                >
                  {aiLoading ? '⏳ מייצר...' : hasInstructions(instructions) ? '✨ שפר עם Claude' : '🤖 צור עם Claude'}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">קבוצת שרירים</label>
          <select className="form-select" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="bank-bodyweight"
            checked={bodyweight}
            onChange={(e) => setBodyweight(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="bank-bodyweight" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
            🏃 תרגיל משקל גוף
          </label>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">סטים ברירת מחדל</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={defaultSets}
              onChange={(e) => setDefaultSets(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">חזרות ברירת מחדל</label>
            <input
              className="form-input"
              type="text"
              value={defaultReps}
              onChange={(e) => setDefaultReps(e.target.value)}
              placeholder="12 או 8-12"
            />
          </div>
        </div>
        <InstructionsFields value={instructions} onChange={setInstructions} />
        <button type="submit" className="btn btn-success btn-full" style={{ marginTop: '0.5rem' }}>
          ✅ הוסף למאגר
        </button>
      </form>

      {/* Filter by muscle group */}
      {bank.length > 0 && (
        <div
          style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.3rem', marginBottom: '0.8rem' }}
        >
          <button
            className="btn"
            onClick={() => setFilter('')}
            style={{
              background: !filter ? 'var(--primary)' : 'var(--bg-input)',
              fontSize: '0.75rem',
              padding: '0.3rem 0.6rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            הכל
          </button>
          {MUSCLE_GROUPS.map((g) => {
            const count = bank.filter((ex) => ex.muscleGroup === g).length;
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
                  flexShrink: 0,
                }}
              >
                {g} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Exercise List */}
      {filtered.map((ex) => (
        <div key={ex.id} className="card">
          {editingId === ex.id ? (
            <div>
              <div className="form-group">
                <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="form-group">
                <select className="form-select" value={editMuscle} onChange={(e) => setEditMuscle(e.target.value)}>
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="edit-bodyweight"
                  checked={editBodyweight}
                  onChange={(e) => setEditBodyweight(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="edit-bodyweight" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                  🏃 תרגיל משקל גוף
                </label>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">סטים</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={editSets}
                    onChange={(e) => setEditSets(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">חזרות</label>
                  <input
                    className="form-input"
                    type="text"
                    value={editReps}
                    onChange={(e) => setEditReps(e.target.value)}
                    placeholder="8-12"
                  />
                </div>
              </div>
              {hasApiKey() && editName.trim() && (
                <div style={{ marginBottom: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.78rem', color: 'var(--primary)', opacity: editAiLoading ? 0.6 : 1 }}
                    disabled={editAiLoading}
                    onClick={handleEditAI}
                  >
                    {editAiLoading ? '⏳ מייצר...' : hasInstructions(editInstructions) ? '✨ שפר עם Claude' : '🤖 צור עם Claude'}
                  </button>
                </div>
              )}
              <InstructionsFields value={editInstructions} onChange={setEditInstructions} />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={saveEdit}>
                  ✅ שמור
                </button>
                <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card-header">
                <div>
                  <div className="card-title">{ex.name}</div>
                  <div className="card-subtitle">
                    {ex.muscleGroup} · {ex.defaultSets || 3}×{formatReps(ex.defaultReps || 12, ex.defaultRepsMax)}
                    {ex.bodyweight && <span style={{ color: 'var(--primary-light)', fontWeight: 600, marginRight: '0.4rem' }}> · 🏃 BW</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn btn-ghost" onClick={() => startEdit(ex)}>
                    ✏️
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(ex.id)}>
                    🗑️
                  </button>
                </div>
              </div>
              {hasInstructions(ex.instructions) && (
                <div style={{ marginTop: '0.3rem' }}>
                  <InstructionsToggle instructions={ex.instructions} />
                </div>
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

      {deletedExercise && (
        <UndoToast
          message={`"${deletedExercise.name}" נמחק מהמאגר`}
          onUndo={handleUndoDelete}
          onDismiss={() => setDeletedExercise(null)}
        />
      )}
    </div>
  );
}
