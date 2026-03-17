import { describe, it, expect } from 'vitest';
import { validateImportData } from '../utils/storage';

describe('validateImportData', () => {
  it('accepts valid data', () => {
    const data = {
      plans: [{ id: 'p1', name: 'A', workouts: [{ id: 'w1', name: 'W', exercises: [] }] }],
      history: [],
      exerciseBank: [],
    };
    expect(validateImportData(data)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateImportData(null)).toBe(false);
  });

  it('rejects missing plans array', () => {
    expect(validateImportData({ history: [] })).toBe(false);
  });

  it('rejects invalid plan structure', () => {
    expect(validateImportData({ plans: [{ name: 'A' }] })).toBe(false);
  });

  it('rejects non-array exerciseBank', () => {
    const data = { plans: [], exerciseBank: 'not-array' };
    expect(validateImportData(data)).toBe(false);
  });

  it('accepts data without exerciseBank (older exports)', () => {
    const data = { plans: [] };
    expect(validateImportData(data)).toBe(true);
  });

  it('migrates v0 data: adds exerciseBank', () => {
    const data = { plans: [], history: [] };
    validateImportData(data);
    expect(data).toHaveProperty('exerciseBank');
    expect(Array.isArray((data as any).exerciseBank)).toBe(true);
  });

  it('migrates v1 data: adds restTime and structures instructions', () => {
    const data = {
      _version: 1,
      plans: [
        {
          id: 'p1',
          name: 'Plan',
          workouts: [
            {
              id: 'w1',
              name: 'W',
              exercises: [
                { id: 'e1', name: 'Bench', sets: 3, reps: 10, weight: 60, instructions: 'do it' },
              ],
            },
          ],
        },
      ],
      exerciseBank: [],
    };
    validateImportData(data);
    const ex = (data as any).plans[0].workouts[0].exercises[0];
    expect(ex.restTime).toBe(90);
    expect(typeof ex.instructions).toBe('object');
    expect(ex.instructions.execution).toBe('do it');
    expect(ex.instructions.startingPosition).toBe('');
  });

  it('sets _version to current after migration', () => {
    const data = { plans: [] };
    validateImportData(data);
    expect((data as any)._version).toBe(3);
  });

  it('migrates exercises with no instructions (undefined)', () => {
    const data = {
      _version: 1,
      plans: [
        {
          id: 'p1',
          name: 'Plan',
          workouts: [
            {
              id: 'w1',
              name: 'W',
              exercises: [
                { id: 'e1', name: 'Squat', sets: 3, reps: 10, weight: 80 },
              ],
            },
          ],
        },
      ],
      exerciseBank: [],
    };
    validateImportData(data);
    const ex = (data as any).plans[0].workouts[0].exercises[0];
    expect(ex.instructions).toEqual({
      startingPosition: '',
      execution: '',
      tempo: '',
      notes: '',
    });
  });

  it('ensures history array exists after v1 migration', () => {
    const data = { _version: 1, plans: [], exerciseBank: [] };
    validateImportData(data);
    expect(Array.isArray((data as any).history)).toBe(true);
  });

  it('rejects non-object input', () => {
    expect(validateImportData(42)).toBe(false);
    expect(validateImportData('string')).toBe(false);
    expect(validateImportData(undefined)).toBe(false);
  });

  it('rejects plan missing workouts array', () => {
    expect(validateImportData({ plans: [{ id: 'p1', name: 'A' }] })).toBe(false);
  });

  it('rejects workout missing exercises array', () => {
    const data = {
      plans: [{ id: 'p1', name: 'A', workouts: [{ id: 'w1', name: 'W' }] }],
    };
    expect(validateImportData(data)).toBe(false);
  });
});
