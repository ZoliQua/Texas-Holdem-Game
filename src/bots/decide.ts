import type { Rng } from '../engine/rng';
import type { Action } from '../engine/types';
import { betCredit, estimateEquity, trust } from './equity';
import { preflopStrength } from './preflop';
import { madeStrength } from './strength';
import type { BotProfile } from './profiles';
import { betTo, dealtIn, liveOpponents, mySeat, positionOf, raisesOn, streetRaises, type BotView } from './view';

/*
 * Bot decisions. Everything here reads a BotView only: public information
 * plus the bot's own two cards. Style (tightness, aggression, bluff, sizing)
 * shapes *what kind* of player it is; strength (skill, samples, mistake)
 * shapes *how well* it plays that style.
 */

/*
 * Tuned constants (see scripts/sim-strength.ts and scripts/calibrate-blinds.ts):
 * heads-up looseness, the stack-off threshold and how much of it weak bots
 * ignore, the re-raise multiplier and the overall postflop bet size.
 */
const TUNE = { heads: 1.6, stack: 0.72, disc: 0.3, reraise: 2.4, size: 0.7 };

/** loose = calls too wide, passive = misses value, spew = puts chips in with nothing. */
type Mistake = 'loose' | 'passive' | 'spew' | null;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Average fold-to-bet of the live opponents as far as this bot can read it (0.45 = no read). */
function foldinessOf(v: BotView, p: BotProfile): number {
  const tend = liveOpponents(v)
    .map((o) => trust(v, o.id, p.skill))
    .filter((t): t is NonNullable<typeof t> => t !== null);
  return tend.length ? tend.reduce((n, t) => n + lerp(0.45, t.foldToBet, t.w), 0) / tend.length : 0.45;
}

/** Effective stack in big blinds: the smaller of mine and the biggest live opponent's. */
function effectiveBB(v: BotView): number {
  const me = mySeat(v);
  const mine = me.stack + me.bet;
  const theirs = Math.max(0, ...liveOpponents(v).map((p) => p.stack + p.bet));
  return Math.min(mine, theirs) / v.bb;
}

const raiseTo = (amount: number): Action => ({ kind: 'raise', amount: Math.round(amount) });
const CALL: Action = { kind: 'call' };
const CHECK: Action = { kind: 'check' };
const FOLD: Action = { kind: 'fold' };
const ALL_IN: Action = { kind: 'allIn' };

/** Turns an intention into a legal action for this view. */
export function legalize(a: Action, v: BotView): Action {
  const { legal } = v;
  const me = mySeat(v);
  switch (a.kind) {
    case 'fold':
      return legal.canCheck ? CHECK : FOLD;
    case 'check':
    case 'call':
      return legal.canCheck ? CHECK : CALL;
    case 'allIn':
      if (legal.minRaiseTo !== null || me.stack <= legal.callAmount) return ALL_IN;
      return legal.canCheck ? CHECK : CALL;
    case 'bet':
    case 'raise': {
      if (legal.minRaiseTo === null) return legal.canCheck ? CHECK : CALL;
      const amount = clamp(Math.round(a.amount ?? legal.minRaiseTo), legal.minRaiseTo, legal.maxRaiseTo);
      // Close to the whole stack: just move in.
      if (amount >= legal.maxRaiseTo || amount - me.bet >= 0.85 * me.stack) return ALL_IN;
      return { kind: betTo(v) === 0 ? 'bet' : 'raise', amount };
    }
  }
}

/** A balanced reference style; skill pulls every style towards it, weakness exaggerates the style. */
const BALANCED = { tightness: 0.6, aggression: 0.7, bluff: 0.14, sizing: 0.55 };

/** How far a bot's style deviates from balanced: 1.06 (easy) … 0.58 (hard). */
export const styleSpread = (skill: number) => 1.3 - 0.8 * skill;

function effective(p: BotProfile): BotProfile {
  const k = styleSpread(p.skill);
  const pull = (key: keyof typeof BALANCED) => clamp(BALANCED[key] + (p[key] - BALANCED[key]) * k, 0.01, 0.99);
  return { ...p, tightness: pull('tightness'), aggression: pull('aggression'), bluff: pull('bluff'), sizing: pull('sizing') };
}

export function decide(view: BotView, profile: BotProfile, rng: Rng): Action {
  const p = effective(profile);
  if (view.hole.length !== 2) return legalize(FOLD, view);
  let mistake: Mistake = null;
  if (rng.next() < p.mistake) {
    const u = rng.next();
    mistake = u < 0.4 ? 'loose' : u < 0.7 ? 'passive' : 'spew';
  }
  const raw = view.street === 'preflop' ? preflop(view, p, rng, mistake) : postflop(view, p, rng, mistake);
  return legalize(raw, view);
}

