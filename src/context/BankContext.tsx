import React, { createContext, useContext, useReducer } from 'react';
import { generateId } from '../utils/helpers';
import type { BankExercise, BankAction } from '../types';

interface BankContextType {
  exerciseBank: BankExercise[];
  dispatchBank: React.Dispatch<BankAction>;
}

const BankContext = createContext<BankContextType | null>(null);

export function bankReducer(state: BankExercise[], action: BankAction): BankExercise[] {
  switch (action.type) {
    case 'ADD_BANK_EXERCISE':
      return [...state, { ...action.payload, id: generateId() }];
    case 'UPDATE_BANK_EXERCISE':
      return state.map(e =>
        e.id === action.payload.id ? { ...e, ...action.payload } : e
      );
    case 'DELETE_BANK_EXERCISE':
      return state.filter(e => e.id !== action.payload);
    case 'IMPORT_BANK':
      return action.payload;
    default:
      return state;
  }
}

export function BankProvider({ children, initialBank }: { children: React.ReactNode; initialBank: BankExercise[] }) {
  const [exerciseBank, dispatchBank] = useReducer(bankReducer, initialBank);
  return (
    <BankContext.Provider value={{ exerciseBank, dispatchBank }}>
      {children}
    </BankContext.Provider>
  );
}

export function useBank(): BankContextType {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error('useBank must be used within BankProvider');
  return ctx;
}
