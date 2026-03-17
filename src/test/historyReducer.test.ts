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

  it('CLEAR_ALL_HISTORY returns empty array', () => {
    const state = [makeEntry(), makeEntry({ id: 'h-2' })];
    const result = historyReducer(state, { type: 'CLEAR_ALL_HISTORY' });
    expect(result).toEqual([]);
  });

  it('MERGE_HISTORY adds new entries and re-sorts by date', () => {
    const older = makeEntry({ id: 'h-1', date: '2025-01-01T10:00:00.000Z' });
    const newer = makeEntry({ id: 'h-2', date: '2025-06-15T10:00:00.000Z' });
    const result = historyReducer([older], { type: 'MERGE_HISTORY', payload: [newer] });
    expect(result).toHaveLength(2);
    // Newest first
    expect(result[0].id).toBe('h-2');
    expect(result[1].id).toBe('h-1');
  });

  it('MERGE_HISTORY skips entries with duplicate IDs', () => {
    const existing = makeEntry({ id: 'h-1', planName: 'Original' });
    const duplicate = makeEntry({ id: 'h-1', planName: 'Duplicate' });
    const brandNew = makeEntry({ id: 'h-3', date: '2025-07-01T10:00:00.000Z' });
    const result = historyReducer([existing], { type: 'MERGE_HISTORY', payload: [duplicate, brandNew] });
    expect(result).toHaveLength(2);
    // Existing entry should keep original planName (not overwritten)
    expect(result.find((e) => e.id === 'h-1')!.planName).toBe('Original');
  });

  it('RESTORE_HISTORY inserts entry at specified index', () => {
    const state = [
      makeEntry({ id: 'h-1', date: '2025-03-01T00:00:00.000Z' }),
      makeEntry({ id: 'h-3', date: '2025-01-01T00:00:00.000Z' }),
    ];
    const restored = makeEntry({ id: 'h-2', date: '2025-02-01T00:00:00.000Z' });
    const result = historyReducer(state, { type: 'RESTORE_HISTORY', payload: { entry: restored, index: 1 } });
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('h-1');
    expect(result[1].id).toBe('h-2');
    expect(result[2].id).toBe('h-3');
  });
});
