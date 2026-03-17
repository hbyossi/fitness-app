import { describe, it, expect } from 'vitest';
import { suggestInstructions } from '../utils/exerciseInstructionsDb';

describe('suggestInstructions', () => {
  it('returns null for empty string', () => {
    expect(suggestInstructions('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(suggestInstructions('   ')).toBeNull();
  });

  it('returns null for unrecognized exercise', () => {
    expect(suggestInstructions('xyzzy nonsense exercise')).toBeNull();
  });

  it('matches exact Hebrew keyword: לחיצת חזה', () => {
    const result = suggestInstructions('לחיצת חזה');
    expect(result).not.toBeNull();
    expect(result!.startingPosition).toBeTruthy();
    expect(result!.execution).toBeTruthy();
  });

  it('matches exact English keyword: bench press', () => {
    const result = suggestInstructions('bench press');
    expect(result).not.toBeNull();
    expect(result!.execution).toBeTruthy();
  });

  it('matches case-insensitively: Bench Press', () => {
    const result = suggestInstructions('Bench Press');
    expect(result).not.toBeNull();
  });

  it('matches squat', () => {
    const result = suggestInstructions('squat');
    expect(result).not.toBeNull();
    expect(result!.execution).toContain('ירכיים');
  });

  it('matches deadlift', () => {
    const result = suggestInstructions('deadlift');
    expect(result).not.toBeNull();
  });

  it('matches plank in Hebrew', () => {
    const result = suggestInstructions('פלאנק');
    expect(result).not.toBeNull();
    expect(result!.tempo).toContain('סטטית');
  });

  it('matches burpee', () => {
    const result = suggestInstructions('burpee');
    expect(result).not.toBeNull();
  });

  it('matches curl/בייספס', () => {
    const result = suggestInstructions('בייספס');
    expect(result).not.toBeNull();
  });

  it('returns a copy, not a reference to the DB entry', () => {
    const a = suggestInstructions('bench press');
    const b = suggestInstructions('bench press');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('returns all four instruction fields', () => {
    const result = suggestInstructions('bench press');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('startingPosition');
    expect(result).toHaveProperty('execution');
    expect(result).toHaveProperty('tempo');
    expect(result).toHaveProperty('notes');
  });
});
