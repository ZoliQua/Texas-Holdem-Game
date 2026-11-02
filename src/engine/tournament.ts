import { makeRng, randInt } from './rng';
import type { PlayerState, TableState } from './types';

export const STARTING_STACK = 1500;

export function newTournament(o: { seed: number; playerIds: string[]; handsPerLevel: number }): TableState {
  if (o.playerIds.length < 2) throw new Error('A tournament needs at least two players');
  if (new Set(o.playerIds).size !== o.playerIds.length) throw new Error('Player ids must be unique');
  const rng = makeRng(o.seed);
  const players: PlayerState[] = o.playerIds.map((id) => ({
    id,
    stack: STARTING_STACK,
    bet: 0,
    committed: 0,
    hole: null,
    folded: false,
    allIn: false,
    out: false,
    acted: false,
  }));
  // The first button is drawn; `startHand` keeps it for hand 1 and rotates afterwards.
  const button = randInt(rng, players.length);
  return {
    seed: o.seed >>> 0,
    rng: rng.state(),
    deck: [],
    board: [],
    players,
    button,
    toAct: null,
    street: 'done',
    handNo: 0,
    level: 1,
    handsInLevel: 0,
    handsPerLevel: Math.max(1, Math.floor(o.handsPerLevel)),
    lastAggressor: null,
    minRaise: 0,
    betTo: 0,
    events: [],
    places: {},
  };
}

/** Σ stacks + Σ committed — constant through the whole tournament. */
export function totalChips(s: TableState): number {
  return s.players.reduce((n, p) => n + p.stack + p.committed, 0);
}

export const alivePlayers = (s: TableState) => s.players.filter((p) => !p.out);

export function isTournamentOver(s: TableState): boolean {
  return alivePlayers(s).length <= 1;
}

/** Next seat index after `from` (clockwise) whose player matches `pred`, or -1. */
export function nextSeat(players: readonly PlayerState[], from: number, pred: (p: PlayerState) => boolean): number {
  const n = players.length;
  for (let k = 1; k <= n; k += 1) {
    const i = (from + k) % n;
    if (pred(players[i])) return i;
  }
  return -1;
}

/**
 * Marks players who have no chips left as out and assigns their places.
 * Players busted on the same hand are ranked by the stack they started the
 * hand with (larger = better place); equal stacks share the better place.
 * `startStacks` maps id → chips at the start of the hand.
 * Mutates the given (already copied) players / places; returns the new `out` events.
 */
export function recordEliminations(
  players: PlayerState[],
  places: Record<string, number>,
  startStacks: Record<string, number>,
): { id: string; place: number }[] {
  const busted = players.filter((p) => !p.out && p.stack === 0);
  if (busted.length === 0) return [];
  const remaining = players.filter((p) => !p.out && p.stack > 0).length;
  const events = busted.map((p) => {
    const mine = startStacks[p.id] ?? 0;
    const better = busted.filter((q) => (startStacks[q.id] ?? 0) > mine).length;
    return { id: p.id, place: remaining + 1 + better };
  });
  events.sort((a, b) => b.place - a.place);
  for (const e of events) {
    places[e.id] = e.place;
    const p = players.find((q) => q.id === e.id) as PlayerState;
    p.out = true;
  }
  if (remaining === 1) {
    const winner = players.find((p) => !p.out) as PlayerState;
    places[winner.id] = 1;
  }
  return events;
}
