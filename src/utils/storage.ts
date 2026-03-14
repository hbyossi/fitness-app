import type { AppState } from '../types';

const CURRENT_VERSION = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (data: any) => any;

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
  // v2 → v3: no structural change
  (data) => data,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runMigrations(data: any): AppState {
  let version: number = data._version || 0;
  while (version < CURRENT_VERSION) {
    data = migrations[version](data);
    version++;
  }
  data._version = CURRENT_VERSION;
  return data;
}

export function exportAppState(data: AppState): void {
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
  if (data.exerciseBank && !Array.isArray(data.exerciseBank)) return false;
  if (data.history && !Array.isArray(data.history)) return false;
  for (const plan of data.plans) {
    if (!plan.id || !plan.name || !Array.isArray(plan.workouts)) return false;
    for (const w of plan.workouts) {
      if (!w.id || !w.name || !Array.isArray(w.exercises)) return false;
    }
  }
  const migrated = runMigrations({ ...data });
  Object.assign(data, migrated);
  return true;
}