// ── Preflop ──────────────────────────────────────────────────────────

function preflop(v: BotView, p: BotProfile, rng: Rng, mistake: Mistake): Action {
  const [a, b] = v.hole;
  const n = dealtIn(v);
  const heads = n === 2;
  const pos = positionOf(v);
  const raises = streetRaises(v);
  const eff = effectiveBB(v);
  const me = mySeat(v);

  // Weak players misjudge their cards a little; a "loose" mistake overrates them.
  let s = preflopStrength(a, b) + (rng.next() * 2 - 1) * (1 - p.skill) * 0.14;
  if (mistake === 'loose') s += 0.18;

  if (mistake === 'spew' && rng.next() < 0.5) {
    return raises.length ? raiseTo(raises[raises.length - 1].to * 2.8) : raiseTo(v.bb * (3 + rng.next() * 2));
  }
  if (eff <= 13) return pushFold(v, p, rng, s, eff, raises.length);

  // Share of hands this bot plays: style first, position as far as it understands it.
  let f = 0.08 + (1 - p.tightness) * 0.62;
  f *= heads ? TUNE.heads : 1 + (pos - 0.5) * 0.8 * (0.3 + 0.7 * p.skill);
  f *= 1 + Math.max(0, 6 - n) * 0.07;
  // Opponents who give up too often get raised more (a skilled reader only).
  const foldy = foldinessOf(v, p);
  if (raises.length === 0) f *= clamp(foldy / 0.45, 0.75, 1.5);
  f = clamp(f, 0.04, 0.96);

  const limpers = v.history.filter((e) => e.t === 'act' && e.action.kind === 'call').length;
  const openSize = v.bb * (heads ? 2 + p.sizing * 0.6 : 2.2 + p.sizing * 0.8 + limpers);

  if (raises.length === 0) {
    if (v.legal.canCheck) {
      // Big blind option: raise the best of its range, otherwise take the free flop.
      if (s >= 1 - f * 0.3 && rng.next() < 0.3 + 0.7 * p.aggression) return raiseTo(v.bb * (3 + limpers));
      return CHECK;
    }
    if (s < 1 - f) {
      // Steal from late position now and then.
      if (pos >= 0.7 && rng.next() < p.bluff * 0.7 * (0.5 + p.skill)) return raiseTo(openSize);
      return FOLD;
    }
    const raiseProb = 0.2 + 0.8 * p.aggression;
    if (s > 1 - f * 0.25 || rng.next() < raiseProb) return raiseTo(openSize);
    return CALL;
  }

  // Facing a raise (or more).
  const last = raises[raises.length - 1];
  const toCall = v.legal.callAmount;
  const potOdds = toCall / (v.pots + toCall);
  const reRaised = raises.length >= 2;
  // Each further raise narrows the continuing range sharply.
  let cont = f * ([0.58, 0.3, 0.14, 0.07][Math.min(3, raises.length - 1)] as number);
  if (p.style === 'station') cont *= 1 + 0.35 * styleSpread(p.skill);
  cont *= 1 + (0.33 - potOdds) * 1.2;
  // Big raises relative to the stack call for tighter continues (if the bot notices).
  cont *= 1 - clamp((last.to / (me.stack + me.bet) - 0.25) * p.skill, 0, 0.5);
  // A skilled reader adjusts to how often this raiser really raises.
  const raiser = trust(v, last.id, p.skill);
  if (raiser) {
    const expected = heads ? 0.35 : 0.18;
    cont *= lerp(1, clamp(raiser.pfr / expected, 0.5, 2), raiser.w);
  }
  cont = clamp(cont, 0.02, 0.9);
  const valueFrac = cont * (0.12 + 0.26 * p.aggression) * (reRaised ? 0.6 : 1);

  if (s >= 1 - valueFrac) return raiseTo(last.to * (TUNE.reraise + p.sizing * 0.5) + (v.pots - last.to - me.bet) * 0.3);
  if (s >= 1 - cont) return CALL;
  if (!reRaised && pos >= 0.3 && rng.next() < p.bluff * 0.3) return raiseTo(last.to * 3);
  return FOLD;
}

