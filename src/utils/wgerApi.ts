/**
 * Fetches exercise context from wger.de (free, no API key required).
 * Used to enrich Claude prompts with structured exercise data.
 */

export interface WgerContext {
  englishName: string;
  category: string;
  muscles: string[];
  musclesSecondary: string[];
  equipment: string[];
  description: string;
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

export async function lookupWger(exerciseName: string): Promise<WgerContext | null> {
  try {
    const searchUrl =
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(exerciseName)}&language=english&format=json`;
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

    // English translation (language id 2)
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

    return {
      englishName: first.value,
      category,
      muscles,
      musclesSecondary,
      equipment,
      description,
    };
  } catch {
    return null; // Network error or timeout — degrade gracefully
  }
}
