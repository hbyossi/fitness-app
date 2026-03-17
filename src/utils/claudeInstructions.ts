import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import type { Instructions } from '../types';

let _fn: ReturnType<typeof httpsCallable> | null = null;

function getGenerateFn() {
  if (!_fn) {
    const functions = getFunctions(getApp());
    _fn = httpsCallable(functions, 'generateExerciseInstructions');
  }
  return _fn;
}

export function hasApiKey(): boolean {
  // The API key now lives server-side in the Cloud Function.
  // This always returns true so the UI shows the AI buttons.
  // The function itself will fail gracefully if not configured.
  return true;
}

export async function fetchClaudeInstructions(
  exerciseName: string,
  _uid: string,
): Promise<Instructions | null> {
  if (!exerciseName.trim()) return null;

  try {
    const fn = getGenerateFn();
    const result = await fn({ exerciseName: exerciseName.trim() });
    const data = result.data as { instructions?: Instructions };
    if (data?.instructions?.startingPosition && data?.instructions?.execution) {
      return data.instructions;
    }
    return null;
  } catch (e) {
    console.error('Cloud Function error:', e);
    return null;
  }
}
