const STORAGE_KEY = 'fitness_app_data';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { plans: [], history: [], exerciseBank: [] };
    const data = JSON.parse(raw);
    if (!data.exerciseBank) data.exerciseBank = [];
    return data;
  } catch {
    return { plans: [], history: [], exerciseBank: [] };
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
    alert('שגיאה בשמירת נתונים. ייתכן שהאחסון מלא. מומלץ לייצא גיבוי.');
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
