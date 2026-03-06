import React, { useState } from 'react';

const SECTIONS = [
  { key: 'startingPosition', label: 'עמידת מוצא', icon: '🧍', placeholder: 'לדוגמה: עמידה ברוחב כתפיים, ידיים על המוט...' },
  { key: 'execution', label: 'הוראות ביצוע', icon: '🏋️', placeholder: 'לדוגמה: לרדת לאט עד 90 מעלות, לדחוף חזרה למעלה...' },
  { key: 'tempo', label: 'קצב', icon: '⏱️', placeholder: 'לדוגמה: 3 שניות ירידה, 1 שנייה עצירה, 2 שניות עלייה' },
  { key: 'notes', label: 'דגשים חשובים', icon: '⚠️', placeholder: 'לדוגמה: לשמור על גב ישר, לא לנעול ברכיים...' },
];

export function hasInstructions(instructions) {
  if (!instructions) return false;
  if (typeof instructions === 'string') return instructions.trim().length > 0;
  return Object.values(instructions).some(v => v && v.trim());
}

function emptyInstructions() {
  return { startingPosition: '', execution: '', tempo: '', notes: '' };
}

export function normalizeInstructions(instructions) {
  if (!instructions) return emptyInstructions();
  if (typeof instructions === 'string') {
    return { ...emptyInstructions(), execution: instructions };
  }
  return { ...emptyInstructions(), ...instructions };
}

export function InstructionsDisplay({ instructions }) {
  if (!hasInstructions(instructions)) return null;
  const data = normalizeInstructions(instructions);

  return (
    <div className="instructions-sections">
      {SECTIONS.map(({ key, label, icon }) =>
        data[key]?.trim() ? (
          <div key={key} className="instruction-section">
            <div className="instruction-section-label">{icon} {label}</div>
            <div className="instruction-section-text">{data[key]}</div>
          </div>
        ) : null
      )}
    </div>
  );
}

export function InstructionsFields({ value, onChange }) {
  const [open, setOpen] = useState(() => hasInstructions(value));
  const data = normalizeInstructions(value);

  const update = (key, val) => {
    onChange({ ...data, [key]: val });
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-ghost"
        style={{ fontSize: '0.85rem', marginBottom: open ? '0.4rem' : 0 }}
        onClick={() => setOpen(!open)}
      >
        📋 הוראות ביצוע {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="instructions-form-sections">
          {SECTIONS.map(({ key, label, icon, placeholder }) => (
            <div key={key} className="form-group">
              <label className="form-label">{icon} {label}</label>
              <textarea
                className="form-input"
                value={data[key] || ''}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                rows={2}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
