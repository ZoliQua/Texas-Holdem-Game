import { describe, expect, it } from 'vitest';
import { card, cardLabel, cards, rankOf, shuffledDeck, suitOf } from './cards';
import { makeRng, rngFromState } from './rng';

describe('cards', () => {
  it('encodes rank and suit in 0..51', () => {
    expect(rankOf(0)).toBe(2);
    expect(suitOf(0)).toBe('s');
    expect(rankOf(51)).toBe(14);
    expect(suitOf(51)).toBe('c');
    expect(suitOf(card('Qh'))).toBe('h');
    expect(rankOf(card('Td'))).toBe(10);
  });

  it('labels cards with rank and suit glyph', () => {
    expect(cardLabel(card('As'))).toBe('A♠');
    expect(cardLabel(card('Th'))).toBe('10♥');
    expect(cardLabel(card('2d'))).toBe('2♦');
    expect(cardLabel(card('Jc'))).toBe('J♣');
  });

  it('parses a card list and rejects junk', () => {
    expect(cards('As Kh').map(cardLabel)).toEqual(['A♠', 'K♥']);
    expect(() => card('Xx')).toThrow();
  });
});

describe('seeded rng and deck', () => {
  it('the same seed gives the same deck, a different seed a different one', () => {
    const a = shuffledDeck(makeRng(42));
    const b = shuffledDeck(makeRng(42));
    const c = shuffledDeck(makeRng(43));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect([...a].sort((x, y) => x - y)).toEqual(Array.from({ length: 52 }, (_, i) => i));
  });

  it('rngFromState(state()) continues the same sequence', () => {
    const r = makeRng(7);
    for (let i = 0; i < 10; i += 1) r.next();
    const resumed = rngFromState(r.state());
    const expected = Array.from({ length: 20 }, () => r.next());
    expect(Array.from({ length: 20 }, () => resumed.next())).toEqual(expected);
  });

  it('produces values in [0, 1)', () => {
    const r = makeRng(1);
    for (let i = 0; i < 10_000; i += 1) {
      const v = r.next();
      expect(v >= 0 && v < 1).toBe(true);
    }
  });
});