/** Short-stack play: all-in or fold, with ranges blended between style habit and a near-equilibrium chart by skill. */
function pushFold(v: BotView, p: BotProfile, rng: Rng, s: number, eff: number, raises: number): Action {
  const behind = Math.max(1, liveOpponents(v).length);
  if (raises === 0) {
    const chart = clamp((6.5 / eff) / (1 + 0.32 * (behind - 1)), 0.08, 1);
    const habit = clamp(0.06 + (1 - p.tightness) * 0.8, 0.05, 1);
    const frac = lerp(habit, chart, p.skill);
    if (s >= 1 - frac) return ALL_IN;
    if (v.legal.canCheck) return CHECK;
    // A rare limp from the passive styles.
    if (p.aggression < 0.3 && s >= 1 - frac * 1.4 && rng.next() < 0.5) return CALL;
    return FOLD;
  }
  const toCall = v.legal.callAmount;
  const odds = toCall / (v.pots + toCall);
  const chart = clamp((3.4 / eff) * (1 + (0.4 - odds)) / (1 + 0.45 * (behind - 1)), 0.05, 1);
  const habit = clamp(0.04 + (1 - p.tightness) * 0.55 + (p.style === 'station' ? 0.1 * styleSpread(p.skill) : 0), 0.04, 1);
  const frac = lerp(habit, chart, p.skill);
  if (s >= 1 - frac) return ALL_IN;
  return FOLD;
}

// ── Postflop ─────────────────────────────────────────────────────────

/** Own-hand draw check: four to a flush or an open-ended straight using a hole card. */
export function hasDraw(hole: readonly number[], board: readonly number[]): boolean {
  if (board.length >= 5 || board.length < 3) return false;
  const all = [...hole, ...board];
  for (let suit = 0; suit < 4; suit += 1) {
    const n = all.filter((c) => (c & 3) === suit).length;
    if (n === 4 && hole.some((c) => (c & 3) === suit)) return true;
  }
  const ranks = new Set(all.map((c) => (c >> 2) + 2));
  if (ranks.has(14)) ranks.add(1);
  const holeRanks = hole.map((c) => (c >> 2) + 2);
  for (let lo = 1; lo <= 11; lo += 1) {
    const run = [lo, lo + 1, lo + 2, lo + 3];
    if (run.every((r) => ranks.has(r)) && run.some((r) => holeRanks.includes(r === 1 ? 14 : r))) return true;
  }
  return false;
}

