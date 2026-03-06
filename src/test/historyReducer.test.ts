import { describe, it, expect } from 'vitest';
import { historyReducer } from '../context/HistoryContext';
import type { HistoryEntry, HistoryAction } from '../types';

const makeEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: 'h-1',
  planId: 'plan-1',
  planName: 'Plan A',
  workoutName: 'Day 1',
  date: '2025-01-01T10:00:00.000Z',
  exercises: [{ name: 'Bench Press', sets: [{ weight: 60, reps: 10, done: true }] }],
  duration: 3600,
  ...overrides,
});

describe('historyReducer', () => {
  it('LOG_WORKOUT prepends a new entry with generated ID', () => {
    const state = [makeEntry()];
    const action: HistoryAction = {
      type: 'LOG_WORKOUT',
      payload: {
        planId: 'plan-1',
        planName: 'Plan A',
        workoutName: 'Day 2',
        exercises: [{ name: 'Squat', sets: [{ weight: 80, reps: 8, done: true }] }],
        duration: 2400,
      },
    };
    const result = historyReducer(state, action);
    expect(result).toHaveLength(2);
    expect(result[0].workoutName).toBe('Day 2');
    expect(result[0].id).toBeTruthy();
    expect(result[0].id).not.toBe('h-1');
    // New entry is first (prepended)
    expect(result[1].id).toBe('h-1');
  });

  it('DELETE_HISTORY removes matching entry', () => {
    const state = [makeEntry(), makeEntry({ id: 'h-2' })];
    const result = historyReducer(state, { type: 'DELETE_HISTORY', payload: 'h-1' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('h-2');
  });

  it('IMPORT_HISTORY replaces entire state', () => {
    const state = [makeEntry()];
    const imported = [makeEntry({ id: 'imported' })];
    const result = historyReducer(state, { type: 'IMPORT_HISTORY', payload: imported });
    expect(result).toBe(imported);
  });
});
