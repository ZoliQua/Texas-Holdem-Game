import { formatNumber, type Lang } from '../arcade';
import { cardLabel, rankOf, suitOf, type Card } from '../engine/cards';
import type { Action, ActionKind, LogEvent } from '../engine/types';
import { translator, type MessageKey, type Tr } from '../i18n';

/** 1240 → '1,240' / '1240' / '1.240': chip amounts with the language's digit grouping. */
export function formatChips(n: number, lang: Lang = 'en'): string {
  return formatNumber(Math.round(n), lang);
}

export const cardsLabel = (cs: readonly Card[]) => cs.map(cardLabel).join(' ');

const CALLOUT_KEY: Record<ActionKind, MessageKey> = {
  fold: 'coFold', check: 'coCheck', call: 'coCall', bet: 'coBet', raise: 'coRaise', allIn: 'coAllIn',
};
const LOG_KEY: Record<ActionKind, MessageKey> = {
  fold: 'logFold', check: 'logCheck', call: 'logCall', bet: 'logBet', raise: 'logRaise', allIn: 'logAllIn',
};
const LOG_YOU_KEY: Record<ActionKind, MessageKey> = {
  fold: 'logFoldYou', check: 'logCheckYou', call: 'logCallYou', bet: 'logBetYou', raise: 'logRaiseYou', allIn: 'logAllInYou',
};

/** The chips shown with an action: the call amount, the bet / raise-to total, or the all-in total. */
function actionAmount(a: Action, to: number, lang: Lang): string {
  switch (a.kind) {
    case 'fold':
    case 'check':
      return '';
    case 'call':
      return formatChips(a.amount ?? 0, lang);
    case 'bet':
    case 'raise':
      return formatChips(a.amount ?? to, lang);
    case 'allIn':
      return formatChips(to, lang);
  }
}

/** The bubble text of an action: 'Raises to 120', 'Calls 60', 'All-in 845'. */
export function actionText(a: Action, to: number, lang: Lang = 'en'): string {
  return translator(lang)(CALLOUT_KEY[a.kind], { n: actionAmount(a, to, lang) });
}

/** A log line for an action: 'Bruno raises to 300', 'You call 250'. */
export function actionLogLine(a: Action, to: number, who: { you: true } | { you: false; name: string }, lang: Lang = 'en'): string {
  const tr = translator(lang);
  const n = actionAmount(a, to, lang);
  return who.you ? tr(LOG_YOU_KEY[a.kind], { n }) : tr(LOG_KEY[a.kind], { n, name: who.name });
}

/** Short call-out for an event at a seat, or null. */
export function calloutFor(e: LogEvent, lang: Lang = 'en'): { id: string; text: string } | null {
  const tr = translator(lang);
  if (e.t === 'act') return { id: e.id, text: actionText(e.action, e.to, lang) };
  if (e.t === 'blind') return { id: e.id, text: tr('coBlind', { n: formatChips(e.amount, lang) }) };
  if (e.t === 'show') return { id: e.id, text: handValueText(e.value, lang) };
  if (e.t === 'return') return { id: e.id, text: tr('coReturn', { n: formatChips(e.amount, lang) }) };
  return null;
}

/** 1 → '1st' in English, '1.' in Hungarian and German. */
export const ordinal = (n: number, lang: Lang = 'en') => {
  if (lang !== 'en') return `${n}.`;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/** 'Flush, K-high' → 'a flush, K-high'; 'Pair of Aces' → 'a pair of Aces'. */
export function withArticle(value: string): string {
  const lower = value.charAt(0).toLowerCase() + value.slice(1);
  if (/^(two pair|three|four|high card)/i.test(value)) return lower;
  return `a ${lower}`;
}

/** The hand value as it reads after "wins … with": English adds an article, the others use the name as is. */
export function handValuePhrase(value: string, lang: Lang = 'en'): string {
  return lang === 'en' ? withArticle(value) : handValueText(value, lang);
}

const EN_PLURAL: Record<string, number> = {
  Twos: 2, Threes: 3, Fours: 4, Fives: 5, Sixes: 6, Sevens: 7, Eights: 8, Nines: 9, Tens: 10, Jacks: 11, Queens: 12, Kings: 13, Aces: 14,
};

/** The evaluator's English hand value, re-worded in `lang` (stored values stay English; unknown text is returned as is). */
export function handValueText(value: string, lang: Lang = 'en'): string {
  if (lang === 'en') return value;
  const tr = translator(lang);
  const pl = (word: string): string | null => {
    const r = EN_PLURAL[word];
    return r === undefined ? null : tr(`pl${r}` as MessageKey);
  };
  const rank = '(A|K|Q|J|10|[2-9])';
  const plural = '([A-Z][a-z]+)';
  const rules: [RegExp, (m: RegExpMatchArray) => string | null][] = [
    [/^Royal flush$/, () => tr('hvRoyal')],
    [new RegExp(`^Straight flush, ${rank}-high$`), (m) => tr('hvStraightFlush', { r: m[1] })],
    [new RegExp(`^Four of a kind, ${plural}$`), (m) => (pl(m[1]) ? tr('hvQuads', { p: pl(m[1]) as string }) : null)],
    [
      new RegExp(`^Full house, ${plural} over ${plural}$`),
      (m) => (pl(m[1]) && pl(m[2]) ? tr('hvFullHouse', { p: pl(m[1]) as string, q: pl(m[2]) as string }) : null),
    ],
    [new RegExp(`^Flush, ${rank}-high$`), (m) => tr('hvFlush', { r: m[1] })],
    [new RegExp(`^Straight, ${rank}-high$`), (m) => tr('hvStraight', { r: m[1] })],
    [new RegExp(`^Three of a kind, ${plural}$`), (m) => (pl(m[1]) ? tr('hvTrips', { p: pl(m[1]) as string }) : null)],
    [new RegExp(`^Two pair, ${rank} and ${rank}$`), (m) => tr('hvTwoPair', { r: m[1], s: m[2] })],
    [new RegExp(`^Pair of ${plural}$`), (m) => (pl(m[1]) ? tr('hvPair', { p: pl(m[1]) as string }) : null)],
    [new RegExp(`^High card, ${rank}$`), (m) => tr('hvHigh', { r: m[1] })],
  ];
  for (const [re, make] of rules) {
    const m = value.match(re);
    if (m) return make(m) ?? value;
  }
  return value;
}

const RANK_KEY: Record<number, MessageKey> = { 11: 'rank11', 12: 'rank12', 13: 'rank13', 14: 'rank14' };
const SUIT_KEY: Record<string, MessageKey> = { s: 'suitS', h: 'suitH', d: 'suitD', c: 'suitC' };

/** Spoken card name: 'Queen of hearts', 'Kőr dáma', 'Herz Dame'. */
export function cardNameText(c: Card, tr: Tr): string {
  const r = rankOf(c);
  return tr('cardName', { rank: RANK_KEY[r] ? tr(RANK_KEY[r]) : String(r), suit: tr(SUIT_KEY[suitOf(c)]) });
}
