import { describe, expect, it } from 'vitest';
import { applyAction, startHand } from './hand';
import { isTournamentOver, newTournament, STARTING_STACK, totalChips } from './tournament';

describe('newTournament', () => {
  it('seats everybody with 1500 chips and draws a button from the seed', () => {
    const s = newTournament({ seed: 9, playerIds: ['you', 'a', 'b'], handsPerLevel: 8 });
    expect(s.players.map((p) => p.stack)).toEqual([STARTING_STACK, STARTING_STACK, STARTING_STACK]);
    expect(totalChips(s)).toBe(4500);
    expect(s.button).toBe(newTournament({ seed: 9, playerIds: ['you', 'a', 'b'], handsPerLevel: 8 }).button);
    expect(s.level).toBe(1);
    expect(isTournamentOver(s)).toBe(false);
  });

  it('rejects fewer than two players and duplicate ids', () => {
    expect(() => newTournament({ seed: 1, playerIds: ['a'], handsPerLevel: 5 })).toThrow();
    expect(() => newTournament({ seed: 1, playerIds: ['a', 'a'], handsPerLevel: 5 })).toThrow();
  });
});

describe('blind levels and the button', () => {
  it('levels up after handsPerLevel hands and keeps counting', () => {
    let s = newTournament({ seed: 3, playerIds: ['a', 'b', 'c'], handsPerLevel: 2 });
    const seen: string[] = [];
    for (let h = 0; h < 5; h += 1) {
      s = startHand(s);
      seen.push(`${s.handNo}:${s.level}:${s.handsInLevel}`);
      while (s.toAct !== null) s = applyAction(s, { kind: 'fold' });
    }
    expect(seen).toEqual(['1:1:1', '2:1:2', '3:2:1', '4:2:2', '5:3:1']);
  });

  it('moves the button one live seat clockwise each hand', () => {
    let s = newTournament({ seed: 5, playerIds: ['a', 'b', 'c', 'd'], handsPerLevel: 10 });
    s = { ...s, button: 3, players: s.players.map((p, i) => (i === 0 ? { ...p, stack: 0, out: true } : p)) };
    const buttons: number[] = [];
    for (let h = 0; h < 4; h += 1) {
      s = startHand(s);
      buttons.push(s.button);
      while (s.toAct !== null) s = applyAction(s, { kind: 'fold' });
    }
    expect(buttons).toEqual([3, 1, 2, 3]);
  });

  it('deals 52 distinct cards each hand from the seeded rng', () => {
    const s = startHand(newTournament({ seed: 11, playerIds: ['a', 'b', 'c', 'd', 'e', 'f'], handsPerLevel: 10 }));
    const all = [...s.players.flatMap((p) => p.hole ?? []), ...s.deck];
    expect(new Set(all).size).toBe(52);
    const again = startHand(newTournament({ seed: 11, playerIds: ['a', 'b', 'c', 'd', 'e', 'f'], handsPerLevel: 10 }));
    expect(again.players.map((p) => p.hole)).toEqual(s.players.map((p) => p.hole));
  });
});
