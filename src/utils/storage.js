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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
