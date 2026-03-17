import { describe, it, expect } from 'vitest';
import { bankReducer } from '../context/BankContext';
import type { BankExercise, BankAction } from '../types';

const makeBank = (overrides: Partial<BankExercise> = {}): BankExercise => ({
  id: 'b-1',
  name: 'Bench Press',
  instructions: { startingPosition: '', execution: '', tempo: '', notes: '' },
  muscleGroup: 'חזה',
  defaultSets: 3,
  defaultReps: 12,
  ...overrides,
});

describe('bankReducer', () => {
  it('ADD_BANK_EXERCISE appends with generated ID', () => {
    const state: BankExercise[] = [];
    const action: BankAction = {
      type: 'ADD_BANK_EXERCISE',
      payload: {
        name: 'Squat',
        instructions: { startingPosition: '', execution: '', tempo: '', notes: '' },
        muscleGroup: 'רגליים',
        defaultSets: 4,
        defaultReps: 8,
      },
    };
    const result = bankReducer(state, action);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Squat');
    expect(result[0].id).toBeTruthy();
  });

  it('UPDATE_BANK_EXERCISE updates matching exercise', () => {
    const state = [makeBank()];
    const result = bankReducer(state, {
      type: 'UPDATE_BANK_EXERCISE',
      payload: { id: 'b-1', name: 'Incline Bench' },
    });
    expect(result[0].name).toBe('Incline Bench');
    expect(result[0].muscleGroup).toBe('חזה');
  });

  it('DELETE_BANK_EXERCISE removes matching exercise', () => {
    const state = [makeBank(), makeBank({ id: 'b-2', name: 'Squat' })];
    const result = bankReducer(state, { type: 'DELETE_BANK_EXERCISE', payload: 'b-1' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b-2');
  });

  it('IMPORT_BANK replaces entire state', () => {
    const state = [makeBank()];
    const imported = [makeBank({ id: 'imported' })];
    const result = bankReducer(state, { type: 'IMPORT_BANK', payload: imported });
    expect(result).toBe(imported);
  });

  it('MERGE_BANK adds only exercises with new IDs', () => {
    const existing = makeBank({ id: 'b-1', name: 'Bench Press' });
    const duplicate = makeBank({ id: 'b-1', name: 'Duplicate Bench' });
    const newEx = makeBank({ id: 'b-2', name: 'Squat' });
    const result = bankReducer([existing], { type: 'MERGE_BANK', payload: [duplicate, newEx] });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Bench Press');
    expect(result[1].name).toBe('Squat');
  });

  it('MERGE_BANK with empty payload returns state unchanged', () => {
    const state = [makeBank()];
    const result = bankReducer(state, { type: 'MERGE_BANK', payload: [] });
    expect(result).toEqual(state);
  });

  it('RESTORE_BANK_EXERCISE appends the exercise', () => {
    const state = [makeBank()];
    const restored = makeBank({ id: 'b-restored', name: 'Restored Curl' });
    const result = bankReducer(state, { type: 'RESTORE_BANK_EXERCISE', payload: restored });
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe('b-restored');
    expect(result[1].name).toBe('Restored Curl');
  });
});