function postflop(v: BotView, p: BotProfile, rng: Rng, mistake: Mistake): Action {
  const opponents = liveOpponents(v);
  const opps = opponents.length;
  const skilled = p.skill >= 0.45;
  // Skilled bots split their samples: equity against the current range, and against the hands that would call a bet.
  const equity = estimateEquity(v, p, rng, skilled ? Math.ceil(p.samples / 2) : p.samples);
  const noise = (rng.next() * 2 - 1) * (1 - p.skill) * 0.2;
  const eq = clamp(equity + noise, 0, 1);
  const pot = v.pots;
  const me = mySeat(v);
  const river = v.street === 'river';
  const draw = hasDraw(v.hole, v.board);

  // What a skilled reader knows about the opponents' habits.
  const foldiness = foldinessOf(v, p);
  const bluffMul = clamp(foldiness / 0.45, 0.2, 2) ** p.skill;

  const sizing = (base: number) => pot * clamp(base * TUNE.size + p.sizing * 0.3 * TUNE.size + (rng.next() - 0.5) * 0.1, 0.25, 1);
  // Pot control: the bigger the pot against the stacks, the stronger a hand has to be to keep betting.
  const eff = Math.max(1, Math.min(me.stack, Math.max(0, ...opponents.map((o) => o.stack))));
  const spr = pot / eff;
  const streetStep = v.street === 'flop' ? 0 : v.street === 'turn' ? 0.04 : 0.08;
  const control = streetStep + clamp(spr, 0, 1.5) * (0.04 + 0.1 * p.skill);
  // Bets that would put most of the stack in are kept for strong hands; otherwise they shrink.
  const capBet = (amount: number, strength: number) => {
    if (amount < 0.5 * me.stack || (strength >= 0.75 && madeStrength(v.hole, v.board) >= 0.7)) return amount;
    return Math.min(amount, 0.35 * me.stack);
  };

  if (mistake === 'spew' && v.legal.minRaiseTo !== null) {
    return raiseTo(Math.max(betTo(v) * 2.5, pot * 0.7));
  }

  if (v.legal.canCheck) {
    // Value: weak bots compare raw equity, skilled bots their equity against calling hands.
    const vsCallers = skilled ? estimateEquity(v, p, rng, Math.ceil(p.samples / 2), { connect: 0.9 }) + noise : eq;
    const valueEq = lerp(eq, vsCallers, p.skill);
    // Thinner value against players who call too much, thicker against those who fold.
    const valueAt = 0.53 + 0.06 * (opps - 1) - (p.aggression - 0.5) * 0.1 + control + (foldiness - 0.45) * 0.3;
    if (valueEq >= valueAt) {
      if (mistake === 'passive') return CHECK;
      if (rng.next() < 0.45 + 0.55 * p.aggression) {
        // Against habitual callers bet bigger for value.
        const bigger = foldiness < 0.35 ? 0.15 * p.skill : 0;
        return { kind: 'bet', amount: capBet(sizing((river ? 0.3 : v.street === 'turn' ? 0.25 : 0.2) + bigger), valueEq) };
      }
      return CHECK;
    }
    const bluffChance =
      (p.bluff * (opps === 1 ? 1 : 0.45) * (river ? 0.8 : 1.1) + (draw ? 0.2 * p.aggression : 0)) * bluffMul;
    if (rng.next() < bluffChance) return { kind: 'bet', amount: capBet(sizing(0.2), 0) };
    return CHECK;
  }

  const toCall = v.legal.callAmount;
  const potOdds = toCall / (pot + toCall);
  // Calling most of the stack commits it; a skilled bot wants more for that.
  const commit = clamp(toCall / Math.max(1, me.stack) - 0.25, 0, 0.75) * 0.25 * (0.6 + 0.4 * p.skill);
  // Stations call lighter; weak players call a bit lighter too; multiway needs more.
  // Each earlier barrel from the bettors makes the bot a little more careful.
  const barrels = (['flop', 'turn'] as const)
    .filter((st) => st !== v.street)
    .reduce((n, st) => n + (raisesOn(v, st).some((r) => opponents.some((o) => o.id === r.id)) ? 1 : 0), 0);
  const margin =
    (p.style === 'station' ? -0.07 * styleSpread(p.skill) : 0) +
    (opps - 1) * 0.025 -
    (1 - p.skill) * 0.05 +
    (draw && !river ? -0.04 : 0) +
    // Skilled bots already read strength into the range; weaker ones use rules of thumb.
    (commit + barrels * 0.03) * (1 - 0.8 * p.skill);
  const raiseAt = 0.78 + 0.05 * (opps - 1) - (p.aggression - 0.5) * 0.16 + control;
  const canRaise = v.legal.minRaiseTo !== null;
  const facing = betTo(v);

  // Putting most of the stack in: a skilled bot checks its hand against the hands that would do the same.
  const raiseAmount = facing * 2.5 + (pot - facing - me.bet) * 0.3;
  const stackOff = toCall >= 0.45 * me.stack || raiseAmount - me.bet >= 0.6 * me.stack;
  const stackEq =
    stackOff && skilled ? lerp(eq, estimateEquity(v, p, rng, Math.ceil(p.samples / 2), { strong: 0.9 }) + noise, p.skill) : eq;

  const raiseCommits = raiseAmount - me.bet >= 0.6 * me.stack;
  const raiseOk = !raiseCommits || madeStrength(v.hole, v.board) + noise >= 0.7;
  if (raiseOk && stackEq >= raiseAt && eq >= raiseAt && canRaise && mistake !== 'passive' && rng.next() < 0.25 + 0.65 * p.aggression) {
    return raiseTo(raiseAmount);
  }
  // Rule of thumb everybody follows (loosely when weak): the stack goes in with real hands only.
  const made = madeStrength(v.hole, v.board) + noise;
  const stackOffAt =
    clamp(TUNE.stack - (1 - p.tightness) * 0.12 - (p.style === 'station' ? 0.06 : 0) - p.bluff * 0.15, 0.3, 0.75) *
    (TUNE.disc + (1 - TUNE.disc) * p.skill);
  // Against maniacs a skilled bot is willing to stack off lighter.
  const credit = Math.min(1, ...opponents.filter((o) => o.bet > 0).map((o) => betCredit(v, o.id, p.skill)));
  const disciplined = !stackOff || made >= stackOffAt * credit || (draw && !river && potOdds < 0.3);
  if (disciplined && Math.min(eq, stackEq + 0.08) >= potOdds + margin) return CALL;
  // Calling too wide: weak bots pay off whatever the price.
  if (mistake === 'loose') return CALL;
  if (!river && canRaise && rng.next() < p.bluff * (draw ? 0.35 : 0.12) * bluffMul) return raiseTo(facing * 2.8);
  return FOLD;
}
