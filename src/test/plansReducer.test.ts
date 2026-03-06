import { describe, it, expect } from 'vitest';
import { plansReducer } from '../context/PlansContext';
import type { Plan, PlanAction } from '../types';

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  name: 'Test Plan',
  createdAt: '2025-01-01T00:00:00.000Z',
  workouts: [
    {
      id: 'w-1',
      name: 'Workout A',
      muscleGroup: 'חזה',
      exercises: [
        {
          id: 'ex-1',
          name: 'Bench Press',
          sets: 3,
          reps: 10,
          weight: 60,
          restTime: 90,
          instructions: { startingPosition: '', execution: '', tempo: '', notes: '' },
        },
      ],
    },
  ],
  ...overrides,
});

describe('plansReducer', () => {
  it('ADD_PLAN adds a new plan with generated IDs', () => {
    const state: Plan[] = [];
    const action: PlanAction = {
      type: 'ADD_PLAN',
      payload: {
        name: 'New Plan',
        workouts: [{ name: 'Day 1', muscleGroup: 'חזה', exercises: [] }],
      },
    };
    const result = plansReducer(state, action);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('New Plan');
    expect(result[0].id).toBeTruthy();
    expect(result[0].createdAt).toBeTruthy();
    expect(result[0].workouts[0].id).toBeTruthy();
  });

  it('UPDATE_PLAN updates the matching plan', () => {
    const state = [makePlan()];
    const action: PlanAction = { type: 'UPDATE_PLAN', payload: { id: 'plan-1', name: 'Renamed' } };
    const result = plansReducer(state, action);
    expect(result[0].name).toBe('Renamed');
    expect(result[0].workouts).toEqual(state[0].workouts);
  });

  it('UPDATE_PLAN leaves other plans unchanged', () => {
    const state = [makePlan(), makePlan({ id: 'plan-2', name: 'Other' })];
    const result = plansReducer(state, { type: 'UPDATE_PLAN', payload: { id: 'plan-1', name: 'X' } });
    expect(result[1].name).toBe('Other');
  });

  it('DELETE_PLAN removes the matching plan', () => {
    const state = [makePlan(), makePlan({ id: 'plan-2' })];
    const result = plansReducer(state, { type: 'DELETE_PLAN', payload: 'plan-1' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('plan-2');
  });

  it('DUPLICATE_PLAN creates a copy with new IDs', () => {
    const state = [makePlan()];
    const result = plansReducer(state, { type: 'DUPLICATE_PLAN', payload: 'plan-1' });
    expect(result).toHaveLength(2);
    expect(result[1].name).toContain('(עותק)');
    expect(result[1].id).not.toBe(state[0].id);
    expect(result[1].workouts[0].id).not.toBe(state[0].workouts[0].id);
    expect(result[1].workouts[0].exercises[0].id).not.toBe(state[0].workouts[0].exercises[0].id);
  });

  it('DUPLICATE_PLAN returns unchanged state for missing plan', () => {
    const state = [makePlan()];
    const result = plansReducer(state, { type: 'DUPLICATE_PLAN', payload: 'nonexistent' });
    expect(result).toBe(state);
  });

  it('ADD_EXERCISE adds exercise to the correct workout', () => {
    const state = [makePlan()];
    const action: PlanAction = {
      type: 'ADD_EXERCISE',
      payload: {
        planId: 'plan-1',
        workoutId: 'w-1',
        exercise: {
          name: 'Squat',
          sets: 4,
          reps: 8,
          weight: 80,
          restTime: 120,
          instructions: { startingPosition: '', execution: '', tempo: '', notes: '' },
        },
      },
    };
    const result = plansReducer(state, action);
    expect(result[0].workouts[0].exercises).toHaveLength(2);
    expect(result[0].workouts[0].exercises[1].name).toBe('Squat');
    expect(result[0].workouts[0].exercises[1].id).toBeTruthy();
  });

  it('IMPORT_PLANS replaces entire state', () => {
    const state = [makePlan()];
    const imported = [makePlan({ id: 'imported-1', name: 'Imported' })];
    const result = plansReducer(state, { type: 'IMPORT_PLANS', payload: imported });
    expect(result).toBe(imported);
  });
});
