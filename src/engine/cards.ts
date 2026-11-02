import { shuffle, type Rng } from './rng';

export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
/** 0..51: rank = (c >> 2) + 2, suit = 'shdc'[c & 3]. */
export type Card = number;

export const SUITS: readonly Suit[] = ['s', 'h', 'd', 'c'];
export const SUIT_GLYPH: Record<Suit, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
export const SUIT_NAME: Record<Suit, string> = { s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs' };

const RANK_CHARS = '23456789TJQKA';

export const rankOf = (c: Card): Rank => ((c >> 2) + 2) as Rank;
export const suitOf = (c: Card): Suit => SUITS[c & 3];
export const makeCard = (rank: Rank, suit: Suit): Card => ((rank - 2) << 2) | SUITS.indexOf(suit);

/** 'A', 'K', 'Q', 'J', '10' … '2'. */
export function rankLabel(r: number): string {
  if (r === 14) return 'A';
  if (r === 13) return 'K';
  if (r === 12) return 'Q';
  if (r === 11) return 'J';
  return String(r);
}

/** 'A♠', '10♥'. */
export function cardLabel(c: Card): string {
  return `${rankLabel(rankOf(c))}${SUIT_GLYPH[suitOf(c)]}`;
}

/** Spoken form for screen readers: 'Ace of spades'. */
export function cardName(c: Card): string {
  const r = rankOf(c);
  const names: Record<number, string> = { 14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack' };
  return `${names[r] ?? String(r)} of ${SUIT_NAME[suitOf(c)]}`;
}

export const isCard = (v: unknown): v is Card => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 52;

/** Parses 'As', 'Td', '9c' (tests and fixtures). */
export function card(s: string): Card {
  const r = RANK_CHARS.indexOf(s[0]?.toUpperCase() ?? '');
  const suit = s[1] as Suit;
  if (s.length !== 2 || r < 0 || !SUITS.includes(suit)) throw new Error(`Bad card: ${s}`);
  return (r << 2) | SUITS.indexOf(suit);
}

/** Parses a space-separated card list: 'As Kh 7d'. */
export function cards(s: string): Card[] {
  return s.trim().split(/\s+/).filter(Boolean).map(card);
}

export function fullDeck(): Card[] {
  return Array.from({ length: 52 }, (_, i) => i);
}

export function shuffledDeck(rng: Rng): Card[] {
  return shuffle(rng, fullDeck());
}
