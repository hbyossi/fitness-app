import { describe, it, expect } from 'vitest';
import { generateId, formatDate, formatTime, formatReps, parseReps, MUSCLE_GROUPS } from '../utils/helpers';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('formatDate', () => {
  it('formats an ISO string in Hebrew locale', () => {
    const result = formatDate('2025-06-15T12:00:00.000Z');
    // Hebrew locale should include some text; we just verify it returns a string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatTime', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 65 seconds as 01:05', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats 3600 seconds as 60:00', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('formats 125 seconds as 02:05', () => {
    expect(formatTime(125)).toBe('02:05');
  });
});

describe('MUSCLE_GROUPS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(MUSCLE_GROUPS)).toBe(true);
    expect(MUSCLE_GROUPS.length).toBeGreaterThan(0);
    MUSCLE_GROUPS.forEach((g) => expect(typeof g).toBe('string'));
  });
});

describe('formatReps', () => {
  it('returns single number when no repsMax', () => {
    expect(formatReps(12)).toBe('12');
  });

  it('returns single number when repsMax equals reps', () => {
    expect(formatReps(10, 10)).toBe('10');
  });

  it('returns range when repsMax > reps', () => {
    expect(formatReps(8, 12)).toBe('8-12');
  });

  it('returns single number when repsMax < reps', () => {
    expect(formatReps(12, 8)).toBe('12');
  });
});

describe('parseReps', () => {
  it('parses single number', () => {
    expect(parseReps('10')).toEqual({ reps: 10 });
  });

  it('parses range with hyphen', () => {
    expect(parseReps('8-12')).toEqual({ reps: 8, repsMax: 12 });
  });

  it('parses range with en-dash', () => {
    expect(parseReps('8\u201312')).toEqual({ reps: 8, repsMax: 12 });
  });

  it('parses range with spaces around dash', () => {
    expect(parseReps('8 - 12')).toEqual({ reps: 8, repsMax: 12 });
  });

  it('defaults to 12 for invalid input', () => {
    expect(parseReps('abc')).toEqual({ reps: 12 });
  });

  it('defaults to 12 for zero', () => {
    expect(parseReps('0')).toEqual({ reps: 12 });
  });

  it('trims whitespace', () => {
    expect(parseReps('  10  ')).toEqual({ reps: 10 });
  });
});
