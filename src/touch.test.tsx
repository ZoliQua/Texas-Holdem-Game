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
const appCss = readFileSync(resolve(process.cwd(), 'src/App.module.css'), 'utf8');
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
  it('the action buttons sit in the bar after the table, without key hints', () => {
    const { container } = resume();
    const b = bar();
    expect(b.dataset.touch).toBe('true');
    const board = container.querySelector('.arc-board-tap') as HTMLElement;
    expect(board).toBeTruthy();
    expect(board.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(b.querySelectorAll('kbd')).toHaveLength(0);
  });

  it('the action bar is thumb-sized on coarse pointers and never floats over the table', () => {
    const coarse = actionBarCss.slice(actionBarCss.indexOf('@media (pointer: coarse)'));
    expect(coarse).toMatch(/\.slider input \{[^}]*min-height: 44px/);
    expect(coarse).toMatch(/\.preset \{[^}]*min-height: 44px/);
    // Presets in one row; the bar stays in the flow under the table (no sticky overlay on your seat).
    expect(coarse).toMatch(/\.presets \{[^}]*grid-template-columns: repeat\(5, 1fr\)/);
    expect(coarse).toMatch(/\.bar \{[^}]*position: static/);
    expect(coarse).toMatch(/safe-area-inset-bottom/);
    // Landscape phones: a narrow column beside the table, buttons stacked.
    const land = actionBarCss.slice(actionBarCss.indexOf('@media (pointer: coarse) and (orientation: landscape)'));
    expect(land).toMatch(/\.main \{[^}]*grid-template-columns: 1fr/);
  });

  it('the table is capped to the screen height left over by the action bar (portrait) or beside it (landscape)', () => {
    const coarse = appCss.slice(appCss.indexOf('@media (pointer: coarse)'));
    expect(coarse).toMatch(/\.tableWrap \{[^}]*max-width: calc\(\(var\(--holdem-fit-h, 100dvh\) - var\(--holdem-bar-h, 170px\)/);
    const land = appCss.slice(appCss.indexOf('@media (pointer: coarse) and (orientation: landscape)'));
    expect(land).toMatch(/\.main\[data-phone-landscape='true'\] \{[^}]*grid-template-columns:/);
    // Full screen on a phone keeps only the table, the bar and the panels: no title or stat tiles.
    expect(coarse).toMatch(/\.game:global\(\.arc-immersive\) :global\(\.arc-game__head\)/);
    expect(coarse).toMatch(/:global\(\.arc-stats\)[^{]*\{[^}]*display: none/);
  });

  it('measures the screen for the table and scrolls table + bar into view when the deal starts', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const { container } = render(<HoldemGame />);
    fireEvent.click(screen.getByRole('button', { name: /Deal me in/ }));
    const root = container.querySelector('.arc-game') as HTMLElement;
    expect(root.style.getPropertyValue('--holdem-fit-h')).toBe(`${window.innerHeight}px`);
    expect(root.style.getPropertyValue('--holdem-bar-h')).toMatch(/px$/);
    expect(scroll).toHaveBeenCalledWith(expect.objectContaining({ block: 'end' }));
    expect(scroll.mock.contexts.at(-1)).toBe(container.querySelector('[data-phone-landscape]'));
  });

  it('subtracts the portal’s sticky header (.header) and the standalone top bar from the height left for the table', () => {
    const fakeHeader = (cls: string, bottom: number) => {
      const el = document.createElement('header');
      el.className = cls;
      el.style.position = 'sticky';
      el.getBoundingClientRect = () => ({ top: 0, bottom, height: bottom, left: 0, right: 390, width: 390, x: 0, y: 0, toJSON: () => ({}) });
      document.body.prepend(el);
      return el;
    };
    const portal = fakeHeader('header', 56);
    const { container, unmount } = render(<HoldemGame />);
    const root = () => container.querySelector('.arc-game') as HTMLElement;
    expect(root().style.getPropertyValue('--holdem-fit-h')).toBe(`${window.innerHeight - 56}px`);
    // A taller header further down wins (the lowest bottom edge counts); a hidden one does not.
    const top = fakeHeader('arc-topbar', 89);
    act(() => void window.dispatchEvent(new Event('resize')));
    expect(root().style.getPropertyValue('--holdem-fit-h')).toBe(`${window.innerHeight - 89}px`);
    top.style.display = 'none';
    act(() => void window.dispatchEvent(new Event('resize')));
    expect(root().style.getPropertyValue('--holdem-fit-h')).toBe(`${window.innerHeight - 56}px`);
    unmount();
    portal.remove();
    top.remove();
  });

  it('a landscape phone puts the table and the bar side by side, the table in its wide shape', () => {
    setCoarsePointer(true, { landscape: true });
    const { container } = resume();
    expect(container.querySelector('[data-phone-landscape]')!.getAttribute('data-phone-landscape')).toBe('true');
    expect(container.querySelector('[data-orientation]')!.getAttribute('data-orientation')).toBe('landscape');
  });

  it('a portrait phone keeps the table above the bar', () => {
    const { container } = resume();
    expect(container.querySelector('[data-phone-landscape]')!.getAttribute('data-phone-landscape')).toBe('false');
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
    expect(screen.getByRole('list', { name: 'Touch controls' }).textContent).toContain('Action bar');
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
