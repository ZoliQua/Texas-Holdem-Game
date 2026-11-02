import { handScore } from '../engine/evaluate';
import type { Rng } from '../engine/rng';
import type { Action } from '../engine/types';
import { hasDraw } from './decide';
import { preflopStrength } from './preflop';
import type { BotProfile, TellKind } from './profiles';
import { type BotView } from './view';

/*
 * Visible tells. A tell is driven only by the bot's *own* hand (from its
 * BotView) and by the action it has already chosen; it runs after `decide`
 * and never feeds back into it.
 */

export type TellCue = {
  kind: TellKind;
  /** When the cue starts, ms after the bot starts thinking (Normal speed). */
  atMs: number;
  durationMs: number;
  /** Total thinking time before the action (Normal speed). */
  thinkMs: number;
};

/** What each cue "means" when it is honest. */
export type HandBucket = 'strong' | 'weak' | 'bluff' | 'draw' | 'medium';

export const TELL_MEANING: Record<TellKind, HandBucket> = {
  earTwitch: 'strong',
  glance: 'strong',
  leanBack: 'weak',
  chipShuffle: 'weak',
  longStare: 'bluff',
  snapCall: 'draw',
};

const aggressive = (a: Action) => a.kind === 'bet' || a.kind === 'raise' || a.kind === 'allIn';

/** Bucket of the bot's own hand and chosen action. Uses nothing but its own cards and the board. */
export function handBucket(view: BotView, decided: Action): HandBucket {
  const [a, b] = view.hole;
  let strength: 'strong' | 'medium' | 'weak';
  if (view.board.length < 3) {
    const pf = preflopStrength(a, b);
    strength = pf >= 0.85 ? 'strong' : pf <= 0.45 ? 'weak' : 'medium';
  } else {
    const all = [...view.hole, ...view.board];
    const cat = handScore(all) >> 20;
    const boardCat = view.board.length >= 5 ? handScore(view.board) >> 20 : 0;
    // A hand only counts as made when the hole cards improve on the board.
    strength = cat >= 2 && cat > boardCat ? 'strong' : cat === 1 && boardCat === 0 ? 'medium' : 'weak';
    if (strength !== 'strong' && hasDraw(view.hole, view.board) && decided.kind === 'call') return 'draw';
  }
  if (strength === 'weak' && aggressive(decided)) return 'bluff';
  return strength;
}

/** How hard the decision looks (0..1): facing bets, big prices, later streets. */
function difficulty(view: BotView): number {
  const call = view.legal.callAmount;
  const price = call > 0 ? Math.min(1, call / Math.max(1, view.pots)) : 0;
  const street = { preflop: 0, flop: 0.25, turn: 0.4, river: 0.55, showdown: 0, done: 0 }[view.street];
  return Math.min(1, street + price * 0.6 + (call > 0 ? 0.1 : 0));
}

/** Visible thinking time at Normal speed: 600–2000 ms, longer for harder spots. */
export function thinkingMs(view: BotView, p: BotProfile, rng: Rng): number {
  const d = difficulty(view);
  const base = 650 + d * 900 + (1 - p.aggression) * 150;
  const jitter = (rng.next() - 0.5) * 300;
  return Math.round(Math.min(2000, Math.max(600, base + jitter)));
}

const OPPOSITE: Record<HandBucket, HandBucket[]> = {
  strong: ['weak', 'bluff', 'draw'],
  weak: ['strong'],
  bluff: ['strong'],
  draw: ['strong'],
  medium: [],
};

/**
 * The cue a bot shows for this decision, or null.
 * - A cue only appears in "tellable" spots: the bot has a tell for its real bucket.
 * - With probability `tellHonesty` it shows that matching tell.
 * - With probability `reverseTells` it shows an opposite tell, on purpose.
 * - Otherwise easy and medium bots slip with their other tell (noise), while
 *   hard bots simply keep a straight face.
 */
export function tellFor(view: BotView, p: BotProfile, decided: Action, rng: Rng): TellCue | null {
  let thinkMs = thinkingMs(view, p, rng);
  const rate = 0.3 + 0.55 * p.tellHonesty;
  if (rng.next() >= rate) return null;
  const truth = handBucket(view, decided);
  const matching = p.tells.filter((k) => TELL_MEANING[k] === truth);
  if (matching.length === 0) return null;
  const others = p.tells.filter((k) => TELL_MEANING[k] !== truth);
  const opposite = others.filter((k) => OPPOSITE[truth].includes(TELL_MEANING[k]));

  const u = rng.next();
  let kind: TellKind | undefined;
  if (u < p.tellHonesty) kind = matching[Math.floor(rng.next() * matching.length)];
  else if (u < p.tellHonesty + p.reverseTells) kind = (opposite.length ? opposite : others)[0];
  else if (p.reverseTells === 0) kind = others[0];
  if (!kind) return null;

  // Timing tells change the thinking time; the others are animations inside it.
  if (kind === 'snapCall') thinkMs = 600;
  if (kind === 'longStare') thinkMs = Math.max(thinkMs, 1800);
  else if (kind !== 'snapCall') thinkMs = Math.max(thinkMs, 1200); // room for a visible cue
  const durationMs = kind === 'snapCall' ? 0 : kind === 'longStare' ? Math.round(thinkMs * 0.7) : 900;
  const atMs = kind === 'longStare' ? 120 : Math.round(Math.max(0, (thinkMs - durationMs) * (0.25 + rng.next() * 0.4)));
  return { kind, atMs, durationMs, thinkMs };
}
