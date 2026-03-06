import React, { useState } from 'react';
import type { Instructions } from '../types';

interface Section {
  key: keyof Instructions;
  label: string;
  icon: string;
  placeholder: string;
}

const SECTIONS: Section[] = [
  {
    key: 'startingPosition',
    label: 'עמידת מוצא',
    icon: '🧍',
    placeholder: 'לדוגמה: עמידה ברוחב כתפיים, ידיים על המוט...',
  },
  {
    key: 'execution',
    label: 'הוראות ביצוע',
    icon: '🏋️',
    placeholder: 'לדוגמה: לרדת לאט עד 90 מעלות, לדחוף חזרה למעלה...',
  },
  { key: 'tempo', label: 'קצב', icon: '⏱️', placeholder: 'לדוגמה: 3 שניות ירידה, 1 שנייה עצירה, 2 שניות עלייה' },
  { key: 'notes', label: 'דגשים חשובים', icon: '⚠️', placeholder: 'לדוגמה: לשמור על גב ישר, לא לנעול ברכיים...' },
];

export function hasInstructions(instructions: Instructions | string | undefined | null): boolean {
  if (!instructions) return false;
  if (typeof instructions === 'string') return instructions.trim().length > 0;
  return Object.values(instructions).some((v) => v && v.trim());
}

function emptyInstructions(): Instructions {
  return { startingPosition: '', execution: '', tempo: '', notes: '' };
}

export function normalizeInstructions(instructions: Instructions | string | undefined | null): Instructions {
  if (!instructions) return emptyInstructions();
  if (typeof instructions === 'string') {
    return { ...emptyInstructions(), execution: instructions };
  }
  return { ...emptyInstructions(), ...instructions };
}

export function InstructionsDisplay({ instructions }: { instructions: Instructions | string }) {
  if (!hasInstructions(instructions)) return null;
  const data = normalizeInstructions(instructions);

  return (
    <div className="instructions-sections">
      {SECTIONS.map(({ key, label, icon }) =>
        data[key]?.trim() ? (
          <div key={key} className="instruction-section">
            <div className="instruction-section-label">
              {icon} {label}
            </div>
            <div className="instruction-section-text">{data[key]}</div>
          </div>
        ) : null,
      )}
    </div>
  );
}

export function InstructionsToggle({ instructions }: { instructions: Instructions | string }) {
  const [open, setOpen] = useState(false);
  if (!hasInstructions(instructions)) return null;

  return (
    <div>
      <button type="button" className="instructions-link" onClick={() => setOpen(!open)}>
        📋 {open ? 'הסתר הוראות' : 'הצג הוראות'}
      </button>
      {open && <InstructionsDisplay instructions={instructions} />}
    </div>
  );
}

export function InstructionsFields({
  value,
  onChange,
}: {
  value: Instructions | string | undefined | null;
  onChange: (v: Instructions) => void;
}) {
  const [open, setOpen] = useState(() => hasInstructions(value));
  const data = normalizeInstructions(value);

  const update = (key: keyof Instructions, val: string) => {
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
              <label className="form-label">
                {icon} {label}
              </label>
              <textarea
                className="form-input"
                value={data[key] || ''}
                onChange={(e) => update(key, e.target.value)}
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
