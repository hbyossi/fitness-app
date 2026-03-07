export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
  'גוף מלא',
];

export function formatReps(reps: number, repsMax?: number): string {
  if (repsMax && repsMax > reps) return `${reps}-${repsMax}`;
  return String(reps);
}

export function parseReps(value: string): { reps: number; repsMax?: number } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (match) {
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    if (min > 0 && max > min) return { reps: min, repsMax: max };
  }
  const num = parseInt(trimmed);
  return { reps: num > 0 ? num : 12 };
}
