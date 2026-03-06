const STORAGE_KEY = 'fitness_app_data';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { plans: [], history: [] };
    return JSON.parse(raw);
  } catch {
    return { plans: [], history: [] };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
