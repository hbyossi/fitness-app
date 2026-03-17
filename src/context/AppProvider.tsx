import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { debouncedSaveCloud, loadCloudData } from '../utils/firebaseSync';
import { useAuth } from './AuthContext';
import { PlansProvider, usePlans } from './PlansContext';
import { HistoryProvider, useHistory } from './HistoryContext';
import { BankProvider, useBank } from './BankContext';
import type { AppState } from '../types';

const emptyState: AppState = { plans: [], history: [], exerciseBank: [], weeklyGoal: 3 };

// — Weekly goal context —
interface WeeklyGoalContextType {
  weeklyGoal: number;
  setWeeklyGoal: (n: number) => void;
}
const WeeklyGoalContext = createContext<WeeklyGoalContextType | null>(null);

export function useWeeklyGoal(): WeeklyGoalContextType {
  const ctx = useContext(WeeklyGoalContext);
  if (!ctx) throw new Error('useWeeklyGoal must be used within AppProvider');
  return ctx;
}

// Inner component that watches all slices and persists to cloud
function Persister({ children }: { children: React.ReactNode }) {
  const { plans } = usePlans();
  const { history } = useHistory();
  const { exerciseBank } = useBank();
  const { weeklyGoal } = useWeeklyGoal();
  const { user } = useAuth();
  // Keep user in a ref so token refreshes (new User object, same UID) don't
  // trigger a save with potentially stale/empty state.
  const userRef = React.useRef(user);
  const isFirst = React.useRef(true);

  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (userRef.current) {
      debouncedSaveCloud(userRef.current.uid, { plans, history, exerciseBank, weeklyGoal });
    }
  }, [plans, history, exerciseBank, weeklyGoal]);

  return <>{children}</>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [weeklyGoalState, setWeeklyGoalState] = useState<number>(3);
  const { user, loading: authLoading, signIn } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    async function init() {
      try {
        const cloudData = await loadCloudData(user!.uid);
        if (cancelled) return;
        if (cloudData && Array.isArray(cloudData.plans)) {
          setState(cloudData);
          setWeeklyGoalState(cloudData.weeklyGoal ?? 3);
          return;
        }
        // Truly new user — no data exists yet
        setState(emptyState);
      } catch (e) {
        console.error('Failed to load cloud data:', e);
        if (!cancelled) {
          alert('שגיאה בטעינת הנתונים: ' + (e instanceof Error ? e.message : String(e)));
          setState(emptyState);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏋️</div>
          <div>טוען...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏋️</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Fitness Tracker</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            התחבר כדי לסנכרן את האימונים שלך בין מכשירים
          </p>
          <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={signIn}>
            🔑 התחבר עם Google
          </button>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏋️</div>
          <div>טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <WeeklyGoalContext.Provider value={{ weeklyGoal: weeklyGoalState, setWeeklyGoal: setWeeklyGoalState }}>
      <PlansProvider initialPlans={state.plans}>
        <HistoryProvider initialHistory={state.history}>
          <BankProvider initialBank={state.exerciseBank}>
            <Persister>
              {children}
            </Persister>
          </BankProvider>
        </HistoryProvider>
      </PlansProvider>
    </WeeklyGoalContext.Provider>
  );
}

// Re-export hooks for convenience
export { usePlans } from './PlansContext';
export { useHistory } from './HistoryContext';
export { useBank } from './BankContext';

// Combined import hook (replaces all data)
export function useImportData() {
  const { dispatchPlans } = usePlans();
  const { dispatchHistory } = useHistory();
  const { dispatchBank } = useBank();

  return useCallback(
    (data: AppState) => {
      dispatchPlans({ type: 'IMPORT_PLANS', payload: data.plans || [] });
      dispatchHistory({ type: 'IMPORT_HISTORY', payload: data.history || [] });
      dispatchBank({ type: 'IMPORT_BANK', payload: data.exerciseBank || [] });
    },
    [dispatchPlans, dispatchHistory, dispatchBank],
  );
}

// Combined merge hook (adds new items, keeps existing)
export function useMergeData() {
  const { dispatchPlans } = usePlans();
  const { dispatchHistory } = useHistory();
  const { dispatchBank } = useBank();

  return useCallback(
    (data: AppState) => {
      dispatchPlans({ type: 'MERGE_PLANS', payload: data.plans || [] });
      dispatchHistory({ type: 'MERGE_HISTORY', payload: data.history || [] });
      dispatchBank({ type: 'MERGE_BANK', payload: data.exerciseBank || [] });
    },
    [dispatchPlans, dispatchHistory, dispatchBank],
  );
}
