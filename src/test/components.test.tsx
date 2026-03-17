import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import UndoToast from '../components/UndoToast';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  hasInstructions,
  normalizeInstructions,
} from '../components/ExerciseInstructions';
import type { Instructions } from '../types';

// ── ConfirmDialog ──
describe('ConfirmDialog', () => {
  it('renders title and text', () => {
    render(<ConfirmDialog title="Delete?" text="Are you sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Delete?')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog title="T" text="X" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('אישור'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="T" text="X" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('ביטול'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when overlay clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog title="T" text="X" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(container.querySelector('.overlay')!);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onCancel when dialog body clicked (stopPropagation)', () => {
    const onCancel = vi.fn();
    const { container } = render(<ConfirmDialog title="T" text="X" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(container.querySelector('.dialog')!);
    expect(onCancel).not.toHaveBeenCalled();
  });
});

// ── UndoToast ──
describe('UndoToast', () => {
  it('renders message and undo button', () => {
    render(<UndoToast message="Item deleted" onUndo={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Item deleted')).toBeTruthy();
    expect(screen.getByText('↩ ביטול')).toBeTruthy();
  });

  it('calls onUndo when undo button clicked', () => {
    const onUndo = vi.fn();
    render(<UndoToast message="Test" onUndo={onUndo} onDismiss={vi.fn()} />);
    fireEvent.click(screen.getByText('↩ ביטול'));
    expect(onUndo).toHaveBeenCalledOnce();
  });
});

// ── ErrorBoundary ──
describe('ErrorBoundary', () => {
  // Suppress React error boundary console output during tests
  const originalError = console.error;
  beforeAll(() => { console.error = vi.fn(); });
  afterAll(() => { console.error = originalError; });

  function ThrowingChild() {
    throw new Error('Boom');
  }

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>OK Content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('OK Content')).toBeTruthy();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText('משהו השתבש')).toBeTruthy();
  });
});

// ── ExerciseInstructions helpers ──
describe('hasInstructions', () => {
  it('returns false for null/undefined', () => {
    expect(hasInstructions(null)).toBe(false);
    expect(hasInstructions(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(hasInstructions('')).toBe(false);
    expect(hasInstructions('   ')).toBe(false);
  });

  it('returns true for non-empty string', () => {
    expect(hasInstructions('some instructions')).toBe(true);
  });

  it('returns false for all-empty instruction object', () => {
    expect(hasInstructions({ startingPosition: '', execution: '', tempo: '', notes: '' })).toBe(false);
  });

  it('returns true if any field has content', () => {
    expect(hasInstructions({ startingPosition: '', execution: 'do it', tempo: '', notes: '' })).toBe(true);
  });
});

describe('normalizeInstructions', () => {
  it('returns empty instructions for null', () => {
    expect(normalizeInstructions(null)).toEqual({
      startingPosition: '', execution: '', tempo: '', notes: '',
    });
  });

  it('converts string to execution field', () => {
    const result = normalizeInstructions('do this');
    expect(result.execution).toBe('do this');
    expect(result.startingPosition).toBe('');
  });

  it('fills missing fields from partial object', () => {
    const partial = { startingPosition: 'stand', execution: 'move' } as Instructions;
    const result = normalizeInstructions(partial);
    expect(result.startingPosition).toBe('stand');
    expect(result.execution).toBe('move');
    expect(result.tempo).toBe('');
    expect(result.notes).toBe('');
  });
});
