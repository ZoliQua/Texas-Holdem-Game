/* Shared fixtures for engine tests (not imported by the app). */
import { cards } from './cards';
import { startHand } from './hand';
import { newTournament } from './tournament';
import type { TableState } from './types';

/** A table with given stacks and button, before hand 1 (startHand keeps this button). */
export function table(stacks: number[], button = 0, level = 1, seed = 1): TableState {
  const s = newTournament({ seed, playerIds: stacks.map((_, i) => `p${i}`), handsPerLevel: 10 });
  return {
    ...s,
    button,
    level,
    players: s.players.map((p, i) => ({ ...p, stack: stacks[i], out: stacks[i] === 0 })),
  };
}

/**
 * Deals a hand and then fixes the cards: `holes[i]` for seat i ('' for out seats)
 * and the five board cards in dealing order (burn cards are taken from the rest).
 */
export function rigged(s: TableState, holes: string[], board: string): TableState {
  const dealt = startHand(s);
  const hole = holes.map((h) => (h ? cards(h) : null));
  const b = cards(board);
  const used = new Set([...hole.flat().filter((c): c is number => c !== null), ...b]);
  const rest = Array.from({ length: 52 }, (_, i) => i).filter((c) => !used.has(c));
  const deck = [rest[0], b[0], b[1], b[2], rest[1], b[3], rest[2], b[4], ...rest.slice(3)];
  return {
    ...dealt,
    deck,
    players: dealt.players.map((p, i) => ({ ...p, hole: p.out ? null : hole[i] })),
  };
}

export const ids = (s: TableState, i: number) => s.players[i].id;
