import React, { useEffect, useRef, useCallback } from 'react';
import { loadData, debouncedSaveData } from '../utils/storage';
import { PlansProvider, usePlans } from './PlansContext';
import { HistoryProvider, useHistory } from './HistoryContext';
import { BankProvider, useBank } from './BankContext';
import type { AppState } from '../types';

const initialState: AppState = loadData();

// Inner component that watches all three slices and persists to storage
function Persister({ children }: { children: React.ReactNode }) {
  const { plans } = usePlans();
  const { history } = useHistory();
  const { exerciseBank } = useBank();
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip the initial render (data just loaded from storage)
    if (isFirst.current) { isFirst.current = false; return; }
    debouncedSaveData({ plans, history, exerciseBank });
  }, [plans, history, exerciseBank]);

  return <>{children}</>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <PlansProvider initialPlans={initialState.plans}>
      <HistoryProvider initialHistory={initialState.history}>
        <BankProvider initialBank={initialState.exerciseBank}>
          <Persister>{children}</Persister>
        </BankProvider>
      </HistoryProvider>
    </PlansProvider>
  );
}

// Re-export hooks for convenience
export { usePlans } from './PlansContext';
export { useHistory } from './HistoryContext';
export { useBank } from './BankContext';

// Combined import hook
export function useImportData() {
  const { dispatchPlans } = usePlans();
  const { dispatchHistory } = useHistory();
  const { dispatchBank } = useBank();

  return useCallback((data: AppState) => {
    dispatchPlans({ type: 'IMPORT_PLANS', payload: data.plans || [] });
    dispatchHistory({ type: 'IMPORT_HISTORY', payload: data.history || [] });
    dispatchBank({ type: 'IMPORT_BANK', payload: data.exerciseBank || [] });
  }, [dispatchPlans, dispatchHistory, dispatchBank]);
}
