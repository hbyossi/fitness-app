import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lookupWger } from '../utils/wgerApi';

function mockFetch(responses: Array<{ ok: boolean; data: unknown }>) {
  let callIndex = 0;
  return vi.fn(async () => {
    const resp = responses[callIndex++] ?? { ok: false, data: {} };
    return {
      ok: resp.ok,
      json: async () => resp.data,
    } as Response;
  });
}

describe('lookupWger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns exercise context for a successful lookup', async () => {
    const searchData = {
      suggestions: [{ value: 'Bench Press', data: { base_id: 192 } }],
    };
    const infoData = {
      category: { name: 'Chest' },
      muscles: [{ name_en: 'Pectoralis major' }],
      muscles_secondary: [{ name_en: 'Anterior deltoid' }],
      equipment: [{ name: 'Barbell' }],
      translations: [{ language: 2, description: '<p>Lie on bench and press</p>' }],
    };

    vi.stubGlobal('fetch', mockFetch([
      { ok: true, data: searchData },
      { ok: true, data: infoData },
    ]));

    const result = await lookupWger('bench press');
    expect(result).not.toBeNull();
    expect(result!.englishName).toBe('Bench Press');
    expect(result!.category).toBe('Chest');
    expect(result!.muscles).toEqual(['Pectoralis major']);
    expect(result!.musclesSecondary).toEqual(['Anterior deltoid']);
    expect(result!.equipment).toEqual(['Barbell']);
    expect(result!.description).toBe('Lie on bench and press');
  });

  it('returns null when search returns no suggestions', async () => {
    vi.stubGlobal('fetch', mockFetch([
      { ok: true, data: { suggestions: [] } },
    ]));

    const result = await lookupWger('nonexistent exercise');
    expect(result).toBeNull();
  });

  it('returns null when search request fails', async () => {
    vi.stubGlobal('fetch', mockFetch([
      { ok: false, data: {} },
    ]));

    const result = await lookupWger('bench press');
    expect(result).toBeNull();
  });

  it('returns null when info request fails', async () => {
    vi.stubGlobal('fetch', mockFetch([
      { ok: true, data: { suggestions: [{ value: 'Bench Press', data: { base_id: 192 } }] } },
      { ok: false, data: {} },
    ]));

    const result = await lookupWger('bench press');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network error'); }));

    const result = await lookupWger('bench press');
    expect(result).toBeNull();
  });

  it('returns null when suggestion has no base_id or id', async () => {
    vi.stubGlobal('fetch', mockFetch([
      { ok: true, data: { suggestions: [{ value: 'Test', data: {} }] } },
    ]));

    const result = await lookupWger('test');
    expect(result).toBeNull();
  });

  it('falls back to data.id when base_id is missing', async () => {
    const searchData = {
      suggestions: [{ value: 'Squat', data: { id: 100 } }],
    };
    const infoData = {
      category: { name: 'Legs' },
      muscles: [],
      muscles_secondary: [],
      equipment: [],
      translations: [],
    };

    vi.stubGlobal('fetch', mockFetch([
      { ok: true, data: searchData },
      { ok: true, data: infoData },
    ]));

    const result = await lookupWger('squat');
    expect(result).not.toBeNull();
    expect(result!.englishName).toBe('Squat');
    expect(result!.category).toBe('Legs');
  });

  it('strips HTML from description', async () => {
    const searchData = {
      suggestions: [{ value: 'Curl', data: { base_id: 50 } }],
    };
    const infoData = {
      category: {},
      muscles: [],
      muscles_secondary: [],
      equipment: [],
      translations: [{ language: 2, description: '<p>Curl the <strong>weight</strong> up.</p>' }],
    };

    vi.stubGlobal('fetch', mockFetch([
      { ok: true, data: searchData },
      { ok: true, data: infoData },
    ]));

    const result = await lookupWger('curl');
    expect(result).not.toBeNull();
    expect(result!.description).toBe('Curl the weight up.');
    expect(result!.description).not.toContain('<');
  });
});
