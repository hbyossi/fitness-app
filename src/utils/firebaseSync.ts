import {
  doc,
  collection,
  getDoc,
  getDocs,
  getDocFromServer,
  getDocsFromServer,
  setDoc,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '../firebase';
import type { AppState, HistoryEntry } from '../types';

// users/{uid}/data/appState  → stores plans + exerciseBank (no history)
// users/{uid}/history/{id}   → each HistoryEntry as its own document
function mainDocRef(uid: string) {
  return doc(firestore, 'users', uid, 'data', 'appState');
}

function historyColRef(uid: string) {
  return collection(firestore, 'users', uid, 'history');
}

function historyDocRef(uid: string, entryId: string) {
  return doc(firestore, 'users', uid, 'history', entryId);
}

// Write entries in Firestore-safe batches (max 500 ops each)
async function batchUpsertHistory(uid: string, entries: HistoryEntry[]): Promise<void> {
  const BATCH_SIZE = 500;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    for (const entry of entries.slice(i, i + BATCH_SIZE)) {
      batch.set(historyDocRef(uid, entry.id), entry);
    }
    await batch.commit();
  }
}

async function batchDeleteHistory(uid: string, ids: string[]): Promise<void> {
  const BATCH_SIZE = 500;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    for (const id of ids.slice(i, i + BATCH_SIZE)) {
      batch.delete(historyDocRef(uid, id));
    }
    await batch.commit();
  }
}

export async function loadCloudData(uid: string): Promise<AppState | null> {
  // Always fetch from server so the app starts with authoritative data.
  // This prevents CloudListener's network snapshot from overwriting
  // locally-added items that haven't been saved yet.
  // Falls back to cache if offline.
  let mainSnap: Awaited<ReturnType<typeof getDoc>>;
  let historySnap: Awaited<ReturnType<typeof getDocs>>;
  try {
    [mainSnap, historySnap] = await Promise.all([
      getDocFromServer(mainDocRef(uid)),
      getDocsFromServer(historyColRef(uid)),
    ]);
  } catch {
    [mainSnap, historySnap] = await Promise.all([
      getDoc(mainDocRef(uid)),
      getDocs(historyColRef(uid)),
    ]);
  }

  if (!mainSnap.exists() && historySnap.empty) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mainData: any = mainSnap.exists() ? mainSnap.data() : {};

  // History from subcollection
  let history: HistoryEntry[] = historySnap.docs.map((d) => d.data() as HistoryEntry);

  // Backward compatibility: old format stored history inside the main doc
  if (history.length === 0 && Array.isArray(mainData.history) && mainData.history.length > 0) {
    history = mainData.history as HistoryEntry[];
    // Migrate to subcollection in the background
    batchUpsertHistory(uid, history).catch(console.error);
  }

  return {
    plans: mainData.plans || [],
    history,
    exerciseBank: mainData.exerciseBank || [],
    weeklyGoal: mainData.weeklyGoal,
    _version: mainData._version,
  };
}

export async function saveCloudData(uid: string, data: AppState): Promise<void> {
  const { history, ...mainData } = data;
  const historyEntries = history || [];

  // Save plans + bank to main doc (no history field)
  await setDoc(mainDocRef(uid), { ...mainData, _lastModified: Date.now() });

  // Upsert all history entries to subcollection
  if (historyEntries.length > 0) {
    await batchUpsertHistory(uid, historyEntries);
  }

  // Delete orphaned cloud history docs (entries deleted locally since last full sync)
  const cloudSnap = await getDocs(historyColRef(uid));
  const localIds = new Set(historyEntries.map((e) => e.id));
  const toDelete = cloudSnap.docs.map((d) => d.id).filter((id) => !localIds.has(id));
  if (toDelete.length > 0) {
    await batchDeleteHistory(uid, toDelete);
  }
}

let savePending: ReturnType<typeof setTimeout> | null = null;
let lastSyncedHistoryIds: Set<string> = new Set();

/** Call once after initial load to seed the tracking set. */
export function initHistoryTracking(history: HistoryEntry[]): void {
  lastSyncedHistoryIds = new Set(history.map((e) => e.id));
}

export function debouncedSaveCloud(uid: string, data: AppState): void {
  if (savePending) clearTimeout(savePending);
  savePending = setTimeout(() => {
    const { history, ...mainData } = data;
    const currentHistory = history || [];

    // Always save the main doc (plans, bank, weeklyGoal — small)
    setDoc(mainDocRef(uid), { ...mainData, _lastModified: Date.now() })
      .catch((e) => {
        console.error('Save failed:', e);
        alert('שגיאה בשמירת הנתונים: ' + (e instanceof Error ? e.message : String(e)));
      });

    // Compute history delta
    const currentIds = new Set(currentHistory.map((e) => e.id));
    const added = currentHistory.filter((e) => !lastSyncedHistoryIds.has(e.id));
    const removedIds = [...lastSyncedHistoryIds].filter((id) => !currentIds.has(id));

    if (added.length > 0) {
      batchUpsertHistory(uid, added).catch(console.error);
    }
    if (removedIds.length > 0) {
      batchDeleteHistory(uid, removedIds).catch(console.error);
    }

    // Update tracking set
    lastSyncedHistoryIds = currentIds;
  }, 1000);
}

export function listenCloudData(uid: string, onData: (data: AppState) => void): Unsubscribe {
  let mainState: { plans: AppState['plans']; exerciseBank: AppState['exerciseBank']; _version?: number } = {
    plans: [],
    exerciseBank: [],
  };
  let historyEntries: HistoryEntry[] = [];
  let mainReady = false;
  let historyReady = false;

  function emit() {
    if (mainReady && historyReady) {
      onData({ ...mainState, history: historyEntries });
    }
  }

  const unsubMain = onSnapshot(mainDocRef(uid), (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      mainState = { plans: d.plans || [], exerciseBank: d.exerciseBank || [], _version: d._version };
    } else {
      mainState = { plans: [], exerciseBank: [] };
    }
    mainReady = true;
    emit();
  });

  const unsubHistory = onSnapshot(historyColRef(uid), (snap) => {
    historyEntries = snap.docs.map((d) => d.data() as HistoryEntry);
    historyReady = true;
    emit();
  });

  return () => {
    unsubMain();
    unsubHistory();
  };
}
