import React, { useEffect, useRef, useCallback, useState } from 'react';
import { loadData, debouncedSaveData, setPendingData, flushPendingSave, saveData } from '../utils/storage';
import { debouncedSaveCloud, loadCloudData, listenCloudData, saveCloudData } from '../utils/firebaseSync';
import { useAuth } from './AuthContext';
import { PlansProvider, usePlans } from './PlansContext';
import { HistoryProvider, useHistory } from './HistoryContext';
import { BankProvider, useBank } from './BankContext';
import type { AppState } from '../types';

// Inner component that watches all three slices and persists to storage + cloud
function Persister({ children }: { children: React.ReactNode }) {
  const { plans } = usePlans();
  const { history } = useHistory();
  const { exerciseBank } = useBank();
  const { user } = useAuth();
  const isFirst = useRef(true);
  const skipNextPersist = useRef(false);

  useEffect(() => {
    // Skip the initial render (data just loaded from storage)
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    // Skip if this change was triggered by a remote cloud snapshot
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    const data = { plans, history, exerciseBank };
    setPendingData(data);
    debouncedSaveData(data);
    if (user) {
      debouncedSaveCloud(user.uid, data);
    }
  }, [plans, history, exerciseBank, user]);

  // Flush pending save when tab is hidden or closing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return <>{children}</>;
}

// Listens for remote Firestore changes and imports them
function CloudListener() {
  const { user } = useAuth();
  const importData = useImportData();

  useEffect(() => {
    if (!user) return;
    let skipFirst = true;
    const unsub = listenCloudData(user.uid, (data) => {
      // Skip the initial snapshot (we already loaded this data)
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      importData(data);
      // Also persist to local IndexedDB
      saveData(data);
    });
    return unsub;
  }, [user, importData]);

  return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const localData = await loadData();

      if (user) {
        try {
          const cloudData = await loadCloudData(user.uid);
          if (cancelled) return;
          if (cloudData && Array.isArray(cloudData.plans)) {
            // Cloud has data — use it
            setState(cloudData);
            // Also update local copy
            saveData(cloudData);
            return;
          }
        } catch (e) {
          console.error('Failed to load cloud data:', e);
        }
        // No cloud data — push local data to cloud on first login
        if (
          localData.plans.length > 0 ||
          localData.history.length > 0 ||
          localData.exerciseBank.length > 0
        ) {
          saveCloudData(user.uid, localData).catch(console.error);
        }
      }

      if (!cancelled) setState(localData);
    }

    if (!authLoading) {
      init();
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || !state) {
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
    <PlansProvider initialPlans={state.plans}>
      <HistoryProvider initialHistory={state.history}>
        <BankProvider initialBank={state.exerciseBank}>
          <Persister>
            <CloudListener />
            {children}
          </Persister>
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

  return useCallback(
    (data: AppState) => {
      dispatchPlans({ type: 'IMPORT_PLANS', payload: data.plans || [] });
      dispatchHistory({ type: 'IMPORT_HISTORY', payload: data.history || [] });
      dispatchBank({ type: 'IMPORT_BANK', payload: data.exerciseBank || [] });
    },
    [dispatchPlans, dispatchHistory, dispatchBank],
  );
}
