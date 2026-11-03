import { describe, expect, it } from 'vitest';
import { legalActions } from '../engine/hand';
import { isHoldemSession } from './persist';
import { advance, isPlayerTurn, type GameState } from './state';
import { startGame, untilPlayerTurn } from './testkit';

const clone = (s: GameState): GameState => JSON.parse(JSON.stringify(s));

/** The player's simple policy for these tests: check, else call small bets, else fold. */
function playerMove(s: GameState): GameState {
  const legal = legalActions(s.table);
  const kind = legal.canCheck ? 'check' : legal.callAmount <= s.table.betTo / 2 + 40 ? 'call' : 'fold';
  return advance(s, { type: 'player', action: { kind } });
}

describe('isHoldemSession', () => {
  it('accepts its own snapshots at every step of a seeded 50-hand game', () => {
    let s = startGame({ format: 'sixMax', difficulty: 'easy' }, 13);
    let snapshots = 0;
    const check = (x: GameState) => {
      expect(isHoldemSession(clone(x))).toBe(true);
      snapshots += 1;
    };
    while (s.table.handNo <= 50 && s.phase !== 'finished') {
      s = untilPlayerTurn(s, check);
      if (s.phase === 'finished') break;
      s = playerMove(s);
      check(s);
    }
    expect(snapshots).toBeGreaterThan(200);
  });

  it('accepts a heads-up game too', () => {
    let s = startGame({ format: 'headsUp', difficulty: 'hard' }, 2);
    s = untilPlayerTurn(s);
    expect(isHoldemSession(clone(s))).toBe(true);
  });

  describe('rejects tampering', () => {
    const base = () => clone(untilPlayerTurn(startGame({}, 4)));

    it('a stack changed by one chip', () => {
      const s = base();
      s.table.players[0].stack += 1;
      expect(isHoldemSession(s)).toBe(false);
    });

    it('a duplicated card', () => {
      const s = base();
      s.table.players[0].hole = [s.table.players[1].hole?.[0] as number, s.table.players[0].hole?.[1] as number];
      expect(isHoldemSession(s)).toBe(false);
    });

    it('an out-of-range or impossible toAct', () => {
      const s = base();
      s.table.toAct = 9;
      expect(isHoldemSession(s)).toBe(false);
      const t = base();
      const folded = t.table.players.findIndex((p) => p.folded);
      if (folded >= 0) {
        t.table.toAct = folded;
        expect(isHoldemSession(t)).toBe(false);
      }
    });

    it('a missing setup or an edited bot', () => {
      const s = base() as Partial<GameState>;
      delete s.setup;
      expect(isHoldemSession(s)).toBe(false);
      const t = base();
      t.bots[0] = { ...t.bots[0], skill: 1, mistake: 0 };
      expect(isHoldemSession(t)).toBe(false);
    });

    it('junk', () => {
      expect(isHoldemSession(null)).toBe(false);
      expect(isHoldemSession({})).toBe(false);
      expect(isHoldemSession([])).toBe(false);
    });
  });

  it('a restore at the player’s decision keeps the same cards, pot and log', () => {
    const s = untilPlayerTurn(startGame({ format: 'sixMax' }, 31));
    expect(isPlayerTurn(s)).toBe(true);
    const saved = JSON.parse(JSON.stringify({ data: s }));
    expect(isHoldemSession(saved.data)).toBe(true);
    const restored: GameState = saved.data;
    expect(restored.table.players[0].hole).toEqual(s.table.players[0].hole);
    expect(restored.table.board).toEqual(s.table.board);
    expect(restored.table.players.map((p) => p.committed)).toEqual(s.table.players.map((p) => p.committed));
    expect(restored.log).toEqual(s.log);
    expect(isPlayerTurn(restored)).toBe(true);
    expect(legalActions(restored.table)).toEqual(legalActions(s.table));
    // No new deal happened: the same hand number and deck.
    expect(restored.table.handNo).toBe(s.table.handNo);
    expect(restored.table.deck).toEqual(s.table.deck);
  });
});
