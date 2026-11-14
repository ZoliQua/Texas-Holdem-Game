import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, saveSession } from './arcade';
import { evaluate7 } from './engine/evaluate';
import { STARTING_STACK } from './engine/tournament';
import { BASE_POINTS, MAX_SCORE, SIX_MAX_SHARES, tournamentScore } from './game/scoring';
import { riggedSixMax } from './game/testkit';
import { HoldemGame, SESSION_SCHEMA } from './HoldemGame';
import { setCoarsePointer } from './test/touchEnv';
import { HAND_LADDER } from './ui/handLadder';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
  setCoarsePointer(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  applyLang('en', { silent: true });
  applyDental(false, { silent: true });
});

const openRules = () => fireEvent.click(screen.getByRole('button', { name: /^Szabályok/ }));
const rules = () => screen.getByRole('dialog', { name: "Texas Hold'em — szabályok" });
const headings = () => within(rules()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const hu = (n: number) => formatNumber(n, 'hu');
const dealIn = () => fireEvent.click(screen.getByRole('button', { name: /Beszállok/ }));

describe('Hold’em rules dialog', () => {
  it('has a Rules button (no R hotkey: R is the raise slider); opening mid-run pauses, closing stays paused', () => {
    const onStatusChange = vi.fn();
    render(<HoldemGame onStatusChange={onStatusChange} />);
    const btn = screen.getByRole('button', { name: /^Szabályok/ });
    expect(btn.getAttribute('aria-keyshortcuts')).toBeNull();
    dealIn();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }));
    fireEvent.keyDown(window, { key: 'r' });
    expect(screen.queryByRole('dialog', { name: /szabályok/ })).toBeNull();
    openRules();
    expect(rules()).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bezárás' }));
    expect(screen.queryByRole('dialog', { name: /szabályok/ })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Szünet' })).toBeTruthy();
    expect(onStatusChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'paused' }));
  });

  it('lists goal, play, rules, scoring, dental in order; mobile only on touch, with the touch rows', () => {
    const { unmount } = render(<HoldemGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód']);
    expect(rules().textContent).toContain('F dob, C passzol vagy megad');
    unmount();
    setCoarsePointer(true);
    render(<HoldemGame />);
    openRules();
    expect(headings()).toEqual(['Cél', 'Így játssz', 'Szabályok', 'Pontozás', 'Fogas mód', 'Mobilon']);
    const text = rules().textContent ?? '';
    expect(text).not.toContain('F dob');
    expect(text).toContain('koppints a lenti sávban a Dobás, Passz / Megadás vagy az emelés gombra');
    expect(text).toContain('Min., ½ kassza, ¾ kassza, Kassza, All-in');
    expect(text).toContain('A lépéseid a lenti sávban vannak, hüvelykujjnyi távolságra.');
    expect(text).toContain('Húzd az emelés csúszkáját');
    expect(text).toContain('A Teljes képernyő gomb elrejti a böngészőt az asztal körül.');
  });

  it('shows the iOS home-screen tip on iPhone only', () => {
    setCoarsePointer(true);
    const ua = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)');
    render(<HoldemGame />);
    openRules();
    expect(rules().textContent).toContain('Böngészősáv nélkül: Megosztás → Főképernyőhöz adás.');
    ua.mockRestore();
  });

  it('prints every scoring number as computed by the real scoring rules', () => {
    render(<HoldemGame />);
    openRules();
    const text = rules().textContent ?? '';
    expect(text).toContain(`mindenki ${hu(STARTING_STACK)} zsetonnal kezd`);
    const pool = { easy: 'Könnyű', medium: 'Közepes', hard: 'Nehéz' } as const;
    for (const d of ['easy', 'medium', 'hard'] as const) {
      const places = SIX_MAX_SHARES.map((_, i) => `${i + 1}. hely ${hu(tournamentScore({ difficulty: d, format: 'sixMax', place: i + 1 }))}`).join(', ');
      expect(text).toContain(`${pool[d]}, 6 fős asztal: ${places} pont.`);
    }
    const hw = (d: 'easy' | 'medium' | 'hard') => hu(tournamentScore({ difficulty: d, format: 'headsUp', place: 1 }));
    const lose = hu(tournamentScore({ difficulty: 'hard', format: 'headsUp', place: 2 }));
    expect(text).toContain(`Heads-up: a győzelem ${hw('easy')} (könnyű), ${hw('medium')} (közepes) vagy ${hw('hard')} (nehéz) pontot ér; a vereség ${lose} pontot.`);
    expect(text).toContain(`Egy verseny legfeljebb ${hu(MAX_SCORE)} pontot ér.`);
    // Spot checks against the constants themselves (catches a formula drifting away from them).
    expect(text).toContain(`Nehéz, 6 fős asztal: 1. hely ${hu(BASE_POINTS.hard)}, 2. hely ${hu(BASE_POINTS.hard * SIX_MAX_SHARES[1])},`);
    expect(MAX_SCORE).toBe(Math.max(...(['easy', 'medium', 'hard'] as const).map((d) => tournamentScore({ difficulty: d, format: 'sixMax', place: 1 }))));
    expect(text).toContain('A Befejezés azonnal lezárja a versenyt.');
  });

  it('the setup screen’s starting-stack hint uses the real starting stack', () => {
    render(<HoldemGame />);
    expect(screen.getByText(new RegExp(`Kezdő zseton ${hu(STARTING_STACK)}`))).toBeTruthy();
  });

  it('draws the hand ladder: ten hands, best first, each example really is that hand', () => {
    expect(HAND_LADDER.map((r) => r.category)).toEqual([
      'straightFlush', 'straightFlush', 'quads', 'fullHouse', 'flush', 'straight', 'trips', 'twoPair', 'pair', 'high',
    ]);
    const scores = HAND_LADDER.map((r) => evaluate7(r.cards));
    scores.forEach((v, i) => expect(v.category).toBe(HAND_LADDER[i].category));
    for (let i = 1; i < scores.length; i += 1) expect(scores[i - 1].score).toBeGreaterThan(scores[i].score);
    render(<HoldemGame />);
    openRules();
    const img = within(rules()).getByRole('img', { name: /^Kézrangsor a legerősebbtől a leggyengébbig: Royal flush, Színsor, Póker, Full, Flush, Sor, Drill, Két pár, Pár, Magas lap\./ });
    expect(img.querySelectorAll('[data-ladder-row]')).toHaveLength(10);
    // Cards that make the hand and kickers differ by frame style, not by colour alone.
    expect(img.querySelectorAll('[data-kicker="true"]').length).toBeGreaterThan(0);
    expect(img.querySelectorAll('[data-kicker="true"] rect[stroke-dasharray]').length).toBe(img.querySelectorAll('[data-kicker="true"]').length);
    expect(img.querySelectorAll('[data-ladder-badge="tooth"]')).toHaveLength(0);
  });

  it('the ladder follows dental mode', () => {
    applyDental(true, { silent: true });
    render(<HoldemGame />);
    openRules();
    expect(within(rules()).getByRole('img', { name: /^Kézrangsor/ }).querySelectorAll('[data-ladder-badge="tooth"]')).toHaveLength(10);
  });

  it('keeps the run when the language changes inside the rules', () => {
    saveSession('holdem', { schema: SESSION_SCHEMA, data: riggedSixMax([1000, 2600, 2400, 800, 1100, 1100]), seconds: 42, score: 0 });
    const { container } = render(<HoldemGame />);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Üdv újra!' })).getByRole('button', { name: /Folytatás/ }));
    const cards = () => [...container.querySelectorAll('[data-card]')].map((e) => e.getAttribute('data-card')).join(',');
    const before = cards();
    openRules();
    act(() => applyLang('de'));
    expect(screen.getByRole('heading', { level: 2, name: "Texas Hold'em — Regeln" })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Ziel' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.getByRole('dialog', { name: 'Pausiert' })).toBeTruthy();
    expect(cards()).toBe(before);
    expect(screen.getByText('Dein Stack').parentElement!.textContent).toContain(formatNumber(1000, 'de'));
  });
});
