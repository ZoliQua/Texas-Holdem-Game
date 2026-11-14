import type { Difficulty } from '../bots/profiles';
import type { Format } from '../engine/schedule';
import type { PlayerState, TableState } from '../engine/types';

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

/** Finish ranks a place only after this many completed hands; before that it ranks 0 (no free 1st place from Deal → Finish). */
export const MIN_FINISH_HANDS = 10;

/** Hands already played to the end: the current hand counts once it is over. */
export function completedHands(t: Pick<TableState, 'handNo' | 'street'>): number {
  return t.street === 'done' ? t.handNo : Math.max(0, t.handNo - 1);
}

/**
 * The place `id` holds right now among the players still in: the number of them (`id` included) with at
 * least as many chips. Mid-hand, `id`'s own chips already in the pot count as forfeited (only the stack
 * behind counts), while everybody else counts stack + chips put in this hand — so Finish never escapes a
 * losing hand. Between hands nothing is committed and these are just the stacks. Equal chips take the worse
 * place; busted players already rank below everybody still in.
 */
export function standingPlace(players: readonly PlayerState[], id: string): number {
  const me = players.find((p) => p.id === id);
  if (!me) return players.length;
  const mine = me.stack;
  return players.filter((p) => !p.out && (p.id === id || p.stack + p.committed >= mine)).length;
}

/** What Finish ranks right now: the standing place's points once MIN_FINISH_HANDS hands are completed, else 0. */
export function finishScore(o: { difficulty: Difficulty; format: Format; table: TableState }, id: string): number {
  if (completedHands(o.table) < MIN_FINISH_HANDS) return 0;
  return tournamentScore({ difficulty: o.difficulty, format: o.format, place: standingPlace(o.table.players, id) });
}
