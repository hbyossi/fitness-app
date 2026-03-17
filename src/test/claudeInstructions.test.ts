import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase modules before importing the module under test
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn(),
}));

// Re-import the module fresh for each test to reset the cached _fn
let hasApiKey: typeof import('../utils/claudeInstructions').hasApiKey;
let fetchClaudeInstructions: typeof import('../utils/claudeInstructions').fetchClaudeInstructions;

import { httpsCallable } from 'firebase/functions';

describe('hasApiKey', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.mock('firebase/functions', () => ({ getFunctions: vi.fn(), httpsCallable: vi.fn() }));
    vi.mock('firebase/app', () => ({ getApp: vi.fn() }));
    const mod = await import('../utils/claudeInstructions');
    hasApiKey = mod.hasApiKey;
    fetchClaudeInstructions = mod.fetchClaudeInstructions;
  });

  it('always returns true (key is now server-side)', () => {
    expect(hasApiKey()).toBe(true);
  });
});

describe('fetchClaudeInstructions', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.mock('firebase/functions', () => ({ getFunctions: vi.fn(), httpsCallable: vi.fn() }));
    vi.mock('firebase/app', () => ({ getApp: vi.fn() }));
    const mod = await import('../utils/claudeInstructions');
    fetchClaudeInstructions = mod.fetchClaudeInstructions;
    const firebase = await import('firebase/functions');
    vi.mocked(firebase.httpsCallable).mockReset();
  });

  it('returns null for empty exercise name', async () => {
    const result = await fetchClaudeInstructions('', 'user-1');
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only exercise name', async () => {
    const result = await fetchClaudeInstructions('   ', 'user-1');
    expect(result).toBeNull();
  });

  it('returns instructions from successful cloud function call', async () => {
    const mockInstructions = {
      startingPosition: 'Stand upright',
      execution: 'Curl the weight',
      tempo: '2 up, 3 down',
      notes: 'Keep elbows tucked',
    };

    const mockCallable = vi.fn(async () => ({
      data: { instructions: mockInstructions },
    }));

    const { httpsCallable: hc } = await import('firebase/functions');
    vi.mocked(hc).mockReturnValue(mockCallable as ReturnType<typeof hc>);

    const result = await fetchClaudeInstructions('Bicep Curl', 'user-1');
    expect(result).toEqual(mockInstructions);
    expect(mockCallable).toHaveBeenCalledWith({ exerciseName: 'Bicep Curl' });
  });

  it('returns null when cloud function returns incomplete instructions', async () => {
    const mockCallable = vi.fn(async () => ({
      data: { instructions: { startingPosition: '', execution: '', tempo: '', notes: '' } },
    }));

    const { httpsCallable: hc } = await import('firebase/functions');
    vi.mocked(hc).mockReturnValue(mockCallable as ReturnType<typeof hc>);

    const result = await fetchClaudeInstructions('Test Exercise', 'user-1');
    expect(result).toBeNull();
  });

  it('returns null when cloud function throws', async () => {
    const mockCallable = vi.fn(async () => { throw new Error('Function failed'); });

    const { httpsCallable: hc } = await import('firebase/functions');
    vi.mocked(hc).mockReturnValue(mockCallable as ReturnType<typeof hc>);

    const result = await fetchClaudeInstructions('Test Exercise', 'user-1');
    expect(result).toBeNull();
  });

  it('returns null when cloud function returns no data', async () => {
    const mockCallable = vi.fn(async () => ({ data: {} }));

    const { httpsCallable: hc } = await import('firebase/functions');
    vi.mocked(hc).mockReturnValue(mockCallable as ReturnType<typeof hc>);

    const result = await fetchClaudeInstructions('Test Exercise', 'user-1');
    expect(result).toBeNull();
  });

  it('trims the exercise name before calling', async () => {
    const mockInstructions = {
      startingPosition: 'Pos',
      execution: 'Exec',
      tempo: '',
      notes: '',
    };
    const mockCallable = vi.fn(async () => ({
      data: { instructions: mockInstructions },
    }));

    const { httpsCallable: hc } = await import('firebase/functions');
    vi.mocked(hc).mockReturnValue(mockCallable as ReturnType<typeof hc>);

    await fetchClaudeInstructions('  Bench Press  ', 'user-1');
    expect(mockCallable).toHaveBeenCalledWith({ exerciseName: 'Bench Press' });
  });
});
