import React, { createContext, useContext, useReducer } from 'react';
import { generateId } from '../utils/helpers';
import type { Plan, PlanAction } from '../types';

interface PlansContextType {
  plans: Plan[];
  dispatchPlans: React.Dispatch<PlanAction>;
}

const PlansContext = createContext<PlansContextType | null>(null);

export function plansReducer(state: Plan[], action: PlanAction): Plan[] {
  switch (action.type) {
    case 'ADD_PLAN': {
      const plan: Plan = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
        workouts: action.payload.workouts.map((w) => ({ ...w, id: generateId() })),
      };
      return [...state, plan];
    }
    case 'UPDATE_PLAN':
      return state.map((p) => (p.id === action.payload.id ? { ...p, ...action.payload } : p));
    case 'DELETE_PLAN':
      return state.filter((p) => p.id !== action.payload);
    case 'DUPLICATE_PLAN': {
      const source = state.find((p) => p.id === action.payload);
      if (!source) return state;
      const dup: Plan = {
        ...source,
        id: generateId(),
        name: source.name + ' (עותק)',
        createdAt: new Date().toISOString(),
        workouts: source.workouts.map((w) => ({
          ...w,
          id: generateId(),
          exercises: w.exercises.map((e) => ({ ...e, id: generateId() })),
        })),
      };
      return [...state, dup];
    }
    case 'ADD_EXERCISE': {
      const { planId, workoutId, exercise } = action.payload;
      return state.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          workouts: p.workouts.map((w) => {
            if (w.id !== workoutId) return w;
            return { ...w, exercises: [...w.exercises, { ...exercise, id: generateId() }] };
          }),
        };
      });
    }
    case 'IMPORT_PLANS':
      return action.payload;
    default:
      return state;
  }
}

export function PlansProvider({ children, initialPlans }: { children: React.ReactNode; initialPlans: Plan[] }) {
  const [plans, dispatchPlans] = useReducer(plansReducer, initialPlans);
  return <PlansContext.Provider value={{ plans, dispatchPlans }}>{children}</PlansContext.Provider>;
}

export function usePlans(): PlansContextType {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error('usePlans must be used within PlansProvider');
  return ctx;
}
