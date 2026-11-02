import { handScore } from '../engine/evaluate';
import type { Card } from '../engine/cards';

/**
 * Rough absolute strength of a made hand on this board, 0..1, judged only
 * from the bot's own cards: how much the hole cards add to the board.
 * Used for "how much would I put my stack in with this" rules of thumb.
 */
export function madeStrength(hole: readonly Card[], board: readonly Card[]): number {
  if (board.length < 3) return 0;
  const score = handScore([...hole, ...board]);
  const cat = score >> 20;
  const boardRanks = board.map((c) => (c >> 2) + 2).sort((a, b) => b - a);
  const top = boardRanks[0];
  const holeRanks = hole.map((c) => (c >> 2) + 2);
  const boardCat = board.length >= 5 ? handScore(board) >> 20 : 0;
  if (cat >= 6) return boardCat >= 6 ? 0.6 : 0.97; // full house or better (not just the board's)
  if (cat === 5) return boardCat === 5 ? 0.55 : 0.9; // flush
  if (cat === 4) return boardCat === 4 ? 0.5 : 0.88; // straight
  if (cat === 3) {
    const pocket = holeRanks[0] === holeRanks[1];
    return pocket ? 0.86 : holeRanks.some((r) => boardRanks.includes(r)) ? 0.72 : 0.3; // set / trips / board trips
  }
  if (cat === 2) {
    const both = holeRanks.every((r) => boardRanks.includes(r)) && holeRanks[0] !== holeRanks[1];
    if (both) return 0.75;
    const pocketOver = holeRanks[0] === holeRanks[1] && holeRanks[0] > top;
    if (pocketOver) return 0.62;
    return holeRanks.some((r) => r === top) ? 0.5 : 0.35; // one pair plus a board pair
  }
  if (cat === 1) {
    const pairRank = (score >> 16) & 15;
    if (!holeRanks.includes(pairRank)) return 0.08; // the board's pair
    if (holeRanks[0] === holeRanks[1]) return pairRank > top ? 0.6 : 0.3;
    if (pairRank === top) {
      const kicker = holeRanks.find((r) => r !== pairRank) ?? 0;
      return 0.45 + (kicker >= 12 ? 0.08 : kicker >= 10 ? 0.04 : 0);
    }
    return pairRank >= boardRanks[1] ? 0.32 : 0.22;
  }
  return 0.05;
}
