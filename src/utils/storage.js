const STORAGE_KEY = 'fitness_app_data';

const emptyState = { plans: [], history: [], exerciseBank: [] };

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !Array.isArray(data.plans)) {
      console.error('Corrupt data detected, structure invalid');
      alert('\u05d0\u05d5\u05d4\u05d6\u05e8\u05d4: \u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05e4\u05d2\u05d5\u05de\u05d9\u05dd \u05d6\u05d5\u05d4\u05d5 \u05d1\u05d0\u05d7\u05e1\u05d5\u05df. \u05d4\u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05d0\u05d5\u05e4\u05e1\u05d5.');
      return emptyState;
    }
    if (!data.exerciseBank) data.exerciseBank = [];
    if (!Array.isArray(data.history)) data.history = [];
    return data;
  } catch (e) {
    console.error('Failed to parse stored data:', e);
    alert('\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05e7\u05e8\u05d9\u05d0\u05ea \u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05de\u05d4\u05d0\u05d7\u05e1\u05d5\u05df. \u05d4\u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05d0\u05d5\u05e4\u05e1\u05d5. \u05de\u05d5\u05de\u05dc\u05e5 \u05dc\u05d9\u05d9\u05d1\u05d0 \u05d2\u05d9\u05d1\u05d5\u05d9.');
    return emptyState;
  }
}

export function saveData(data) {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('Failed to save data:', e);
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      alert('האחסון מלא! לא ניתן לשמור. ייצא גיבוי ומחק היסטוריה ישנה כדי לפנות מקום.');
    } else {
      alert('שגיאה בשמירת נתונים. מומלץ לייצא גיבוי.');
    }
  }
}

let saveTimer = null;
export function debouncedSaveData(data) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveData(data), 300);
}

export function getStorageUsage() {
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

export function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateImportData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.plans)) return false;
  if (!Array.isArray(data.history)) return false;
  if (!Array.isArray(data.exerciseBank)) return false;
  for (const plan of data.plans) {
    if (!plan.id || !plan.name || !Array.isArray(plan.workouts)) return false;
    for (const w of plan.workouts) {
      if (!w.id || !w.name || !Array.isArray(w.exercises)) return false;
    }
  }
  return true;
}
