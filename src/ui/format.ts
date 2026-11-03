import { cardLabel, type Card } from '../engine/cards';
import type { Action, LogEvent } from '../engine/types';

/** 1 240 → '1 240' (thin space groups, like the spec). */
export function formatChips(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const cardsLabel = (cs: readonly Card[]) => cs.map(cardLabel).join(' ');

/** The bubble / log text of an action: 'Raises to 120', 'Calls 60', 'All-in 845'. */
export function actionText(a: Action, to: number): string {
  switch (a.kind) {
    case 'fold':
      return 'Folds';
    case 'check':
      return 'Checks';
    case 'call':
      return `Calls ${formatChips(a.amount ?? 0)}`;
    case 'bet':
      return `Bets ${formatChips(a.amount ?? to)}`;
    case 'raise':
      return `Raises to ${formatChips(a.amount ?? to)}`;
    case 'allIn':
      return `All-in ${formatChips(to)}`;
  }
}

/** Short call-out for an event at a seat, or null. */
export function calloutFor(e: LogEvent): { id: string; text: string } | null {
  if (e.t === 'act') return { id: e.id, text: actionText(e.action, e.to) };
  if (e.t === 'blind') return { id: e.id, text: `Blind ${formatChips(e.amount)}` };
  if (e.t === 'show') return { id: e.id, text: e.value };
  if (e.t === 'return') return { id: e.id, text: `${formatChips(e.amount)} back` };
  return null;
}

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/** Second-person form for the player's own log lines: 'raise to 120', 'call 60'. */
export function actionTextYou(a: Action, to: number): string {
  switch (a.kind) {
    case 'fold':
      return 'fold';
    case 'check':
      return 'check';
    case 'call':
      return `call ${formatChips(a.amount ?? 0)}`;
    case 'bet':
      return `bet ${formatChips(a.amount ?? to)}`;
    case 'raise':
      return `raise to ${formatChips(a.amount ?? to)}`;
    case 'allIn':
      return `go all-in for ${formatChips(to)}`;
  }
}

/** 'Flush, K-high' → 'a flush, K-high'; 'Pair of Aces' → 'a pair of Aces'. */
export function withArticle(value: string): string {
  const lower = value.charAt(0).toLowerCase() + value.slice(1);
  if (/^(two pair|three|four|high card)/i.test(value)) return lower;
  return `a ${lower}`;
}
