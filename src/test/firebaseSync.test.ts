import { describe, it, expect, beforeEach } from 'vitest';
import {
  initHistoryTracking,
  addToHistoryTracking,
  computeHistoryDelta,
  _getTrackedHistoryIds,
} from '../utils/firebaseSync';
import type { HistoryEntry } from '../types';

const makeEntry = (id: string, date = '2025-01-01T10:00:00.000Z'): HistoryEntry => ({
  id,
  planId: 'plan-1',
  planName: 'Plan A',
  workoutName: 'Day 1',
  date,
  exercises: [{ name: 'Bench Press', sets: [{ weight: 60, reps: 10, done: true }] }],
  duration: 3600,
});

describe('initHistoryTracking', () => {
  beforeEach(() => {
    initHistoryTracking([]);
  });

  it('seeds tracked IDs from history entries', () => {
    initHistoryTracking([makeEntry('h-1'), makeEntry('h-2')]);
    const tracked = _getTrackedHistoryIds();
    expect(tracked.size).toBe(2);
    expect(tracked.has('h-1')).toBe(true);
    expect(tracked.has('h-2')).toBe(true);
  });

  it('replaces previous tracking state', () => {
    initHistoryTracking([makeEntry('h-1')]);
    initHistoryTracking([makeEntry('h-99')]);
    const tracked = _getTrackedHistoryIds();
    expect(tracked.size).toBe(1);
    expect(tracked.has('h-99')).toBe(true);
    expect(tracked.has('h-1')).toBe(false);
  });

  it('handles empty array', () => {
    initHistoryTracking([]);
    expect(_getTrackedHistoryIds().size).toBe(0);
  });
});

describe('addToHistoryTracking', () => {
  beforeEach(() => {
    initHistoryTracking([]);
  });

  it('adds new entry IDs to tracking set', () => {
    initHistoryTracking([makeEntry('h-1')]);
    addToHistoryTracking([makeEntry('h-2'), makeEntry('h-3')]);
    const tracked = _getTrackedHistoryIds();
    expect(tracked.size).toBe(3);
    expect(tracked.has('h-1')).toBe(true);
    expect(tracked.has('h-2')).toBe(true);
    expect(tracked.has('h-3')).toBe(true);
  });

  it('does not duplicate existing IDs', () => {
    initHistoryTracking([makeEntry('h-1')]);
    addToHistoryTracking([makeEntry('h-1')]);
    expect(_getTrackedHistoryIds().size).toBe(1);
  });
});

describe('computeHistoryDelta', () => {
  it('detects added entries', () => {
    const lastSynced = new Set(['h-1']);
    const current = [makeEntry('h-1'), makeEntry('h-2')];
    const { added, removedIds } = computeHistoryDelta(lastSynced, current);
    expect(added).toHaveLength(1);
    expect(added[0].id).toBe('h-2');
    expect(removedIds).toHaveLength(0);
  });

  it('detects removed entries', () => {
    const lastSynced = new Set(['h-1', 'h-2']);
    const current = [makeEntry('h-1')];
    const { added, removedIds } = computeHistoryDelta(lastSynced, current);
    expect(added).toHaveLength(0);
    expect(removedIds).toEqual(['h-2']);
  });

  it('detects both added and removed', () => {
    const lastSynced = new Set(['h-1', 'h-2']);
    const current = [makeEntry('h-1'), makeEntry('h-3')];
    const { added, removedIds } = computeHistoryDelta(lastSynced, current);
    expect(added).toHaveLength(1);
    expect(added[0].id).toBe('h-3');
    expect(removedIds).toEqual(['h-2']);
  });

  it('returns empty delta when nothing changed', () => {
    const lastSynced = new Set(['h-1', 'h-2']);
    const current = [makeEntry('h-1'), makeEntry('h-2')];
    const { added, removedIds } = computeHistoryDelta(lastSynced, current);
    expect(added).toHaveLength(0);
    expect(removedIds).toHaveLength(0);
  });

  it('handles empty last-synced set', () => {
    const lastSynced = new Set<string>();
    const current = [makeEntry('h-1')];
    const { added, removedIds } = computeHistoryDelta(lastSynced, current);
    expect(added).toHaveLength(1);
    expect(removedIds).toHaveLength(0);
  });

  it('handles empty current history', () => {
    const lastSynced = new Set(['h-1', 'h-2']);
    const { added, removedIds } = computeHistoryDelta(lastSynced, []);
    expect(added).toHaveLength(0);
    expect(removedIds).toHaveLength(2);
  });
});
