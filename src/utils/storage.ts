import { openDB, type IDBPDatabase } from 'idb';
import type { AppState } from '../types';

const DB_NAME = 'fitness_app';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const STATE_KEY = 'appState';
const LS_KEY = 'fitness_app_data';
const CURRENT_VERSION = 3;

const emptyState: AppState = { _version: CURRENT_VERSION, plans: [], history: [], exerciseBank: [] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (data: any) => any;

// Each migration transforms data from version N-1 to N
const migrations: Migration[] = [
  // v0 → v1: add exerciseBank array
  (data) => {
    if (!data.exerciseBank) data.exerciseBank = [];
    return data;
  },
  // v1 → v2: ensure exercises have restTime, instructions as object
  (data) => {
    for (const plan of data.plans || []) {
      for (const w of plan.workouts || []) {
        for (const ex of w.exercises || []) {
          if (ex.restTime === undefined) ex.restTime = 90;
          if (!ex.instructions || typeof ex.instructions === 'string') {
            ex.instructions = {
              startingPosition: '',
              execution: typeof ex.instructions === 'string' ? ex.instructions : '',
              tempo: '',
              notes: '',
            };
          }
        }
      }
    }
    if (!Array.isArray(data.history)) data.history = [];
    return data;
  },
  // v2 → v3: no structural change — marks version as ID-linked-aware
  (data) => data,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runMigrations(data: any): AppState {
  let version: number = data._version || 0;
  while (version < CURRENT_VERSION) {
    console.log(`Migrating data from v${version} to v${version + 1}`);
    data = migrations[version](data);
    version++;
  }
  data._version = CURRENT_VERSION;
  return data;
}

// --- IndexedDB via idb ---

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

// Test helper: close DB and reset cached promise so next call opens fresh
export async function _resetDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    // Clear all data from the store
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).clear();
    await tx.done;
    db.close();
    dbPromise = null;
  }
}

// Migrate from localStorage → IndexedDB on first run
async function migrateFromLocalStorage(): Promise<AppState | null> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !Array.isArray(data.plans)) return null;
    const migrated = runMigrations(data);
    // Save to IndexedDB and remove localStorage copy
    const db = await getDb();
    await db.put(STORE_NAME, migrated, STATE_KEY);
    localStorage.removeItem(LS_KEY);
    console.log('Migrated data from localStorage to IndexedDB');
    return migrated;
  } catch {
    return null;
  }
}

export async function loadData(): Promise<AppState> {
  try {
    const db = await getDb();
    const data = await db.get(STORE_NAME, STATE_KEY);
    if (data && typeof data === 'object' && Array.isArray(data.plans)) {
      const migrated = runMigrations(data);
      if ((data._version || 0) < CURRENT_VERSION) {
        await db.put(STORE_NAME, migrated, STATE_KEY);
      }
      return migrated;
    }
    // Try migrating from localStorage
    const fromLS = await migrateFromLocalStorage();
    if (fromLS) return fromLS;
    return { ...emptyState };
  } catch (e) {
    console.error('Failed to load from IndexedDB:', e);
    // Fallback: try localStorage
    const fromLS = await migrateFromLocalStorage();
    if (fromLS) return fromLS;
    return { ...emptyState };
  }
}

export async function saveData(data: AppState): Promise<void> {
  try {
    data._version = CURRENT_VERSION;
    const db = await getDb();
    await db.put(STORE_NAME, data, STATE_KEY);
  } catch (e: unknown) {
    console.error('Failed to save data:', e);
    alert('שגיאה בשמירת נתונים. מומלץ לייצא גיבוי.');
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function debouncedSaveData(data: AppState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveData(data), 300);
}

export async function getStorageUsage(): Promise<{
  usedBytes: number;
  usedKB: number;
  estimatedLimit: number;
  percentUsed: number;
}> {
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      const used = est.usage || 0;
      const quota = est.quota || 100 * 1024 * 1024;
      return {
        usedBytes: used,
        usedKB: Math.round(used / 1024),
        estimatedLimit: quota,
        percentUsed: Math.round((used / quota) * 100),
      };
    }
    return { usedBytes: 0, usedKB: 0, estimatedLimit: 100 * 1024 * 1024, percentUsed: 0 };
  } catch {
    return { usedBytes: 0, usedKB: 0, estimatedLimit: 100 * 1024 * 1024, percentUsed: 0 };
  }
}

export async function exportData(): Promise<void> {
  const data = await loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateImportData(data: any): data is AppState {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.plans)) return false;
  // Allow older exports missing exerciseBank/history — migrations will fix them
  if (data.exerciseBank && !Array.isArray(data.exerciseBank)) return false;
  if (data.history && !Array.isArray(data.history)) return false;
  for (const plan of data.plans) {
    if (!plan.id || !plan.name || !Array.isArray(plan.workouts)) return false;
    for (const w of plan.workouts) {
      if (!w.id || !w.name || !Array.isArray(w.exercises)) return false;
    }
  }
  // Run migrations on imported data to bring it up to date
  const migrated = runMigrations({ ...data });
  Object.assign(data, migrated);
  return true;
}
