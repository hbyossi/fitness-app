import { describe, it, expect } from 'vitest';
import { generateId, formatDate, formatTime, MUSCLE_GROUPS } from '../utils/helpers';

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
