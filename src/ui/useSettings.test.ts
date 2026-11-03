import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SETTINGS_KEYS, useSettings } from './useSettings';

beforeEach(() => localStorage.clear());

describe('useSettings', () => {
  it('defaults to neon, four-colour and Normal', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.table).toBe('neon');
    expect(result.current.deck).toBe('color');
    expect(result.current.speed).toBe('normal');
  });

  it('persists across a remount and ignores junk', () => {
    const first = renderHook(() => useSettings());
    act(() => first.result.current.set({ table: 'luxe', deck: 'grey' }));
    act(() => first.result.current.set({ speed: 'fast' }));
    first.unmount();
    const second = renderHook(() => useSettings());
    expect(second.result.current).toMatchObject({ table: 'luxe', deck: 'grey', speed: 'fast' });
    localStorage.setItem(SETTINGS_KEYS.table, 'disco');
    const third = renderHook(() => useSettings());
    expect(third.result.current.table).toBe('neon');
  });
});
