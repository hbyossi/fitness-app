export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const MUSCLE_GROUPS: string[] = [
  'חזה',
  'גב',
  'כתפיים',
  'יד קדמית (בייספס)',
  'יד אחורית (טרייספס)',
  'רגליים',
  'בטן',
  'ישבן',
  'קרדיו',
  'גוף מלא'
];
