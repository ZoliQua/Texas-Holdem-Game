import { describe, expect, it } from 'vitest';
import { legalActions } from '../engine/hand';
import { totalChips } from '../engine/tournament';
import type { Action } from '../engine/types';
import { advance, isPlayerTurn, LOG_HANDS, PLAYER_ID, type GameState } from './state';
import { runBots, startGame, untilPlayerTurn } from './testkit';

const start = (format: 'headsUp' | 'sixMax' = 'sixMax', seed = 7) => startGame({ format }, seed);

describe('advance', () => {
  it('start seats the player at seat 0 with five bots and deals the first hand', () => {
    const s = start();
    expect(s.phase).toBe('playing');
    expect(s.table.players.map((p) => p.id)[0]).toBe(PLAYER_ID);
    expect(s.bots).toHaveLength(5);
    expect(s.table.players[0].hole).toHaveLength(2);
    expect(totalChips(s.table)).toBe(9000);
    expect(s.log).toHaveLength(1);
  });

  it('ignores a player action when it is not the player’s turn', () => {
    let s = start();
    s = runBots(s);
    if (isPlayerTurn(s)) s = advance(s, { type: 'player', action: { kind: 'fold' } });
    s = runBots(s);
    const before = s;
    if (!isPlayerTurn(before)) expect(advance(before, { type: 'player', action: { kind: 'call' } })).toBe(before);
  });

  it('applies only one of two identical player actions sent back to back (pending nonce)', () => {
    // Find a spot where the player acts and would act again right after (a check that closes a street).
    let s = untilPlayerTurn(start('headsUp', 3));
    const legal = legalActions(s.table);
    const a: Action = legal.canCheck ? { kind: 'check' } : { kind: 'call' };
    const once = advance(s, { type: 'player', action: a });
    const twice = advance(once, { type: 'player', action: a });
    expect(once.pending).not.toBeNull();
    expect(twice).toBe(once);
    const acts = (x: GameState) => x.table.events.filter((e) => e.t === 'act' && e.id === PLAYER_ID).length;
    expect(acts(twice)).toBe(acts(s) + 1);
    // A stale settle does nothing; the right one unlocks the table.
    expect(advance(once, { type: 'settle', nonce: 999 })).toBe(once);
    s = advance(once, { type: 'settle', nonce: once.pending as number });
    expect(s.pending).toBeNull();
  });

  it('a bot action for the wrong seat or while animating is ignored', () => {
    const s = runBots(start());
    const other = s.bots.find((b) => s.table.toAct === null || s.table.players[s.table.toAct].id !== b.id);
    expect(advance(s, { type: 'bot', id: other?.id ?? 'x', action: { kind: 'fold' } })).toBe(s);
    expect(advance(s, { type: 'bot', id: PLAYER_ID, action: { kind: 'fold' } })).toBe(s);
  });

  it('a busted player finishes the run with the right place, without playing the rest out', () => {
    let s = start('sixMax', 21);
    let guard = 0;
    while (s.phase !== 'finished' && guard < 3000) {
      s = untilPlayerTurn(s);
      if (s.phase === 'finished') break;
      // The player shoves every hand: the run ends quickly one way or the other.
      s = advance(s, { type: 'player', action: { kind: 'allIn' } });
      guard += 1;
    }
    expect(s.phase).toBe('finished');
    const place = s.playerPlace as number;
    expect(place).toBeGreaterThanOrEqual(1);
    expect(place).toBeLessThanOrEqual(6);
    if (place > 1) {
      expect(s.table.places[PLAYER_ID]).toBe(place);
      // Bots may still be several: the tournament was not simulated to the end.
      expect(s.table.players.filter((p) => !p.out).length).toBe(place - 1);
    }
  });

  it('keeps the log to the last 200 hands', () => {
    let s = untilPlayerTurn(start('headsUp', 5));
    s = advance(s, { type: 'player', action: { kind: 'fold' } });
    s = runBots(s);
    expect(s.phase).toBe('handOver');
    const filler = Array.from({ length: LOG_HANDS }, (_, i) => [{ t: 'hand' as const, hand: -i, sb: 10, bb: 20, button: PLAYER_ID, level: 1 }]);
    s = { ...s, log: [...filler.slice(1), s.log[s.log.length - 1]] };
    expect(s.log).toHaveLength(LOG_HANDS);
    const second = s.log[1];
    s = advance(s, { type: 'nextHand' });
    expect(s.log).toHaveLength(LOG_HANDS);
    expect(s.log[0]).toBe(second);
    expect(s.log[LOG_HANDS - 1]).toEqual(s.table.events);
  });

  it('newTournament returns to the setup with the same choices', () => {
    const s = advance(start('headsUp'), { type: 'newTournament' });
    expect(s.phase).toBe('setup');
    expect(s.setup.format).toBe('headsUp');
  });
});
