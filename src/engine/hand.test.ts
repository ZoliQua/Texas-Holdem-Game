import { describe, expect, it } from 'vitest';
import { applyAction, legalActions, potSize, startHand } from './hand';
import { rigged, table } from './testkit';
import { totalChips } from './tournament';
import type { Action, LogEvent, TableState } from './types';

const act = (s: TableState, ...actions: Action[]) => actions.reduce(applyAction, s);
const F: Action = { kind: 'fold' };
const C: Action = { kind: 'call' };
const X: Action = { kind: 'check' };
const R = (amount: number): Action => ({ kind: 'raise', amount });
const AI: Action = { kind: 'allIn' };
const toActId = (s: TableState) => (s.toAct === null ? null : s.players[s.toAct].id);
const eventsOf = <T extends LogEvent['t']>(s: TableState, t: T) =>
  s.events.filter((e): e is Extract<LogEvent, { t: T }> => e.t === t);

describe('heads-up', () => {
  it('the button posts the small blind and acts first preflop; the big blind acts first postflop', () => {
    let s = startHand(table([1500, 1500], 1));
    expect(s.button).toBe(1);
    expect(eventsOf(s, 'blind')).toEqual([
      { t: 'blind', id: 'p1', amount: 10 },
      { t: 'blind', id: 'p0', amount: 20 },
    ]);
    expect(toActId(s)).toBe('p1');
    expect(legalActions(s)).toMatchObject({ canCheck: false, callAmount: 10, minRaiseTo: 40, maxRaiseTo: 1500 });
    s = act(s, C);
    expect(toActId(s)).toBe('p0'); // big blind option
    expect(legalActions(s).canCheck).toBe(true);
    s = act(s, X);
    expect(s.street).toBe('flop');
    expect(s.board).toHaveLength(3);
    expect(toActId(s)).toBe('p0');
    s = act(s, X);
    expect(toActId(s)).toBe('p1');
    s = act(s, X);
    expect(s.street).toBe('turn');
    expect(s.board).toHaveLength(4);
    expect(toActId(s)).toBe('p0');
  });

  it('the button rotates and the next hand swaps the blinds', () => {
    let s = startHand(table([1500, 1500], 0));
    s = act(s, F);
    expect(s.street).toBe('done');
    s = startHand(s);
    expect(s.button).toBe(1);
    expect(eventsOf(s, 'blind')[0]).toEqual({ t: 'blind', id: 'p1', amount: 10 });
  });
});

describe('six-max', () => {
  it('posts blinds left of the button and starts under the gun; the small blind starts postflop', () => {
    let s = startHand(table([1500, 1500, 1500, 1500, 1500, 1500], 2));
    expect(eventsOf(s, 'blind').map((e) => e.id)).toEqual(['p3', 'p4']);
    expect(toActId(s)).toBe('p5');
    s = act(s, C, C, C, C); // p5, p0, p1, p2 call
    expect(toActId(s)).toBe('p3'); // small blind completes
    s = act(s, C);
    expect(toActId(s)).toBe('p4');
    s = act(s, X);
    expect(s.street).toBe('flop');
    expect(toActId(s)).toBe('p3');
    expect(potSize(s)).toBe(120);
  });

  it('skips eliminated seats when posting and acting', () => {
    const s = startHand(table([1500, 0, 1500, 0, 1500, 1500], 0));
    expect(eventsOf(s, 'blind').map((e) => e.id)).toEqual(['p2', 'p4']);
    expect(toActId(s)).toBe('p5');
    expect(s.players[1].hole).toBeNull();
  });
});

