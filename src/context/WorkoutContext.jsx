import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { loadData, saveData } from '../utils/storage';
import { generateId } from '../utils/helpers';

const WorkoutContext = createContext();

const initialState = loadData();

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PLAN': {
      const plan = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
        workouts: action.payload.workouts.map(w => ({ ...w, id: generateId() }))
      };
      return { ...state, plans: [...state.plans, plan] };
    }
    case 'UPDATE_PLAN': {
      const plans = state.plans.map(p =>
        p.id === action.payload.id ? { ...p, ...action.payload } : p
      );
      return { ...state, plans };
    }
    case 'DELETE_PLAN': {
      return { ...state, plans: state.plans.filter(p => p.id !== action.payload) };
    }
    case 'DUPLICATE_PLAN': {
      const source = state.plans.find(p => p.id === action.payload);
      if (!source) return state;
      const dup = {
        ...source,
        id: generateId(),
        name: source.name + ' (עותק)',
        createdAt: new Date().toISOString(),
        workouts: source.workouts.map(w => ({
          ...w,
          id: generateId(),
          exercises: w.exercises.map(e => ({ ...e, id: generateId() }))
        }))
      };
      return { ...state, plans: [...state.plans, dup] };
    }
    case 'ADD_EXERCISE': {
      const { planId, workoutId, exercise } = action.payload;
      const plans = state.plans.map(p => {
        if (p.id !== planId) return p;
        return {
          ...p,
          workouts: p.workouts.map(w => {
            if (w.id !== workoutId) return w;
            return { ...w, exercises: [...w.exercises, { ...exercise, id: generateId() }] };
          })
        };
      });
      return { ...state, plans };
    }
    case 'LOG_WORKOUT': {
      const entry = {
        id: generateId(),
        planId: action.payload.planId,
        planName: action.payload.planName,
        workoutName: action.payload.workoutName,
        date: new Date().toISOString(),
        exercises: action.payload.exercises,
        duration: action.payload.duration
      };
      return { ...state, history: [entry, ...state.history] };
    }
    case 'DELETE_HISTORY': {
      return { ...state, history: state.history.filter(h => h.id !== action.payload) };
    }
    case 'ADD_BANK_EXERCISE': {
      const bankEx = { ...action.payload, id: generateId() };
      return { ...state, exerciseBank: [...state.exerciseBank, bankEx] };
    }
    case 'UPDATE_BANK_EXERCISE': {
      const bank = state.exerciseBank.map(e =>
        e.id === action.payload.id ? { ...e, ...action.payload } : e
      );
      return { ...state, exerciseBank: bank };
    }
    case 'DELETE_BANK_EXERCISE': {
      return { ...state, exerciseBank: state.exerciseBank.filter(e => e.id !== action.payload) };
    }
    default:
      return state;
  }
}

export function WorkoutProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    saveData(state);
  }, [state]);

  return (
    <WorkoutContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
