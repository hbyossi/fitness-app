import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineString } from 'firebase-functions/params';
import Anthropic from '@anthropic-ai/sdk';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';

initializeApp();
const db = getFirestore();

const anthropicApiKey = defineString('ANTHROPIC_API_KEY');

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: anthropicApiKey.value() });
  }
  return _client;
}

function cacheKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0590-\u05ff-]/g, '')
    .slice(0, 100);
}

interface WgerContext {
  englishName?: string;
  category?: string;
  muscles?: string[];
  musclesSecondary?: string[];
  equipment?: string[];
  description?: string;
}

function buildPrompt(exerciseName: string, wger: WgerContext | null): string {
  const lines: string[] = [];
  if (wger) {
    if (wger.englishName) lines.push(`English name: ${wger.englishName}`);
    if (wger.category) lines.push(`Category: ${wger.category}`);
    if (wger.muscles?.length) lines.push(`Primary muscles: ${wger.muscles.join(', ')}`);
    if (wger.musclesSecondary?.length) lines.push(`Secondary muscles: ${wger.musclesSecondary.join(', ')}`);
    if (wger.equipment?.length) lines.push(`Standard equipment: ${wger.equipment.join(', ')} (adapt for dumbbells)`);
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

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function lookupWger(exerciseName: string): Promise<WgerContext | null> {
  try {
    const searchUrl = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(exerciseName)}&language=english&format=json`;
    const searchRes = await fetchWithTimeout(searchUrl);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const suggestions: { value: string; data: { id?: number; base_id?: number } }[] =
      searchData.suggestions ?? [];
    if (!suggestions.length) return null;

    const first = suggestions[0];
    const baseId = first.data?.base_id ?? first.data?.id;
    if (!baseId) return null;

    const infoRes = await fetchWithTimeout(`https://wger.de/api/v2/exerciseinfo/${baseId}/?format=json`);
    if (!infoRes.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const info: any = await infoRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enTranslation = (info.translations ?? []).find((t: any) => t.language === 2);
    const description: string = (enTranslation?.description ?? '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 400);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const muscles: string[] = (info.muscles ?? []).map((m: any) => m.name_en ?? m.name).filter(Boolean);
    const musclesSecondary: string[] = (info.muscles_secondary ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((m: any) => m.name_en ?? m.name)
      .filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const equipment: string[] = (info.equipment ?? []).map((e: any) => e.name).filter(Boolean);
    const category: string = info.category?.name ?? '';

    return { englishName: first.value, category, muscles, musclesSecondary, equipment, description };
  } catch {
    return null;
  }
}

export const generateExerciseInstructions = onCall(
  { maxInstances: 10, timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const uid = request.auth.uid;
    const exerciseName = request.data?.exerciseName;

    if (typeof exerciseName !== 'string' || !exerciseName.trim()) {
      throw new HttpsError('invalid-argument', 'exerciseName is required');
    }

    const name = exerciseName.trim().slice(0, 200);
    const key = cacheKey(name);
    if (!key) {
      throw new HttpsError('invalid-argument', 'Invalid exercise name');
    }

    // Check Firestore cache
    const cacheRef = db.doc(`users/${uid}/instructionsCache/${key}`);
    const cached = await cacheRef.get();
    if (cached.exists) {
      return { instructions: cached.data()!.instructions };
    }

    // Fetch wger context and call Claude
    const wger = await lookupWger(name);

    const client = getClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:
        'You are a professional personal trainer. Generate exercise instructions in Hebrew for home gym workouts with dumbbells. Respond with valid JSON only, no other text, no markdown.',
      messages: [{ role: 'user', content: buildPrompt(name, wger) }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new HttpsError('internal', 'Failed to parse AI response');
    }

    const instructions = JSON.parse(jsonMatch[0]);
    if (!instructions.startingPosition || !instructions.execution) {
      throw new HttpsError('internal', 'Incomplete instructions generated');
    }

    // Only keep the 4 expected fields
    const clean = {
      startingPosition: String(instructions.startingPosition),
      execution: String(instructions.execution),
      tempo: String(instructions.tempo || ''),
      notes: String(instructions.notes || ''),
    };

    // Cache result
    await cacheRef.set({ instructions: clean, cachedAt: new Date() });

    return { instructions: clean };
  },
);
