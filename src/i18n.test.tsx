import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyLang, LANGS, saveSession } from './arcade';
import { cards } from './engine/cards';
import type { LogEvent } from './engine/types';
import { advance, createInitialState, PLAYER_ID } from './game/state';
import { untilPlayerTurn } from './game/testkit';
import { HoldemGame, SESSION_SCHEMA } from './HoldemGame';
import { MESSAGES } from './i18n';
import { handValueText } from './ui/format';
import { profileById } from './bots/profiles';
import { CharacterCard } from './ui/CharacterCard';
import { LogPanel } from './ui/LogPanel';
import { SetupScreen } from './ui/SetupScreen';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  act(() => applyLang('en'));
  vi.useRealTimers();
});

/** A hand as it is stored in a save made before the translation (English hand values). */
const OLD_HAND: LogEvent[] = [
  { t: 'hand', hand: 23, sb: 50, bb: 100, button: 'bruno', level: 4 },
  { t: 'blind', id: 'you', amount: 50 },
  { t: 'blind', id: 'pixel', amount: 100 },
  { t: 'deal', street: 'preflop', board: [] },
  { t: 'act', id: 'bruno', action: { kind: 'raise', amount: 300 }, to: 300 },
  { t: 'act', id: 'you', action: { kind: 'fold' }, to: 300 },
  { t: 'act', id: 'pixel', action: { kind: 'allIn', amount: 845 }, to: 845 },
  { t: 'act', id: 'bruno', action: { kind: 'call', amount: 545 }, to: 845 },
  { t: 'deal', street: 'river', board: cards('Kh 7d 2c 9h 4h') },
  { t: 'show', id: 'pixel', hole: cards('Qh Jh'), value: 'Flush, K-high' },
  { t: 'show', id: 'bruno', hole: cards('As Ad'), value: 'Pair of Aces' },
  { t: 'win', pot: 0, ids: ['pixel'], amount: 1990, value: 'Flush, K-high' },
  { t: 'out', id: 'bruno', place: 4 },
];
const NAMES: Record<string, string> = { bruno: 'Bruno', pixel: 'Pixel', you: 'You' };

describe("Texas Hold'em i18n", () => {
  it('has every key in en, hu and de with a non-empty value', () => {
    const keys = Object.keys(MESSAGES.en).sort();
    expect(keys.length).toBeGreaterThan(0);
    for (const lang of LANGS) {
      expect(Object.keys(MESSAGES[lang]).sort()).toEqual(keys);
      for (const k of keys) expect((MESSAGES[lang] as Record<string, string>)[k].trim()).not.toBe('');
    }
  });

  it('renders the German setup overlay after applyLang("de")', () => {
    applyLang('de');
    render(<HoldemGame />);
    expect(screen.getByRole('dialog', { name: 'Neues Turnier' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Ich bin dabei/ })).toBeTruthy();
    expect(screen.getByText('Schwierigkeit')).toBeTruthy();
  });

  it('switching to Hungarian mid-hand keeps the table, stack and hand', () => {
    const s = untilPlayerTurn(
      advance(createInitialState(), { type: 'start', setup: { format: 'sixMax', difficulty: 'easy', length: 30 }, seed: 17 }),
    );
    saveSession('holdem', { schema: SESSION_SCHEMA, data: s, seconds: 42, score: 0 });
    const { container } = render(<HoldemGame />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    const me = s.table.players.find((p) => p.id === PLAYER_ID);
    const stack = screen.getByText('Your stack').parentElement?.textContent?.replace('Your stack', '');
    expect(stack).toBe(new Intl.NumberFormat('en-US').format(me?.stack ?? -1));
    const mine = container.querySelector(`[data-seat="${PLAYER_ID}"]`) as HTMLElement;
    const cardsBefore = [...mine.querySelectorAll('svg[role="img"]')].map((e) => e.getAttribute('data-card'));

    act(() => applyLang('hu'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('Zsetonod').parentElement?.textContent?.replace('Zsetonod', '')).toBe(
      new Intl.NumberFormat('hu-HU').format(me?.stack ?? -1),
    );
    expect([...mine.querySelectorAll('svg[role="img"]')].map((e) => e.getAttribute('data-card'))).toEqual(cardsBefore);
    expect(screen.getByText(`${s.table.handNo}. leosztás · Vakok 10/20`)).toBeTruthy();
    expect((screen.getByRole('button', { name: /^Dobás/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders a log saved in English in German, hand names included', () => {
    applyLang('de');
    render(<LogPanel log={[OLD_HAND]} name={(id) => NAMES[id]} you="you" deck="color" />);
    expect(screen.getByText('Hand #23 · Blinds 50/100')).toBeTruthy();
    expect(screen.getByText('Du setzt den Small Blind 50')).toBeTruthy();
    expect(screen.getByText('Bruno erhöht auf 300')).toBeTruthy();
    expect(screen.getByText('Du passt')).toBeTruthy();
    expect(screen.getByText('Pixel zeigt — Flush, K hoch')).toBeTruthy();
    expect(screen.getByText('Bruno zeigt — Paar, Asse')).toBeTruthy();
    expect(screen.getByText(/Pixel gewinnt 1\.990 mit Flush, K hoch/)).toBeTruthy();
    expect(screen.getByText('Bruno scheidet als 4. aus')).toBeTruthy();
    expect(screen.getAllByText('Ergebnis').length).toBeGreaterThan(0);
  });

  it('names every showdown hand with the standard terms', () => {
    const values = [
      'Royal flush', 'Straight flush, 9-high', 'Four of a kind, Sevens', 'Full house, Kings over Sevens',
      'Flush, K-high', 'Straight, A-high', 'Three of a kind, Queens', 'Two pair, Q and 9', 'Pair of Aces', 'High card, A',
    ];
    expect(values.map((v) => handValueText(v, 'en'))).toEqual(values);
    expect(values.map((v) => handValueText(v, 'hu'))).toEqual([
      'Royal flush', 'Színsor, 9 magas', 'Póker, hetesek', 'Full, királyok és hetesek',
      'Flush, K magas', 'Sor, A magas', 'Drill, dámák', 'Két pár, Q és 9', 'Pár, ászok', 'Magas lap, A',
    ]);
    expect(values.map((v) => handValueText(v, 'de'))).toEqual([
      'Royal Flush', 'Straight Flush, 9 hoch', 'Vierling, Siebenen', 'Full House, Könige über Siebenen',
      'Flush, K hoch', 'Straße, A hoch', 'Drilling, Damen', 'Zwei Paare, Q und 9', 'Paar, Asse', 'Höchste Karte, A',
    ]);
    expect(handValueText('Something else', 'de')).toBe('Something else');
  });

  it('formats setup points and character-card numbers in the language style', () => {
    applyLang('de');
    const setup = { format: 'sixMax', difficulty: 'medium', length: 45 } as const;
    const { unmount } = render(<SetupScreen value={setup} onChange={() => {}} onStart={() => {}} />);
    expect(screen.getByText(/Startstack 1\.500 · ein Sieg bringt/).textContent).toBe('Startstack 1.500 · ein Sieg bringt 2.500 Punkte');
    unmount();
    act(() => applyLang('hu'));
    const stats = { hands: 20, vpip: 9, pfr: 4, aggr: 3, calls: 2, showdowns: 1, faced: 0, folds: 0 };
    render(<CharacterCard profile={profileById('bruno')!} stats={stats} onClose={() => {}} />);
    expect(screen.getByText('45%')).toBeTruthy();
    expect(screen.getByText('1,5')).toBeTruthy();
    expect(screen.getByText('Tight-agresszív')).toBeTruthy();
  });
});
