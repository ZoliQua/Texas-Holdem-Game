import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStats } from '../arcade';
import { HoldemDemo } from './HoldemDemo';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const faceUp = (c: HTMLElement) =>
  [...c.querySelectorAll('[data-seat] svg[role="img"]')].filter((e) => (e.getAttribute('aria-label') ?? '').includes(' of ')).length;
const boardCards = (c: HTMLElement) => c.querySelectorAll('[aria-label="Board"] svg').length;
const snapshot = (c: HTMLElement) => c.innerHTML;

describe('<HoldemDemo />', () => {
  it('plays bots-only hands by itself and writes nothing', () => {
    const { container } = render(<HoldemDemo />);
    expect(container.querySelector('.arc-demo')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('button, [tabindex]')).toBeNull();
    expect(container.querySelectorAll('[data-seat]')).toHaveLength(6);
    expect(faceUp(container)).toBe(0); // nobody's cards are shown before a showdown
    const first = snapshot(container);
    let sawBoard = false;
    let sawShowdown = false;
    for (let i = 0; i < 400; i += 1) {
      act(() => vi.advanceTimersByTime(500));
      if (boardCards(container) > 0) sawBoard = true;
      if (faceUp(container) > 0) sawShowdown = true;
    }
    expect(snapshot(container)).not.toBe(first);
    expect(sawBoard).toBe(true);
    expect(sawShowdown).toBe(true);
    expect(readStats('holdem').plays).toBe(0);
    expect(localStorage.length).toBe(0);
  });

  it('freezes when inactive', () => {
    const { container } = render(<HoldemDemo active={false} />);
    const first = snapshot(container);
    act(() => vi.advanceTimersByTime(20_000));
    expect(snapshot(container)).toBe(first);
  });
});
