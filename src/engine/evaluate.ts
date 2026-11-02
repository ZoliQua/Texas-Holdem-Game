import { rankLabel, type Card } from './cards';

export type HandCategory =
  | 'high' | 'pair' | 'twoPair' | 'trips' | 'straight' | 'flush' | 'fullHouse' | 'quads' | 'straightFlush';

/** Higher `score` wins; equal scores split. `best` is the five cards that make the hand. */
export type HandValue = { score: number; category: HandCategory; best: Card[] };

export const CATEGORIES: readonly HandCategory[] = [
  'high', 'pair', 'twoPair', 'trips', 'straight', 'flush', 'fullHouse', 'quads', 'straightFlush',
];

/*
 * Score layout: category << 20 | five rank nibbles (most significant first).
 * Ranks are 2..14; unused nibbles are 0. Quads pack (quad, kicker), a full
 * house (trips, pair), straights only their high card (5 for the wheel).
 */
const pack = (cat: number, a = 0, b = 0, c = 0, d = 0, e = 0) =>
  (cat << 20) | (a << 16) | (b << 12) | (c << 8) | (d << 4) | e;

// Scratch buffers: the evaluator is hot (Monte Carlo equity), so it never allocates.
const counts = new Int8Array(15);
const suitMasks = new Int32Array(4);
const suitCounts = new Int8Array(4);

/** High card of the best straight in a rank bitmask (bit r = rank r), or 0. */
function straightHigh(mask: number): number {
  const m = mask & (1 << 14) ? mask | 2 : mask; // the ace also plays low
  for (let h = 14; h >= 5; h -= 1) if (((m >> (h - 4)) & 31) === 31) return h;
  return 0;
}

/** The `n` highest ranks set in `mask` (excluding `skip` ranks), packed into nibbles. */
function topRanks(mask: number, n: number, out: number[]): void {
  out.length = 0;
  for (let r = 14; r >= 2 && out.length < n; r -= 1) if (mask & (1 << r)) out.push(r);
  while (out.length < n) out.push(0);
}

const tmp: number[] = [];

/** Score only (no allocation) — the hot path used by equity sampling. 5 to 7 cards. */
export function handScore(cs: readonly Card[], n: number = cs.length): number {
  counts.fill(0);
  suitMasks.fill(0);
  suitCounts.fill(0);
  let rankMask = 0;
  for (let i = 0; i < n; i += 1) {
    const c = cs[i];
    const r = (c >> 2) + 2;
    const s = c & 3;
    counts[r] += 1;
    suitMasks[s] |= 1 << r;
    suitCounts[s] += 1;
    rankMask |= 1 << r;
  }

  // With at most 7 cards a flush excludes quads and full houses, so it is checked first.
  for (let s = 0; s < 4; s += 1) {
    if (suitCounts[s] >= 5) {
      const sh = straightHigh(suitMasks[s]);
      if (sh) return pack(8, sh);
      topRanks(suitMasks[s], 5, tmp);
      return pack(5, tmp[0], tmp[1], tmp[2], tmp[3], tmp[4]);
    }
  }

  let quad = 0;
  let t1 = 0;
  let t2 = 0;
  let p1 = 0;
  let p2 = 0;
  for (let r = 14; r >= 2; r -= 1) {
    const k = counts[r];
    if (k === 4) quad = r;
    else if (k === 3) {
      if (t1) t2 = r;
      else t1 = r;
    } else if (k === 2) {
      if (!p1) p1 = r;
      else if (!p2) p2 = r;
    }
  }

  if (quad) {
    topRanks(rankMask & ~(1 << quad), 1, tmp);
    return pack(7, quad, tmp[0]);
  }
  if (t1 && (t2 || p1)) return pack(6, t1, Math.max(t2, p1));
  const sh = straightHigh(rankMask);
  if (sh) return pack(4, sh);
  if (t1) {
    topRanks(rankMask & ~(1 << t1), 2, tmp);
    return pack(3, t1, tmp[0], tmp[1]);
  }
  if (p1 && p2) {
    topRanks(rankMask & ~(1 << p1) & ~(1 << p2), 1, tmp);
    return pack(2, p1, p2, tmp[0]);
  }
  if (p1) {
    topRanks(rankMask & ~(1 << p1), 3, tmp);
    return pack(1, p1, tmp[0], tmp[1], tmp[2]);
  }
  topRanks(rankMask, 5, tmp);
  return pack(0, tmp[0], tmp[1], tmp[2], tmp[3], tmp[4]);
}