describe('raising', () => {
  it('the minimum raise equals the previous raise', () => {
    let s = startHand(table([1500, 1500, 1500, 1500], 0));
    expect(toActId(s)).toBe('p3');
    expect(legalActions(s).minRaiseTo).toBe(40);
    expect(() => act(s, R(30))).toThrow(/minimum/);
    s = act(s, R(60)); // raise by 40
    expect(legalActions(s).minRaiseTo).toBe(100);
    s = act(s, R(150)); // raise by 90
    expect(legalActions(s).minRaiseTo).toBe(240);
    const raise = eventsOf(s, 'act').at(-1);
    expect(raise).toEqual({ t: 'act', id: 'p0', action: { kind: 'raise', amount: 150 }, to: 150 });
  });

  it('a short all-in does not reopen the betting for players who already acted', () => {
    // p0 button, p1 SB, p2 BB, p3 UTG
    let s = startHand(table([150, 1500, 1500, 1500], 0));
    s = act(s, R(100)); // p3 raises to 100 (by 80)
    expect(toActId(s)).toBe('p0');
    s = act(s, AI); // p0 all-in 150: only +50, less than a full raise
    expect(eventsOf(s, 'act').at(-1)?.action).toEqual({ kind: 'allIn', amount: 150 });
    s = act(s, F, F); // blinds fold
    expect(toActId(s)).toBe('p3');
    const legal = legalActions(s);
    expect(legal.minRaiseTo).toBeNull();
    expect(legal.callAmount).toBe(50);
    expect(() => act(s, R(300))).toThrow(/not allowed/);
    s = act(s, C);
    expect(s.street).toBe('done'); // all-in run-out to showdown
    expect(s.board).toHaveLength(5);
  });

  it('a short all-in still lets players who have not acted raise', () => {
    let s = startHand(table([1500, 1500, 1500, 130], 0));
    s = act(s, AI); // p3 UTG all-in 130 (a full raise: +110)
    s = act(s, C); // p0 calls 130
    expect(toActId(s)).toBe('p1');
    expect(legalActions(s).minRaiseTo).toBe(240);
  });

  it('a raise that cannot reach the minimum is only possible as an all-in', () => {
    let s = startHand(table([1500, 1500, 1500, 70], 0));
    s = act(s, R(60)); // p3? no — p3 is UTG with 70
    expect(eventsOf(s, 'act').at(-1)).toMatchObject({ id: 'p3', action: { kind: 'raise', amount: 60 } });
    s = act(s, R(500));
    expect(toActId(s)).toBe('p1');
    s = act(s, F, F);
    expect(toActId(s)).toBe('p3');
    const legal = legalActions(s);
    expect(legal.minRaiseTo).toBeNull(); // facing 440 more with only 10 behind: call is all-in
    expect(legal.callAmount).toBe(10);
  });

  it('bet and raise are normalised to the right kind; illegal amounts throw', () => {
    let s = startHand(table([1500, 1500], 0));
    s = act(s, C, X); // to the flop
    expect(() => act(s, { kind: 'bet', amount: 10 })).toThrow(/minimum/);
    expect(() => act(s, { kind: 'bet', amount: 1600 })).toThrow(/exceeds/);
    expect(() => act(s, C)).not.toThrow();
    s = act(s, { kind: 'raise', amount: 40 });
    expect(eventsOf(s, 'act').at(-1)?.action).toEqual({ kind: 'bet', amount: 40 });
    expect(() => act(s, X)).toThrow(/check/);
  });
});

