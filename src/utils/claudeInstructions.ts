import Anthropic from '@anthropic-ai/sdk';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { lookupWger } from './wgerApi';
import type { Instructions } from '../types';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
}

function cacheKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0590-\u05ff-]/g, '').slice(0, 100);
}

export function hasApiKey(): boolean {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);
}

function buildPrompt(exerciseName: string, wger: Awaited<ReturnType<typeof lookupWger>>): string {
  const lines: string[] = [];
  if (wger) {
    if (wger.englishName) lines.push(`English name: ${wger.englishName}`);
    if (wger.category) lines.push(`Category: ${wger.category}`);
    if (wger.muscles.length) lines.push(`Primary muscles: ${wger.muscles.join(', ')}`);
    if (wger.musclesSecondary.length) lines.push(`Secondary muscles: ${wger.musclesSecondary.join(', ')}`);
    if (wger.equipment.length) lines.push(`Standard equipment: ${wger.equipment.join(', ')} (adapt for dumbbells)`);
    if (wger.description) lines.push(`Reference description: ${wger.description}`);
  }
  const context = lines.length ? `\n\nReference data from exercise database:\n${lines.join('\n')}` : '';
  return `Generate detailed exercise instructions for: "${exerciseName}"${context}

Return JSON with exactly these fields:
{
  "startingPosition": "description of starting position in Hebrew",
  "execution": "step by step execution in Hebrew",
  "tempo": "tempo in Hebrew (e.g. '3 שניות ירידה, 1 עצירה, 2 שניות עלייה')",
  "notes": "safety tips and important coaching notes in Hebrew"
}`;
}

export async function fetchClaudeInstructions(
  exerciseName: string,
  uid: string,
): Promise<Instructions | null> {
  const key = cacheKey(exerciseName);
  if (!key || !hasApiKey()) return null;

  // Check Firestore cache first
  try {
    const cacheRef = doc(firestore, 'users', uid, 'instructionsCache', key);
    const cached = await getDoc(cacheRef);
    if (cached.exists()) {
      return cached.data().instructions as Instructions;
    }
  } catch {
    // Cache miss — proceed to API
  }

  // Fetch wger context and call Claude (wger runs in parallel with cache check above)
  const wger = await lookupWger(exerciseName);

  try {
    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system:
        'You are a professional personal trainer. Generate exercise instructions in Hebrew for home gym workouts with dumbbells. Respond with valid JSON only, no other text, no markdown.',
      messages: [{ role: 'user', content: buildPrompt(exerciseName, wger) }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const instructions = JSON.parse(jsonMatch[0]) as Instructions;
    if (!instructions.startingPosition || !instructions.execution) return null;

    // Cache in Firestore (non-fatal if it fails)
    try {
      const cacheRef = doc(firestore, 'users', uid, 'instructionsCache', key);
      await setDoc(cacheRef, { instructions, cachedAt: serverTimestamp() });
    } catch {
      /* ignore */
    }

    return instructions;
  } catch (e) {
    console.error('Claude API error:', e);
    return null;
  }
}
