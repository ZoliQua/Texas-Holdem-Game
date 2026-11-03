import type { Difficulty } from '../bots/profiles';
import type { Format } from '../engine/schedule';

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
