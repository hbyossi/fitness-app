import { describe, it, expect, beforeEach } from 'vitest';
import { loadData, saveData, validateImportData, _resetDbForTests } from '../utils/storage';
import type { AppState } from '../types';

beforeEach(async () => {
  localStorage.clear();
  // Ensure DB is initialized, then clear its contents and reset connection
  await loadData();
  await _resetDbForTests();
});

describe('saveData / loadData', () => {
  it('round-trips data through IndexedDB', async () => {
    const data: AppState = {
      plans: [
        {
          id: 'p1',
          name: 'Plan',
          createdAt: '2025-01-01',
          workouts: [
            {
              id: 'w1',
              name: 'Day 1',
              muscleGroup: 'חזה',
              exercises: [],
            },
          ],
        },
      ],
      history: [],
      exerciseBank: [],
    };
    await saveData(data);
    const loaded = await loadData();
    expect(loaded.plans).toHaveLength(1);
    expect(loaded.plans[0].name).toBe('Plan');
    expect(loaded._version).toBeDefined();
  });

  it('returns empty state when no data stored', async () => {
    const data = await loadData();
    expect(data.plans).toEqual([]);
    expect(data.history).toEqual([]);
    expect(data.exerciseBank).toEqual([]);
  });

  it('migrates data from localStorage on first load', async () => {
    const lsData = {
      _version: 3,
      plans: [{ id: 'p1', name: 'LS Plan', createdAt: '2025-01-01', workouts: [] }],
      history: [],
      exerciseBank: [],
    };
    localStorage.setItem('fitness_app_data', JSON.stringify(lsData));
    const loaded = await loadData();
    expect(loaded.plans[0].name).toBe('LS Plan');
    // localStorage should be cleared after migration
    expect(localStorage.getItem('fitness_app_data')).toBeNull();
  });
});

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
});
