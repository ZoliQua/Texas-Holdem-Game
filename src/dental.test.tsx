import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, saveSession } from './arcade';
import { ROSTER as PROFILES } from './bots/profiles';
import { advance, createInitialState, PLAYER_ID, type GameState } from './game/state';
import { untilPlayerTurn } from './game/testkit';
import { HoldemGame, SESSION_SCHEMA } from './HoldemGame';
import { CharacterCard } from './ui/CharacterCard';
import { DENTAL_ROLE } from './ui/dentalOutfits';
import { SETTINGS_KEYS } from './ui/useSettings';


beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  applyDental(false, { silent: true });
  vi.useRealTimers();
});

/** A saved 6-max game at the player's decision, resumed with Continue. */
function resume(): { s: GameState; container: HTMLElement } {
  const s = untilPlayerTurn(
    advance(createInitialState(), { type: 'start', setup: { format: 'sixMax', difficulty: 'easy', length: 30 }, seed: 17 }),
  );
  saveSession('holdem', { schema: SESSION_SCHEMA, data: s, seconds: 42, score: 0 });
  const { container } = render(<HoldemGame />);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^(Continue|Folytatás|Weiter)/ }));
  return { s, container };
}

const table = () => screen.getByRole('region', { name: /Poker table|Pókerasztal|Pokertisch/ });
const stat = (label: string | RegExp) => {
  const dt = screen.getAllByRole('term').find((d) => (typeof label === 'string' ? d.textContent === label : label.test(d.textContent ?? '')));
  return dt?.nextElementSibling?.textContent ?? null;
};
const myCards = (container: HTMLElement) =>
  [...(container.querySelector(`[data-seat="${PLAYER_ID}"]`) as HTMLElement).querySelectorAll('svg[data-card]')].map((e) =>
    e.getAttribute('data-card'),
  );

describe('dental mode', () => {
  it('gives every character its own dental role', () => {
    const roles = PROFILES.map((p) => DENTAL_ROLE[p.look.species]);
    expect(new Set(roles).size).toBe(PROFILES.length);
  });

  it('turns the table into the clinic, dresses the bots and puts a tooth on the card backs', () => {
    localStorage.setItem(SETTINGS_KEYS.table, 'luxe');
    applyDental(true);
    const { s, container } = resume();
    expect(table().getAttribute('data-dental')).toBe('true');
    expect(table().getAttribute('data-theme-table')).toBe('clinic');
    const bots = s.table.players.filter((p) => p.id !== PLAYER_ID);
    const backs = container.querySelectorAll('svg[role="img"]:not([data-card]):not([data-pose])').length;
    expect(backs).toBeGreaterThan(0);
    expect(screen.getAllByTestId('holdem-card-back-tooth').length).toBe(backs);
    const outfits = [...container.querySelectorAll('svg[data-outfit]')].map((e) => e.getAttribute('data-outfit'));
    expect(outfits).toHaveLength(bots.length);
    expect(new Set(outfits).size).toBe(bots.length);
    // The chosen table theme is kept, not overwritten.
    expect(localStorage.getItem(SETTINGS_KEYS.table)).toBe('luxe');
    expect(screen.getByRole('button', { name: /^dark$/i }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the tells: a dressed character still carries its tell and pose', () => {
    applyDental(true);
    const profile = PROFILES.find((p) => p.id === 'bruno');
    if (!profile) throw new Error('bruno missing');
    render(<CharacterCard profile={profile} stats={undefined} onClose={() => {}} />);
    const art = screen.getByRole('img', { name: /dentist/i });
    expect(art.getAttribute('data-outfit')).toBe('dentist');
    expect(art.querySelector('[class*="ears"]')?.childElementCount).toBeGreaterThan(0);
    expect(art.querySelector('[class*="pupils"]')).toBeTruthy();
    expect(screen.getByText('Dentist')).toBeTruthy();
  });

  it('toggling dental mode mid-hand keeps the hand, stack and cards; off restores the chosen theme', () => {
    localStorage.setItem(SETTINGS_KEYS.table, 'classic');
    const { s, container } = resume();
    const me = s.table.players.find((p) => p.id === PLAYER_ID);
    const stackBefore = stat('Your stack');
    const cardsBefore = myCards(container);
    expect(stackBefore).toBe(new Intl.NumberFormat('en-US').format(me?.stack ?? -1));
    expect(table().getAttribute('data-theme-table')).toBe('classic');

    act(() => void fireEvent.click(screen.getByRole('checkbox', { name: /Dental mode/ })));
    expect(table().getAttribute('data-theme-table')).toBe('clinic');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(stat('Your stack')).toBe(stackBefore);
    expect(myCards(container)).toEqual(cardsBefore);
    expect(screen.getByText(`Hand #${s.table.handNo} · Blinds 10/20`)).toBeTruthy();
    expect((screen.getByRole('button', { name: /^Fold/ }) as HTMLButtonElement).disabled).toBe(false);

    act(() => applyDental(false));
    expect(table().getAttribute('data-theme-table')).toBe('classic');
    expect(localStorage.getItem(SETTINGS_KEYS.table)).toBe('classic');
    expect(myCards(container)).toEqual(cardsBefore);
  });

  it('with dental mode off the classic backs and characters are drawn', () => {
    const { container } = resume();
    expect(table().getAttribute('data-dental')).toBe('false');
    expect(table().getAttribute('data-theme-table')).toBe('neon');
    expect(screen.queryByTestId('holdem-card-back-tooth')).toBeNull();
    expect(container.querySelectorAll('svg[data-outfit]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="holdem-card-back-classic"]').length).toBeGreaterThan(0);
  });
});

describe('next-blinds stat tile', () => {
  it.each([
    ['en', 'Next blinds', (n: number) => `15/30 · in ${n} hands`],
    ['hu', 'Következő vak', (n: number) => `15/30 · ${n} leosztás múlva`],
    ['de', 'Nächste Blinds', (n: number) => `15/30 · in ${n} Händen`],
  ] as const)('shows the next blinds and when they come, and may wrap (%s)', (lang, label, value) => {
    act(() => applyLang(lang));
    const { s } = resume();
    const left = s.table.handsPerLevel - s.table.handsInLevel;
    expect(left).toBeGreaterThan(0);
    expect(stat(label)).toBe(value(left));
    const dd = screen.getAllByRole('term').find((d) => d.textContent === label)?.nextElementSibling;
    const wrap = dd?.querySelector('.wrapValue');
    expect(wrap?.textContent).toBe(value(left));
    // jsdom applies no CSS Modules, so check the rule itself: the kit's `nowrap` on the value is lifted.
    const appCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'App.module.css'), 'utf8');
    expect(appCss).toMatch(/\.wrapValue\s*\{[^}]*white-space:\s*normal/);
  });
});
