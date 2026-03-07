import React, { useState } from 'react';
import { generateId } from '../utils/helpers';
import { InstructionsFields, normalizeInstructions } from './ExerciseInstructions';
import type { Exercise, Instructions, BankExercise } from '../types';

interface ExerciseFormProps {
  onAdd: (ex: Exercise) => void;
  exerciseBank: BankExercise[];
  /** Show cancel button and use compact style (used in HomePage inline add) */
  compact?: boolean;
  onCancel?: () => void;
}

export default function ExerciseForm({ onAdd, exerciseBank, compact, onCancel }: ExerciseFormProps) {
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('12');
  const [exWeight, setExWeight] = useState('');
  const [exRestTime, setExRestTime] = useState('90');
  const [exInstructions, setExInstructions] = useState<Instructions>({
    startingPosition: '',
    execution: '',
    tempo: '',
    notes: '',
  });
  const [bankSearch, setBankSearch] = useState('');

  const pickFromBank = (id: string) => {
    if (!id) return;
    const ex = exerciseBank.find((e) => e.id === id);
    if (!ex) return;
    setExName(ex.name);
    setExInstructions(normalizeInstructions(ex.instructions));
    setExSets(String(ex.defaultSets || 3));
    setExReps(String(ex.defaultReps || 12));
    setBankSearch('');
  };

  const filteredBank = bankSearch
    ? exerciseBank.filter((ex) => ex.name.includes(bankSearch) || ex.muscleGroup.includes(bankSearch))
    : exerciseBank;

  const handleAdd = () => {
    if (!exName.trim()) return;
    onAdd({
      id: generateId(),
      name: exName.trim(),
      sets: parseInt(exSets) || 3,
      reps: parseInt(exReps) || 12,
      weight: parseFloat(exWeight) || 0,
      restTime: parseInt(exRestTime) || 90,
      instructions: exInstructions,
    });
    setExName('');
    setExWeight('');
    setExRestTime('90');
    setExInstructions({ startingPosition: '', execution: '', tempo: '', notes: '' });
  };

  return (
    <div
      style={
        compact
          ? { marginTop: '0.5rem', padding: '0.6rem', background: 'var(--bg-card)', borderRadius: 8 }
          : { marginTop: '0.5rem' }
      }
    >
      {exerciseBank.length > 0 && (
        <div className="form-group">
          <label className="form-label">בחר מהמאגר</label>
          <input
            className="form-input"
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            placeholder="חפש תרגיל..."
            style={{ marginBottom: '0.3rem' }}
          />
          <select className="form-select" onChange={(e) => pickFromBank(e.target.value)} value="">
            <option value="">בחר תרגיל...</option>
            {filteredBank.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscleGroup})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="form-group">
        <input
          className="form-input"
          value={exName}
          onChange={(e) => setExName(e.target.value)}
          placeholder="שם התרגיל"
        />
      </div>
      <div className="form-row-3">
        <div className="form-group">
          <label className="form-label">סטים</label>
          <input
            className="form-input"
            type="number"
            min="1"
            value={exSets}
            onChange={(e) => setExSets(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">חזרות</label>
          <input
            className="form-input"
            type="number"
            min="1"
            value={exReps}
            onChange={(e) => setExReps(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">משקל (ק&quot;ג)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.5"
            value={exWeight}
            onChange={(e) => setExWeight(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      {!compact && (
        <div className="form-group">
          <label className="form-label">⏱️ מנוחה (שניות)</label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="5"
            value={exRestTime}
            onChange={(e) => setExRestTime(e.target.value)}
          />
        </div>
      )}
      <InstructionsFields value={exInstructions} onChange={setExInstructions} />
      {compact ? (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-success" style={{ flex: 1 }} onClick={handleAdd}>
            ✅ הוסף
          </button>
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              ביטול
            </button>
          )}
        </div>
      ) : (
        <button type="button" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }} onClick={handleAdd}>
          ➕ הוסף תרגיל
        </button>
      )}
    </div>
  );
}
