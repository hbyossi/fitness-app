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