describe('ending a hand', () => {
  it('a lone remaining player wins without showdown and the uncalled bet comes back', () => {
    let s = startHand(table([1500, 1500, 1500], 0));
    s = act(s, R(100), F, F); // p0 raises, both blinds fold
    expect(s.street).toBe('done');
    expect(eventsOf(s, 'return')).toEqual([{ t: 'return', id: 'p0', amount: 80 }]);
    expect(eventsOf(s, 'win')).toEqual([{ t: 'win', pot: 0, ids: ['p0'], amount: 50, value: null }]);
    expect(eventsOf(s, 'show')).toEqual([]);
    expect(s.players.map((p) => p.stack)).toEqual([1530, 1490, 1480]);
  });

  it('the last aggressor shows first at showdown', () => {
    let s = rigged(table([1500, 1500, 1500], 0), ['As Ad', 'Ks Kd', 'Qs Qd'], '2c 7h 9d Jc 3s');
    s = act(s, C, C, X); // flop
    s = act(s, X, X, X); // turn
    s = act(s, X, X, X); // river: p1 first
    s = act(s, X, { kind: 'bet', amount: 100 }, C, C); // p2 bets, p0 and p1 call
    expect(eventsOf(s, 'show').map((e) => e.id)).toEqual(['p2', 'p0', 'p1']);
    expect(eventsOf(s, 'win')).toEqual([{ t: 'win', pot: 0, ids: ['p0'], amount: 360, value: 'Pair of Aces' }]);
  });

  it('without a river bet the first player left of the button shows first', () => {
    let s = rigged(table([1500, 1500, 1500], 0), ['As Ad', 'Ks Kd', 'Qs Qd'], '2c 7h 9d Jc 3s');
    s = act(s, C, C, X, X, X, X, X, X, X, X, X, X);
    expect(eventsOf(s, 'show').map((e) => e.id)).toEqual(['p1', 'p2', 'p0']);
  });

  it('an odd chip in a split pot goes to the first winner left of the button', () => {
    // Level 2 (15/30): the small blind folds, the pot is 75 and the board plays.
    let s = rigged(table([1500, 1500, 1500], 0, 2), ['2c 3d', '4c 5d', '2d 3c'], 'As Ks Qs Js Ts');
    s = act(s, C, F, X); // p0 calls, p1 (SB) folds, p2 checks
    s = act(s, X, X, X, X, X, X);
    expect(eventsOf(s, 'win')).toEqual([{ t: 'win', pot: 0, ids: ['p2', 'p0'], amount: 75, value: 'Royal flush' }]);
    expect(s.players[2].stack).toBe(1500 - 30 + 38);
    expect(s.players[0].stack).toBe(1500 - 30 + 37);
  });

  it('builds side pots for three different all-ins and awards each to its best hand', () => {
    // p1 short with the best hand, p2 medium with the second best, p3 deep.
    let s = rigged(
      table([2000, 300, 600, 1000], 0),
      ['7c 2d', 'As Ad', 'Ks Kd', 'Qs Qd'],
      '2c 8h 9d Jc 3s',
    );
    // p3 UTG all-in 1000, p0 folds, p1 (SB) all-in 300, p2 (BB) all-in 600
    s = act(s, AI, F, AI, AI);
    expect(s.street).toBe('done');
    const wins = eventsOf(s, 'win');
    expect(wins).toEqual([
      { t: 'win', pot: 0, ids: ['p1'], amount: 900, value: 'Pair of Aces' },
      { t: 'win', pot: 1, ids: ['p2'], amount: 600, value: 'Pair of Kings' },
    ]);
    expect(eventsOf(s, 'return')).toEqual([{ t: 'return', id: 'p3', amount: 400 }]);
    expect(s.players.map((p) => p.stack)).toEqual([2000, 900, 600, 400]);
    expect(totalChips(s)).toBe(3900);
  });

  it('players busted on the same hand are ranked by their starting stacks; equal stacks share', () => {
    // p3 button, p0 SB (deep, best hand), p1 BB 200, p2 UTG 300
    let s = rigged(table([3000, 200, 300, 1500], 3), ['As Ad', '7c 2d', 'Ks Kd', 'Qs Qd'], 'Ah Ac 9d Jc 3s');
    s = act(s, AI, F, C, AI);
    expect(eventsOf(s, 'out')).toEqual([
      { t: 'out', id: 'p1', place: 4 },
      { t: 'out', id: 'p2', place: 3 },
    ]);
    expect(s.places).toEqual({ p1: 4, p2: 3 });

    let t = rigged(table([3000, 300, 300, 1500], 3), ['As Ad', '7c 2d', 'Ks Kd', 'Qs Qd'], 'Ah Ac 9d Jc 3s');
    t = act(t, AI, F, C, AI);
    expect(t.places).toEqual({ p1: 3, p2: 3 });
  });

  it('the last player standing gets first place', () => {
    let s = rigged(table([1500, 1500], 0), ['As Ad', 'Ks Kd'], '2c 8h 9d Jc 3s');
    s = act(s, AI, C);
    expect(s.places).toEqual({ p1: 2, p0: 1 });
    expect(s.players[1].out).toBe(true);
    expect(() => startHand(s)).toThrow(/over/);
  });
});
