/* Shared fixtures for bot tests (not imported by the app). */
import { applyAction, startHand } from '../engine/hand';
import { makeRng } from '../engine/rng';
import { addHandStats, type PlayerStats } from '../engine/stats';
import { isTournamentOver, newTournament } from '../engine/tournament';
import type { TableState } from '../engine/types';
import { decide } from './decide';
import { ROSTER, type BotProfile } from './profiles';
import { toBotView } from './view';

/** A cheaper copy of a profile for tests (fewer equity samples). */
export const fast = (p: BotProfile, samples = 40): BotProfile => ({ ...p, samples });

export type DecisionPoint = { table: TableState; id: string; profile: BotProfile; reads: Record<string, PlayerStats> };

/**
 * Plays seeded bot-only tournaments and calls `visit` at every decision
 * (before the bot acts). Stops after `count` decisions.
 */
export function forEachDecision(
  o: { seed: number; count: number; players?: number; profiles?: readonly BotProfile[] },
  visit: (d: DecisionPoint) => void,
): void {
  const rng = makeRng(o.seed);
  let seen = 0;
  for (let t = 0; seen < o.count; t += 1) {
    const n = o.players ?? 2 + ((o.seed + t) % 5);
    const profiles = Array.from({ length: n }, (_, i) =>
      fast(o.profiles ? o.profiles[(i + t) % o.profiles.length] : ROSTER[(o.seed * 7 + t * 3 + i * 5) % ROSTER.length]),
    );
    const ids = profiles.map((p, i) => `${p.id}-${i}`);
    let table = newTournament({ seed: o.seed * 1000 + t, playerIds: ids, handsPerLevel: 8 });
    let reads: Record<string, PlayerStats> = {};
    while (!isTournamentOver(table) && seen < o.count) {
      table = startHand(table);
      while (table.toAct !== null && seen < o.count) {
        const id = table.players[table.toAct].id;
        const profile = profiles[ids.indexOf(id)];
        visit({ table, id, profile, reads });
        seen += 1;
        table = applyAction(table, decide(toBotView(table, id, reads), profile, rng));
      }
      if (table.street === 'done') reads = addHandStats(reads, table.events);
      else break;
    }
  }
}

/** The same table with every hidden card except `id`'s own shuffled around (other holes and the deck). */
export function permuteHidden(s: TableState, id: string, seed: number): TableState {
  const rng = makeRng(seed);
  const hidden: number[] = [...s.deck];
  for (const p of s.players) if (p.id !== id && p.hole) hidden.push(...p.hole);
  for (let i = hidden.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng.next() * (i + 1));
    [hidden[i], hidden[j]] = [hidden[j], hidden[i]];
  }
  let k = 0;
  const players = s.players.map((p) => (p.id !== id && p.hole ? { ...p, hole: [hidden[k++], hidden[k++]] } : p));
  return { ...s, players, deck: hidden.slice(k) };
}
