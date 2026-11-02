import { handScore } from '../engine/evaluate';
import type { Rng } from '../engine/rng';
import { preflopStrength } from './preflop';
import type { BotProfile } from './profiles';
import { actionsBy, liveOpponents, raisesOn, type BotView } from './view';

/**
 * What a bot believes about one opponent's holding, read from that
 * opponent's public actions this hand (and, for skilled bots, from the
 * tendencies it has shown so far).
 */
export type RangeRead = {
  /** Share of starting hands the opponent is assumed to hold (1 = any two cards). */
  top: number;
  /** Probability that a sampled hand must at least connect with the board. */
  connect: number;
  /** Probability that a sampled hand must be strong on this board (top pair or better, or a flush draw). */
  strong: number;
};

/** How much a reader trusts observed tendencies: needs skill and a sample. */
export type Tendencies = { pfr: number; vpip: number; af: number; foldToBet: number; w: number };

export function trust(view: BotView, oppId: string, skill: number): Tendencies | null {
  const s = view.reads[oppId];
  if (!s || s.hands < 6) return null;
  const w = skill * skill * Math.min(1, s.hands / 40);
  return {
    pfr: s.pfr / s.hands,
    vpip: s.vpip / s.hands,
    af: s.calls === 0 ? s.aggr : s.aggr / s.calls,
    foldToBet: s.faced < 4 ? 0.45 : s.folds / s.faced,
    w,
  };
}

/**
 * How much a bet from this opponent means, as far as the reader can tell:
 * very aggressive players bet with anything (below 1), a bet from a passive
 * player means business (above 1). 1 without a read.
 */
export function betCredit(view: BotView, oppId: string, skill: number): number {
  const t = trust(view, oppId, skill);
  if (!t) return 1;
  if (t.af > 2) return lerp(1, Math.max(0.25, 2 / t.af), t.w);
  if (t.af < 1) return lerp(1, 1.5, t.w);
  return 1;
}

