import type { Difficulty } from '../bots/profiles';
import type { Format } from '../engine/schedule';
import type { PlayerState } from '../engine/types';

/** Points for a tournament; difficulty and placement count, speed does not. */
export const BASE_POINTS: Record<Difficulty, number> = { easy: 1000, medium: 2500, hard: 5000 };
/** Share of the base by finishing place at a 6-max table. */
export const SIX_MAX_SHARES = [1, 0.6, 0.4, 0.25, 0.1, 0] as const;
/** A heads-up win beats one opponent only. */
export const HEADS_UP_WIN_SHARE = 0.4;
export const MAX_SCORE = 5000;

export function tournamentScore(o: { difficulty: Difficulty; format: Format; place: number }): number {
  const base = BASE_POINTS[o.difficulty];
  const share = o.format === 'headsUp' ? (o.place === 1 ? HEADS_UP_WIN_SHARE : 0) : (SIX_MAX_SHARES[o.place - 1] ?? 0);
  return Math.round(base * share);
}

/**
 * The place `id` holds right now among the players still in: one plus the number of them with more
 * chips (stack + chips already put in this hand, i.e. the stacks as they stood before the current
 * hand). Equal stacks share the better place; busted players already rank below everybody still in.
 */
export function standingPlace(players: readonly PlayerState[], id: string): number {
  const chips = (p: PlayerState) => p.stack + p.committed;
  const me = players.find((p) => p.id === id);
  if (!me) return players.length;
  return 1 + players.filter((p) => !p.out && p.id !== id && chips(p) > chips(me)).length;
}
