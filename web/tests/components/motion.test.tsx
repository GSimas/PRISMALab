import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../../src/app/AppProviders';
import { EXIT_MS, usePresence } from '../../src/app/usePresence';
import { GlobalHeader } from '../../src/components/GlobalHeader';

describe('sistema de movimento', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete document.documentElement.dataset.motion;
  });

  it('mantém o conteúdo montado durante a animação de saída', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => usePresence(value), { initialProps: { value: null as string | null } });
    expect(result.current.rendered).toBeNull();

    rerender({ value: 'modal' });
    expect(result.current).toEqual({ rendered: 'modal', state: 'open' });

    rerender({ value: null });
    expect(result.current).toEqual({ rendered: 'modal', state: 'closing' });

    act(() => vi.advanceTimersByTime(EXIT_MS));
    expect(result.current.rendered).toBeNull();
  });

  it('desmonta imediatamente com movimento reduzido', () => {
    vi.useFakeTimers();
    document.documentElement.dataset.motion = 'reduced';
    const { result, rerender } = renderHook(({ value }) => usePresence(value), { initialProps: { value: true } });
    rerender({ value: false });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current.rendered).toBeNull();
  });

  it('preserva idioma e preferência de movimento salvos ao recarregar', async () => {
    localStorage.clear();
    localStorage.setItem('prisma-locale', 'de');
    localStorage.setItem('prisma-accessibility', JSON.stringify({ contrast: false, fontScale: 1, reduceMotion: true }));
    render(<AppProviders><GlobalHeader /></AppProviders>);

    await waitFor(() => expect(screen.getByLabelText('Sprache')).toBeEnabled());
    await waitFor(() => expect(document.documentElement.dataset.motion).toBe('reduced'));
    expect(localStorage.getItem('prisma-locale')).toBe('de');
    expect(JSON.parse(localStorage.getItem('prisma-accessibility') ?? '{}').reduceMotion).toBe(true);
  });
});
