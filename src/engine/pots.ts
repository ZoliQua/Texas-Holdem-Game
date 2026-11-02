import type { PlayerState } from './types';

export type Pot = { amount: number; eligible: string[] };

/**
 * Main pot and side pots from what everybody committed this hand. Every
 * all-in level of a live player cuts a pot; folded players' chips count but
 * they are not eligible. Eligible ids keep seat order.
 */
export function buildPots(players: readonly PlayerState[]): Pot[] {
  const live = players.filter((p) => !p.folded && p.committed > 0);
  const levels = [...new Set(live.map((p) => p.committed))].sort((a, b) => a - b);
  const pots: Pot[] = [];
  let prev = 0;
  for (const level of levels) {
    let amount = 0;
    for (const p of players) amount += Math.min(p.committed, level) - Math.min(p.committed, prev);
    const eligible = live.filter((p) => p.committed >= level).map((p) => p.id);
    if (amount > 0) pots.push({ amount, eligible });
    prev = level;
  }
  // Chips a folded player put in above every live player's level (cannot happen after
  // uncalled bets are returned, but never lose a chip) go to the last pot.
  const total = players.reduce((n, p) => n + p.committed, 0);
  const counted = pots.reduce((n, p) => n + p.amount, 0);
  if (total > counted) {
    if (pots.length > 0) pots[pots.length - 1].amount += total - counted;
    else pots.push({ amount: total - counted, eligible: players.filter((p) => !p.folded).map((p) => p.id) });
  }
  return pots;
}

/** Sum of all chips in the middle (committed this hand). */
export const potTotal = (players: readonly PlayerState[]) => players.reduce((n, p) => n + p.committed, 0);
