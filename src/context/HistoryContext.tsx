import React, { createContext, useContext, useReducer } from 'react';
import { generateId } from '../utils/helpers';
import type { HistoryEntry, HistoryAction } from '../types';

interface HistoryContextType {
  history: HistoryEntry[];
  dispatchHistory: React.Dispatch<HistoryAction>;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

export function historyReducer(state: HistoryEntry[], action: HistoryAction): HistoryEntry[] {
  switch (action.type) {
    case 'LOG_WORKOUT': {
      const entry: HistoryEntry = {
        id: generateId(),
        planId: action.payload.planId,
        planName: action.payload.planName,
        workoutName: action.payload.workoutName,
        date: new Date().toISOString(),
        exercises: action.payload.exercises,
        duration: action.payload.duration,
        ...(action.payload.notes ? { notes: action.payload.notes } : {}),
      };
      return [entry, ...state];
    }
    case 'DELETE_HISTORY':
      return state.filter((h) => h.id !== action.payload);
    case 'CLEAR_ALL_HISTORY':
      return [];
    case 'IMPORT_HISTORY':
      return action.payload;
    case 'RESTORE_HISTORY': {
      const { entry, index } = action.payload;
      const copy = [...state];
      copy.splice(index, 0, entry);
      return copy;
    }
    default:
      return state;
  }
}

export function HistoryProvider({
  children,
  initialHistory,
}: {
  children: React.ReactNode;
  initialHistory: HistoryEntry[];
}) {
  const [history, dispatchHistory] = useReducer(historyReducer, initialHistory);
  return <HistoryContext.Provider value={{ history, dispatchHistory }}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextType {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}
