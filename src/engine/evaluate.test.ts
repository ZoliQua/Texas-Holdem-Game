import { describe, expect, it } from 'vitest';
import { cardLabel, cards, type Card } from './cards';
import { describe as describeHand, evaluate7, handScore, type HandCategory } from './evaluate';

const value = (s: string) => evaluate7(cards(s));

describe('evaluate7 — five-card enumeration', () => {
  it('produces the textbook category counts over all 2 598 960 hands', () => {
    const counts: Record<HandCategory, number> = {
      high: 0, pair: 0, twoPair: 0, trips: 0, straight: 0, flush: 0, fullHouse: 0, quads: 0, straightFlush: 0,
    };
    const hand: Card[] = [0, 0, 0, 0, 0];
    for (let a = 0; a < 48; a += 1) {
      hand[0] = a;
      for (let b = a + 1; b < 49; b += 1) {
        hand[1] = b;
        for (let c = b + 1; c < 50; c += 1) {
          hand[2] = c;
          for (let d = c + 1; d < 51; d += 1) {
            hand[3] = d;
            for (let e = d + 1; e < 52; e += 1) {
              hand[4] = e;
              counts[evaluate7(hand).category] += 1;
            }
          }
        }
      }
    }
    expect(counts).toEqual({
      straightFlush: 40,
      quads: 624,
      fullHouse: 3744,
      flush: 5108,
      straight: 10200,
      trips: 54912,
      twoPair: 123552,
      pair: 1098240,
      high: 1302540,
    });
  }, 30_000);
});

describe('evaluate7 — orderings', () => {
  it('the wheel is a straight that beats high cards but loses to a six-high straight', () => {
    const wheel = value('As 2d 3c 4h 5s');
    expect(wheel.category).toBe('straight');
    expect(wheel.score).toBeGreaterThan(value('As Kd Qc Jh 9s').score);
    expect(wheel.score).toBeLessThan(value('2s 3d 4c 5h 6s').score);
    expect(describeHand(wheel)).toBe('Straight, 5-high');
  });

  it('a wheel straight flush is the lowest straight flush', () => {
    expect(value('Ah 2h 3h 4h 5h').category).toBe('straightFlush');
    expect(value('Ah 2h 3h 4h 5h').score).toBeLessThan(value('2h 3h 4h 5h 6h').score);
  });

  it('category order is strict', () => {
    const order = [
      'Ks Qd 9c 7h 3s', 'Ks Kd 9c 7h 3s', 'Ks Kd 9c 9h 3s', 'Ks Kd Kc 7h 3s', '9s Td Jc Qh Ks',
      '2h 7h 9h Jh Kh', 'Ks Kd Kc 3h 3s', 'Ks Kd Kc Kh 3s', '9h Th Jh Qh Kh',
    ].map((s) => value(s).score);
    for (let i = 1; i < order.length; i += 1) expect(order[i]).toBeGreaterThan(order[i - 1]);
  });
});

/** [player A 2 cards, player B 2 cards, board 5 cards, expected winner 'A' | 'B' | 'tie'] */
const SHOWDOWNS: [string, string, string, 'A' | 'B' | 'tie', string][] = [
  ['As Kd', 'Ac Qh', 'Ah 8s 5d 3c 2s', 'A', 'kicker: K beats Q with a pair of aces'],
  ['As 9d', 'Ac 9h', 'Ah Ks Qd Jc 2s', 'tie', 'kickers equal: A-K-Q-J play'],
  ['2c 3d', '4h 5h', 'As Ks Qs Js Ts', 'tie', 'board plays a royal flush'],
  ['Kc Kd', 'Ah 7c', 'As 7d 7s 2h 2c', 'B', 'sevens full of aces beat two pair'],
  ['4c 4d', 'Ah Kc', 'Qs Qd 5s 5h 3c', 'B', 'counterfeited: the 4s fall below Q-Q-5-5, the ace kicker wins'],
  ['Ah 2h', 'Kh Qh', 'Jh 9h 4h 8c 3d', 'A', 'flush vs flush: ace-high wins'],
  ['6h 2c', 'Kh Qd', 'Jh 9h 4h 8h 3h', 'B', 'flush on the board: the K of hearts beats the 6'],
  ['Ts 9s', 'Ac Ad', '8s 7s 2d Kh 3c', 'B', 'a straight draw that missed loses to aces'],
  ['Ts 9s', 'Ac Ad', '8s 7d 6c Kh 3c', 'A', 'made straight beats aces'],
  ['Qs Qd', 'Js Jd', 'Qh Jh Jc 4s 4d', 'B', 'quads beat a full house'],
  ['Ah Kh', 'As Ks', 'Qh Jh Th Qs Js', 'A', 'royal flush beats a broadway straight'],
  ['8c 8d', '7c 7d', 'As Ah Kc Kd 2s', 'A', 'both pairs counterfeited: the 8 kicker beats the 7'],
];

describe('evaluate7 — seven-card showdowns', () => {
  it.each(SHOWDOWNS)('%s vs %s on %s → %s (%s)', (a, b, board, expected) => {
    const va = evaluate7(cards(`${a} ${board}`));
    const vb = evaluate7(cards(`${b} ${board}`));
    const result = va.score > vb.score ? 'A' : va.score < vb.score ? 'B' : 'tie';
    expect(result).toBe(expected);
    expect(va.best).toHaveLength(5);
    expect(handScore(cards(`${a} ${board}`))).toBe(va.score);
  });
});

describe('evaluate7 — best five and describe', () => {
  it('returns the five cards that make the hand', () => {
    const v = value('Ah Kh 2c 7h 9h 3h Qd');
    expect(v.category).toBe('flush');
    expect(v.best.map(cardLabel).sort()).toEqual(['3♥', '7♥', '9♥', 'A♥', 'K♥'].sort());
  });

  it('describes every category', () => {
    expect(describeHand(value('As Ks Qs Js Ts'))).toBe('Royal flush');
    expect(describeHand(value('5d 6d 7d 8d 9d'))).toBe('Straight flush, 9-high');
    expect(describeHand(value('Qs Qd Qc Qh 3s'))).toBe('Four of a kind, Queens');
    expect(describeHand(value('Ks Kd Kc 7h 7s'))).toBe('Full house, Kings over Sevens');
    expect(describeHand(value('2h 7h 9h Jh Kh'))).toBe('Flush, K-high');
    expect(describeHand(value('6s 7d 8c 9h Ts'))).toBe('Straight, 10-high');
    expect(describeHand(value('8s 8d 8c Ah 3s'))).toBe('Three of a kind, Eights');
    expect(describeHand(value('Qs Qd 9c 9h 3s'))).toBe('Two pair, Q and 9');
    expect(describeHand(value('Js Jd 9c 7h 3s'))).toBe('Pair of Jacks');
    expect(describeHand(value('As Qd 9c 7h 3s'))).toBe('High card, A');
  });
});