const nibble = (score: number, i: number) => (score >> (16 - 4 * i)) & 15;
export const categoryOf = (score: number): HandCategory => CATEGORIES[score >> 20];

/** Picks the five cards behind `score` from the hand. */
function bestFive(cs: readonly Card[], score: number): Card[] {
  const cat = score >> 20;
  const byRank = (r: number, pool: readonly Card[]) => pool.filter((c) => (c >> 2) + 2 === r);
  const take: Card[] = [];
  const takeRank = (r: number, k: number, pool: readonly Card[] = cs) => {
    for (const c of byRank(r, pool)) {
      if (k === 0) break;
      if (!take.includes(c)) {
        take.push(c);
        k -= 1;
      }
    }
  };

  if (cat === 8 || cat === 5) {
    // The flush suit is the one with five or more cards.
    const suit = [0, 1, 2, 3].find((s) => cs.filter((c) => (c & 3) === s).length >= 5) as number;
    const pool = cs.filter((c) => (c & 3) === suit);
    if (cat === 8) {
      const h = nibble(score, 0);
      for (let r = h; r > h - 5; r -= 1) takeRank(r === 1 ? 14 : r, 1, pool);
    } else for (let i = 0; i < 5; i += 1) takeRank(nibble(score, i), 1, pool);
    return take;
  }
  if (cat === 4) {
    const h = nibble(score, 0);
    for (let r = h; r > h - 5; r -= 1) takeRank(r === 1 ? 14 : r, 1);
    return take;
  }
  const shape: Record<number, number[]> = { 7: [4, 1], 6: [3, 2], 3: [3, 1, 1], 2: [2, 2, 1], 1: [2, 1, 1, 1], 0: [1, 1, 1, 1, 1] };
  shape[cat].forEach((k, i) => takeRank(nibble(score, i), k));
  return take;
}

/** Best five-card hand out of 5..7 cards. */
export function evaluate7(cs: readonly Card[]): HandValue {
  if (cs.length < 5 || cs.length > 7) throw new Error(`evaluate7 needs 5..7 cards, got ${cs.length}`);
  const score = handScore(cs);
  return { score, category: categoryOf(score), best: bestFive(cs, score) };
}

const PLURAL: Record<number, string> = {
  2: 'Twos', 3: 'Threes', 4: 'Fours', 5: 'Fives', 6: 'Sixes', 7: 'Sevens', 8: 'Eights',
  9: 'Nines', 10: 'Tens', 11: 'Jacks', 12: 'Queens', 13: 'Kings', 14: 'Aces',
};

/** 'Flush, K-high', 'Two pair, Q and 9', 'Full house, Kings over Sevens'. */
export function describe(v: Pick<HandValue, 'score'>): string {
  const s = v.score;
  const a = nibble(s, 0);
  const b = nibble(s, 1);
  switch (s >> 20) {
    case 8:
      return a === 14 ? 'Royal flush' : `Straight flush, ${rankLabel(a)}-high`;
    case 7:
      return `Four of a kind, ${PLURAL[a]}`;
    case 6:
      return `Full house, ${PLURAL[a]} over ${PLURAL[b]}`;
    case 5:
      return `Flush, ${rankLabel(a)}-high`;
    case 4:
      return `Straight, ${rankLabel(a)}-high`;
    case 3:
      return `Three of a kind, ${PLURAL[a]}`;
    case 2:
      return `Two pair, ${rankLabel(a)} and ${rankLabel(b)}`;
    case 1:
      return `Pair of ${PLURAL[a]}`;
    default:
      return `High card, ${rankLabel(a)}`;
  }
}
