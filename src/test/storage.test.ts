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
});
