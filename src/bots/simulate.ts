import { applyAction, startHand } from '../engine/hand';
import { makeRng, type Rng } from '../engine/rng';
import { addHandStats, type PlayerStats } from '../engine/stats';
import { isTournamentOver, newTournament } from '../engine/tournament';
import type { TableState } from '../engine/types';
import { decide } from './decide';
import type { BotProfile } from './profiles';
import { toBotView } from './view';

/*
 * Bot-only play on the real engine, for tests and the simulation scripts.
 * Bots decide from `toBotView` exactly as they do in the game.
 */

export type HandRecord = {
  table: TableState;
  /** Decisions taken in this hand, per player id. */
  actions: Record<string, number>;
  /** Board reveals (flop, turn, river), including an all-in run-out. */
  streets: number;
  showdown: boolean;
};

/** Plays the current hand to the end. */
export function playHand(
  s: TableState,
  seats: ReadonlyMap<string, BotProfile>,
  rng: Rng,
  reads: Readonly<Record<string, PlayerStats>> = {},
): HandRecord {
  let table = s;
  const actions: Record<string, number> = {};
  while (table.toAct !== null) {
    const id = table.players[table.toAct].id;
    const profile = seats.get(id) as BotProfile;
    table = applyAction(table, decide(toBotView(table, id, reads), profile, rng));
    actions[id] = (actions[id] ?? 0) + 1;
  }
  const streets = table.events.filter((e) => e.t === 'deal' && e.street !== 'preflop').length;
  return { table, actions, streets, showdown: table.events.some((e) => e.t === 'show') };
}

export type TournamentResult = {
  places: Record<string, number>;
  winner: string;
  hands: number;
  stats: Record<string, PlayerStats>;
  /** Per-hand records (only when `keepHands`). */
  records: Omit<HandRecord, 'table'>[];
};

export function playTournament(o: {
  seed: number;
  profiles: readonly BotProfile[];
  /** Seat ids; default the profile ids. */
  ids?: readonly string[];
  handsPerLevel: number;
  maxHands?: number;
  keepHands?: boolean;
  /** Stop as soon as this player is out (the arcade run ends when the human busts). */
  stopWhenOut?: string;
}): TournamentResult {
  const ids = o.ids ?? o.profiles.map((p) => p.id);
  const seats = new Map(ids.map((id, i) => [id, o.profiles[i]] as const));
  const rng = makeRng((o.seed * 2654435761) >>> 0);
  let table = newTournament({ seed: o.seed, playerIds: [...ids], handsPerLevel: o.handsPerLevel });
  let stats: Record<string, PlayerStats> = {};
  const records: Omit<HandRecord, 'table'>[] = [];
  const maxHands = o.maxHands ?? 5000;
  const stopped = () => o.stopWhenOut !== undefined && table.places[o.stopWhenOut] !== undefined;
  while (!isTournamentOver(table) && table.handNo < maxHands && !stopped()) {
    table = startHand(table);
    const rec = playHand(table, seats, rng, stats);
    table = rec.table;
    stats = addHandStats(stats, table.events);
    if (o.keepHands) records.push({ actions: rec.actions, streets: rec.streets, showdown: rec.showdown });
  }
  const alive = table.players.filter((p) => !p.out);
  // A capped run ranks the survivors by stack.
  const winner = alive.reduce((a, b) => (b.stack > a.stack ? b : a)).id;
  return { places: table.places, winner, hands: table.handNo, stats, records };
}
