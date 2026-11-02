import { rankOf, suitOf, type Card } from '../engine/cards';

/*
 * Preflop hand table: the 169 starting-hand classes ordered by their
 * all-in equity against one random hand (per mille, 60 000 samples each,
 * computed with this repo's evaluator). Pairs are 'QQ', suited 'AKs',
 * offsuit 'AKo'.
 */
const EQUITY_TABLE =
  'AA:853 KK:825 QQ:799 JJ:774 TT:750 99:719 88:690 AKs:675 AQs:663 77:660 AKo:652 AJs:652 ATs:648 ' +
  'AQo:646 AJo:636 66:633 KQs:632 A9s:627 KJs:626 ATo:624 A8s:620 KTs:618 A7s:612 KQo:611 A9o:610 ' +
  'KJo:609 55:602 QJs:602 A8o:599 A5s:599 K9s:599 A6s:598 KTo:596 QTs:593 A7o:590 A4s:589 A3s:582 ' +
  'K8s:581 QJo:580 A6o:578 K9o:577 JTs:577 K7s:576 Q9s:576 A5o:574 A2s:573 QTo:573 K6s:569 44:568 ' +
  'A4o:567 A3o:562 K5s:560 K8o:560 Q8s:559 J9s:554 JTo:553 Q9o:553 K7o:552 A2o:551 K4s:550 K6o:543 ' +
  'J8s:542 Q7s:540 K3s:540 T9s:538 33:537 Q8o:536 Q6s:536 K2s:532 K5o:531 J9o:531 Q5s:529 T8s:524 ' +
  'K4o:522 Q4s:520 J7s:519 K3o:516 Q7o:515 J8o:514 T9o:514 Q6o:513 Q3s:511 98s:510 T7s:506 J6s:506 ' +
  'K2o:503 22:503 Q2s:502 J7o:501 Q5o:500 T8o:500 J5s:500 T6s:492 J4s:492 97s:490 Q4o:489 J3s:482 ' +
  '87s:481 Q3o:481 J6o:480 98o:480 J2s:476 T7o:475 T5s:474 96s:474 Q2o:471 J5o:470 T4s:466 J4o:465 ' +
  '86s:464 97o:464 T6o:461 T3s:459 95s:459 76s:455 87o:453 J3o:452 T2s:449 85s:447 T5o:444 J2o:441 ' +
  '96o:441 94s:438 75s:437 T4o:435 86o:432 93s:431 65s:429 95o:429 T3o:428 84s:426 92s:422 76o:421 ' +
  '64s:416 54s:416 74s:415 T2o:413 85o:413 83s:410 94o:408 82s:405 75o:403 53s:401 65o:400 84o:400 ' +
  '73s:398 93o:398 63s:394 92o:388 74o:386 43s:384 54o:380 52s:380 64o:379 72s:379 62s:376 83o:375 ' +
  '82o:369 42s:369 73o:365 53o:363 32s:362 63o:361 43o:350 72o:346 52o:345 62o:341 42o:333 32o:325 ';

const RANKS = '23456789TJQKA';

/** Class name of two hole cards: 'AKs', 'T9o', '77'. */
export function handClass(a: Card, b: Card): string {
  const ra = rankOf(a);
  const rb = rankOf(b);
  const hi = Math.max(ra, rb);
  const lo = Math.min(ra, rb);
  const name = RANKS[hi - 2] + RANKS[lo - 2];
  if (hi === lo) return name;
  return name + (suitOf(a) === suitOf(b) ? 's' : 'o');
}

const combos = (cls: string) => (cls.length === 2 ? 6 : cls.endsWith('s') ? 4 : 12);

/*
 * Ranking used for decisions: the equity order, nudged for multiway
 * playability (pairs set-mine, suited and connected hands make draws).
 */
function playability(cls: string, equity: number): number {
  if (cls.length === 2) return equity + 0.02;
  const hi = RANKS.indexOf(cls[0]);
  const lo = RANKS.indexOf(cls[1]);
  const gap = hi - lo;
  let bonus = cls.endsWith('s') ? 0.012 : 0;
  if (gap === 1) bonus += 0.012;
  else if (gap === 2) bonus += 0.005;
  return equity + bonus;
}

const EQUITY = new Map<string, number>();
for (const item of EQUITY_TABLE.trim().split(/\s+/)) {
  const [cls, pm] = item.split(':');
  EQUITY.set(cls, Number(pm) / 1000);
}

/** Percentile per class: 1 = AA, near 0 = 32o, weighted by the number of combos. */
const PERCENTILE = new Map<string, number>();
{
  const ordered = [...EQUITY.entries()]
    .map(([cls, eq]) => ({ cls, score: playability(cls, eq) }))
    .sort((a, b) => b.score - a.score);
  let better = 0;
  for (const { cls } of ordered) {
    const n = combos(cls);
    PERCENTILE.set(cls, 1 - (better + n / 2) / 1326);
    better += n;
  }
}

// Card-pair lookup (52 × 52) so equity sampling can test ranges without string work.
const PAIR_STRENGTH = new Float32Array(52 * 52);
for (let a = 0; a < 52; a += 1) {
  for (let b = 0; b < 52; b += 1) {
    if (a !== b) PAIR_STRENGTH[a * 52 + b] = PERCENTILE.get(handClass(a, b)) as number;
  }
}

/** Starting-hand strength percentile in [0, 1] (1 = best). */
export function preflopStrength(a: Card, b: Card): number {
  return PAIR_STRENGTH[a * 52 + b];
}

/** Heads-up all-in equity against a random hand. */
export function equityVsRandom(a: Card, b: Card): number {
  return EQUITY.get(handClass(a, b)) as number;
}

export const HAND_CLASSES: readonly string[] = [...EQUITY.keys()];