/** A read of one opponent; weak readers assume random hands. */
export function readRange(view: BotView, oppId: string, skill: number): RangeRead {
  const pre = raisesOn(view, 'preflop');
  const raisesByOpp = pre.filter((r) => r.id === oppId).length;
  const acts = actionsBy(view, oppId);
  const heads = view.players.filter((p) => !p.out).length <= 2;
  const t = trust(view, oppId, skill);

  let top = 1;
  if (raisesByOpp >= 2) top = 0.06;
  else if (raisesByOpp === 1) {
    const opened = pre[0].id === oppId;
    top = opened ? 0.22 : 0.09;
    // Observed raising frequency tells a skilled reader how wide this really is.
    if (t) top = lerp(top, Math.min(1, opened ? t.pfr * 1.1 : t.pfr * 0.45), t.w);
  } else if (acts.some((a) => a.action.kind === 'call' || a.action.kind === 'allIn')) {
    top = pre.length > 0 ? 0.32 : 0.6;
    if (t) top = lerp(top, Math.min(1, t.vpip * (pre.length > 0 ? 0.75 : 1.1)), t.w);
  }
  if (heads && !t) top = Math.min(1, top * 1.8);
  // A big all-in from a short stack is wider.
  const opp = view.players.find((p) => p.id === oppId);
  if (opp?.allIn && opp.bet + opp.stack <= view.bb * 12) top = Math.min(1, top * 1.6);

  let barrels = 0;
  for (const street of ['flop', 'turn', 'river'] as const) {
    if (raisesOn(view, street).some((r) => r.id === oppId)) barrels += 1;
  }
  let connect = barrels >= 1 ? 0.7 : 0;
  let strong = barrels >= 2 ? 0.45 + 0.2 * (barrels - 2) : 0;
  if (barrels > 0) {
    const factor = betCredit(view, oppId, skill);
    connect = Math.min(0.95, connect * factor);
    strong = Math.min(0.95, strong * factor);
  }
  return { top: 1 - skill * (1 - top), connect: connect * skill, strong: strong * skill };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Flush (draw) with at least one hole card: `need` cards of one suit. */
function suited(a: number, b: number, board: readonly number[], need: number): boolean {
  const sa = a & 3;
  const sb = b & 3;
  let na = sa === sb ? 2 : 1;
  let nb = 1;
  for (const c of board) {
    if ((c & 3) === sa) na += 1;
    if ((c & 3) === sb) nb += 1;
  }
  return na >= need || (sa !== sb && nb >= need);
}

/** True when two hole cards connect with the board: a pocket pair, a pair with it, or a flush (draw). */
function connects(a: number, b: number, board: readonly number[]): boolean {
  const ra = a >> 2;
  const rb = b >> 2;
  if (ra === rb) return true;
  for (const c of board) {
    const r = c >> 2;
    if (r === ra || r === rb) return true;
  }
  return suited(a, b, board, board.length < 5 ? 4 : 5);
}

/** Top pair or better (an overpair, two pair, a set) or a flush (draw). */
function strongOn(a: number, b: number, board: readonly number[]): boolean {
  const ra = a >> 2;
  const rb = b >> 2;
  let top = 0;
  let hitA = false;
  let hitB = false;
  for (const c of board) {
    const r = c >> 2;
    if (r > top) top = r;
    if (r === ra) hitA = true;
    if (r === rb) hitB = true;
  }
  if (ra === rb) return ra >= top || hitA;
  if (hitA && hitB) return true;
  if ((hitA && ra === top) || (hitB && rb === top)) return true;
  return suited(a, b, board, board.length < 5 ? 4 : 5);
}

const scratchMe = [0, 0, 0, 0, 0, 0, 0];
const scratchOpp = [0, 0, 0, 0, 0, 0, 0];

/**
 * Monte Carlo estimate of the bot's share of the pot at showdown against the
 * live opponents' estimated ranges, with `profile.samples` samples.
 */
export function estimateEquity(
  view: BotView,
  profile: BotProfile,
  rng: Rng,
  samples = profile.samples,
  /**
   * Narrows every opponent further: `connect` = against hands that would call a bet,
   * `strong` = against hands that would put their stack in.
   */
  narrow: { connect?: number; strong?: number } = {},
): number {
  const opps = liveOpponents(view);
  if (opps.length === 0) return 1;
  const known = new Set([...view.hole, ...view.board]);
  const deck: number[] = [];
  for (let c = 0; c < 52; c += 1) if (!known.has(c)) deck.push(c);
  const reads = opps.map((o) => {
    const r = readRange(view, o.id, profile.skill);
    const credit = Math.min(1, betCredit(view, o.id, profile.skill));
    return {
      ...r,
      connect: Math.max(r.connect, (narrow.connect ?? 0) * credit),
      strong: Math.max(r.strong, (narrow.strong ?? 0) * credit),
    };
  });
  const boardNeed = 5 - view.board.length;
  const n = deck.length;
  const board = view.board;

  scratchMe[0] = view.hole[0];
  scratchMe[1] = view.hole[1];
  for (let i = 0; i < board.length; i += 1) {
    scratchMe[2 + i] = board[i];
    scratchOpp[2 + i] = board[i];
  }

  const oppHoles = new Int32Array(opps.length * 2);
  let share = 0;
  for (let s = 0; s < samples; s += 1) {
    let used = 0; // deck[0..used) are dealt this sample
    const take = (j: number) => {
      const t = deck[used];
      deck[used] = deck[j];
      deck[j] = t;
      used += 1;
      return deck[used - 1];
    };
    for (let k = 0; k < opps.length; k += 1) {
      const read = reads[k];
      const needStrong = read.strong > 0 && rng.next() < read.strong;
      const needConnect = !needStrong && read.connect > 0 && rng.next() < read.connect;
      let i1 = used + Math.floor(rng.next() * (n - used));
      let i2 = used + Math.floor(rng.next() * (n - used - 1));
      if (i2 >= i1) i2 += 1;
      // Rejection sampling into the read range; give up after a few tries (keeps it unbiased enough and fast).
      for (let tries = 0; tries < 8; tries += 1) {
        const a = deck[i1];
        const b = deck[i2];
        const okRange = read.top >= 1 || preflopStrength(a, b) >= 1 - read.top;
        const okBoard = needStrong ? strongOn(a, b, board) : !needConnect || connects(a, b, board);
        if (okRange && okBoard) break;
        i1 = used + Math.floor(rng.next() * (n - used));
        i2 = used + Math.floor(rng.next() * (n - used - 1));
        if (i2 >= i1) i2 += 1;
      }
      const lo = Math.min(i1, i2);
      const hi = Math.max(i1, i2);
      // Take the higher index first so the lower one is not displaced.
      const c2 = take(hi);
      const c1 = take(lo === used - 1 ? hi : lo);
      oppHoles[k * 2] = c1;
      oppHoles[k * 2 + 1] = c2;
    }
    for (let i = 0; i < boardNeed; i += 1) {
      const c = take(used + Math.floor(rng.next() * (n - used)));
      scratchMe[2 + board.length + i] = c;
      scratchOpp[2 + board.length + i] = c;
    }
    const mine = handScore(scratchMe, 7);
    let ties = 1;
    let lost = false;
    for (let k = 0; k < opps.length; k += 1) {
      scratchOpp[0] = oppHoles[k * 2];
      scratchOpp[1] = oppHoles[k * 2 + 1];
      const theirs = handScore(scratchOpp, 7);
      if (theirs > mine) {
        lost = true;
        break;
      }
      if (theirs === mine) ties += 1;
    }
    if (!lost) share += 1 / ties;
  }
  return share / samples;
}
