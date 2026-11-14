import { cards, type Card } from '../engine/cards';
import type { HandCategory } from '../engine/evaluate';
import type { MessageKey } from '../i18n';

export type LadderRow = {
  /** The evaluator's category (a royal flush is the best straight flush). */
  category: HandCategory;
  label: MessageKey;
  /** Five example cards, as dealt left to right. */
  cards: Card[];
  /** Per card: true when it is a kicker (does not make the hand itself). */
  kickers: boolean[];
};

const row = (category: HandCategory, label: MessageKey, cs: string, kickers = '00000'): LadderRow => ({
  category,
  label,
  cards: cards(cs),
  kickers: [...kickers].map((c) => c === '1'),
});

/** The rules' hand ladder, best hand first; the rules test checks every example with the real evaluator. */
export const HAND_LADDER: readonly LadderRow[] = [
  row('straightFlush', 'rulesHandRoyal', 'As Ks Qs Js Ts'),
  row('straightFlush', 'rulesHandStraightFlush', '9h 8h 7h 6h 5h'),
  row('quads', 'rulesHandQuads', 'Qc Qd Qh Qs 7d', '00001'),
  row('fullHouse', 'rulesHandFullHouse', 'Kd Kh Ks 9c 9d'),
  row('flush', 'rulesHandFlush', 'Ad Jd 8d 6d 2d'),
  row('straight', 'rulesHandStraight', 'Tc 9d 8s 7h 6c'),
  row('trips', 'rulesHandTrips', '7s 7h 7d Kc 2s', '00011'),
  row('twoPair', 'rulesHandTwoPair', 'Jh Js 4c 4d Ah', '00001'),
  row('pair', 'rulesHandPair', 'Th Tc Ks 8d 3h', '00111'),
  row('high', 'rulesHandHigh', 'Ac Jd 8s 6h 3c', '01111'),
];
