import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, saveSession } from './arcade';
import { riggedSixMax } from './game/testkit';
import { HoldemGame, SESSION_SCHEMA } from './HoldemGame';
import { setCoarsePointer } from './test/touchEnv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('en', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(true);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const actionBarCss = readFileSync(resolve(process.cwd(), 'src/ui/ActionBar.module.css'), 'utf8');
const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const touch = { pointerId: 1, pointerType: 'touch', button: 0 };
/** A finger tap: pointer down / up with pointerType touch, then the click the browser sends. */
function tap(el: HTMLElement) {
  fireEvent.pointerDown(el, touch);
  fireEvent.pointerUp(el, touch);
  fireEvent.click(el);
}
const bar = () => screen.getByRole('group', { name: 'Your action' });
const myLog = () =>
  [...screen.getByRole('region', { name: 'Hand log' }).querySelectorAll('li')].map((li) => li.textContent ?? '').filter((t) => t.startsWith('You '));

/** The player is first to act on a fresh 6-max hand (blinds 10/20, stack 1,000). */
function resume() {
  saveSession('holdem', { schema: SESSION_SCHEMA, data: riggedSixMax([1000, 2600, 2400, 800, 1100, 1100]), seconds: 0, score: 0 });
  const utils = render(<HoldemGame />);
  tap(screen.getByRole('button', { name: /Continue/ }));
  return utils;
}

describe('Hold’em touch controls', () => {
  it('the action buttons sit in the bottom bar after the table, without key hints', () => {
    const { container } = resume();
    const b = bar();
    expect(b.dataset.touch).toBe('true');
    const board = container.querySelector('.arc-board-tap') as HTMLElement;
    expect(board).toBeTruthy();
    expect(board.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(b.querySelectorAll('kbd')).toHaveLength(0);
  });

  it('the bottom bar and its slider are thumb-sized on coarse pointers (≥ 44 px)', () => {
    const coarse = actionBarCss.slice(actionBarCss.indexOf('@media (pointer: coarse)'));
    expect(coarse).toMatch(/\.slider input \{[^}]*min-height: 44px/);
    expect(coarse).toMatch(/\.preset \{[^}]*min-height: 44px/);
    expect(coarse).toMatch(/\.bar \{[^}]*position: sticky;[^}]*bottom: 0/);
    expect(coarse).toMatch(/safe-area-inset-bottom/);
  });

  it('tapping Fold folds', () => {
    resume();
    tap(screen.getByRole('button', { name: /^Fold/ }));
    tick(10);
    expect(myLog()).toContain('You fold');
  });

  it('tapping Call calls the big blind', () => {
    resume();
    tap(screen.getByRole('button', { name: /^Call 20/ }));
    tick(10);
    expect(myLog()).toContain('You call 20');
  });

  it('dragging the slider sizes the raise; tapping the raise button confirms it', () => {
    resume();
    const slider = screen.getByRole('slider', { name: 'Raise to' });
    fireEvent.pointerDown(slider, touch);
    fireEvent.change(slider, { target: { value: '140' } });
    fireEvent.pointerUp(slider, touch);
    tap(screen.getByRole('button', { name: /^Raise to 140/ }));
    tick(10);
    expect(myLog()).toContain('You raise to 140');
  });

  it('tapping a preset sets the amount (All-in)', () => {
    resume();
    tap(screen.getByRole('button', { name: 'All-in' }));
    expect(screen.getByRole('button', { name: /^All-in 1,000/ })).toBeTruthy();
  });

  it('tapping a character opens its card', () => {
    resume();
    tap(screen.getAllByRole('button', { name: /^About / })[0]);
    expect(screen.getByRole('dialog', { name: /character card/ })).toBeTruthy();
  });

  it('shows touch help instead of the key list', () => {
    resume();
    expect(screen.getByRole('list', { name: 'Touch controls' }).textContent).toContain('Bottom bar');
    expect(screen.queryByText('Focus the raise slider')).toBeNull();
  });

  it('the full-screen button toggles the immersive mode', () => {
    render(<HoldemGame />);
    fireEvent.click(screen.getByRole('button', { name: /^Full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: /Exit full screen/ }));
    expect(document.documentElement.dataset.arcadeImmersive).toBeUndefined();
  });
});
