import { describe, expect, it } from 'vitest';
import { applyAction, legalActions, startHand } from './hand';
import { makeRng, randInt, type Rng } from './rng';
import { isTournamentOver, newTournament, totalChips } from './tournament';
import type { Action, TableState } from './types';

/** A random legal action, weighted so hands both end early and reach showdowns. */
function randomAction(s: TableState, rng: Rng): Action {
  const legal = legalActions(s);
  const r = rng.next();
  if (legal.minRaiseTo !== null && r < 0.12) {
    const span = legal.maxRaiseTo - legal.minRaiseTo;
    return { kind: 'raise', amount: legal.minRaiseTo + randInt(rng, span + 1) };
  }
  if (legal.minRaiseTo !== null && r < 0.16) return { kind: 'allIn' };
  if (legal.canCheck) return r < 0.2 ? { kind: 'fold' } : { kind: 'check' };
  return r < 0.4 ? { kind: 'fold' } : { kind: 'call' };
}

function cardsAreUnique(s: TableState): boolean {
  const all = [...s.board, ...s.deck, ...s.players.flatMap((p) => p.hole ?? [])];
  return new Set(all).size === all.length && all.every((c) => c >= 0 && c < 52);
}

describe('seeded random play', () => {
  it('1 000+ hands across 2–6 players: chips are conserved after every action and every hand ends', () => {
    let hands = 0;
    let showdowns = 0;
    let sidePots = 0;
    let tournaments = 0;
    for (let seed = 1; hands < 1000; seed += 1) {
      const rng = makeRng(seed * 7919);
      const n = 2 + (seed % 5);
      let s = newTournament({ seed, playerIds: Array.from({ length: n }, (_, i) => `p${i}`), handsPerLevel: 6 });
      const total = totalChips(s);
      while (!isTournamentOver(s)) {
        s = startHand(s);
        hands += 1;
        expect(totalChips(s)).toBe(total);
        let steps = 0;
        while (s.street !== 'done') {
          expect(s.toAct).not.toBeNull();
          s = applyAction(s, randomAction(s, rng));
          expect(totalChips(s)).toBe(total);
          expect(s.players.every((p) => p.stack >= 0 && p.committed >= 0)).toBe(true);
          steps += 1;
          expect(steps).toBeLessThan(200);
        }
        expect(cardsAreUnique(s)).toBe(true);
        if (s.events.some((e) => e.t === 'show')) showdowns += 1;
        if (s.events.some((e) => e.t === 'win' && e.pot > 0)) sidePots += 1;
        expect(s.players.every((p) => p.committed === 0 && p.bet === 0)).toBe(true);
      }
      tournaments += 1;
      const alive = s.players.filter((p) => !p.out);
      expect(alive).toHaveLength(1);
      expect(s.places[alive[0].id]).toBe(1);
      expect(alive[0].stack).toBe(total);
      // Every place 1..n is taken (shared places may skip the next number).
      expect(Object.keys(s.places)).toHaveLength(n);
    }
    expect(hands).toBeGreaterThanOrEqual(1000);
    expect(tournaments).toBeGreaterThan(5);
    expect(showdowns).toBeGreaterThan(50);
    expect(sidePots).toBeGreaterThan(5);
  });
});
