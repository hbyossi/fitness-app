import type { AppState } from '../types';

const STORAGE_KEY = 'fitness_app_data';
const CURRENT_VERSION = 2;

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
    for (const plan of (data.plans || [])) {
      for (const w of (plan.workouts || [])) {
        for (const ex of (w.exercises || [])) {
          if (ex.restTime === undefined) ex.restTime = 90;
          if (!ex.instructions || typeof ex.instructions === 'string') {
            ex.instructions = {
              startingPosition: '',
              execution: typeof ex.instructions === 'string' ? ex.instructions : '',
              tempo: '',
              notes: ''
            };
          }
        }
      }
    }
    if (!Array.isArray(data.history)) data.history = [];
    return data;
  }
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

export function loadData(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !Array.isArray(data.plans)) {
      console.error('Corrupt data detected, structure invalid');
      alert('אוהזרה: נתונים פגומים זוהו באחסון. הנתונים אופסו.');
      return { ...emptyState };
    }
    const migrated = runMigrations(data);
    // Save migrated data if version changed
    if ((data._version || 0) < CURRENT_VERSION) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
    }
    return migrated;
  } catch (e) {
    console.error('Failed to parse stored data:', e);
    alert('שגיאה בקריאת נתונים מהאחסון. הנתונים אופסו. מומלץ לייבא גיבוי.');
    return { ...emptyState };
  }
}

export function saveData(data: AppState): void {
  try {
    data._version = CURRENT_VERSION;
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e: unknown) {
    console.error('Failed to save data:', e);
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      alert('האחסון מלא! לא ניתן לשמור. ייצא גיבוי ומחק היסטוריה ישנה כדי לפנות מקום.');
    } else {
      alert('שגיאה בשמירת נתונים. מומלץ לייצא גיבוי.');
    }
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function debouncedSaveData(data: AppState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveData(data), 300);
}

export function getStorageUsage(): { usedBytes: number; usedKB: number; estimatedLimit: number; percentUsed: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const usedBytes = raw ? new Blob([raw]).size : 0;
    const estimatedLimit = 5 * 1024 * 1024;
    return {
      usedBytes,
      usedKB: Math.round(usedBytes / 1024),
      estimatedLimit,
      percentUsed: Math.round((usedBytes / estimatedLimit) * 100)
    };
  } catch {
    return { usedBytes: 0, usedKB: 0, estimatedLimit: 5 * 1024 * 1024, percentUsed: 0 };
  }
}

export function exportData(): void {
  const data = loadData();
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
