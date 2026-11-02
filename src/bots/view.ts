import type { Card } from '../engine/cards';
import { blindsForLevel } from '../engine/blinds';
import { legalActions, potSize } from '../engine/hand';
import type { PlayerStats } from '../engine/stats';
import type { LegalActions, LogEvent, Street, TableState } from '../engine/types';

export type BotSeatView = { id: string; stack: number; bet: number; folded: boolean; allIn: boolean; out: boolean };

/**
 * Everything a bot may know when it decides: public table information plus
 * its own two hole cards. There is deliberately no field for anybody else's
 * cards or for the deck, so bot code cannot cheat even by accident.
 */
export type BotView = {
  me: string;
  hole: Card[];
  board: Card[];
  /** Seat order, the same as the table's. */
  players: BotSeatView[];
  /** Chips in the middle (all streets, including the current bets). */
  pots: number;
  legal: LegalActions;
  street: Street;
  /** Seat index of the button. */
  button: number;
  bb: number;
  /** Public events of the current hand (blinds, deals, actions). */
  history: LogEvent[];
  /**
   * Public tendencies observed earlier in the tournament (counts of the
   * actions everybody at the table could see). Never contains cards.
   */
  reads: Record<string, PlayerStats>;
};

const NO_ACTIONS: LegalActions = { canCheck: false, callAmount: 0, minRaiseTo: null, maxRaiseTo: 0 };

/** The only bridge from the table to bot code. */
export function toBotView(s: TableState, id: string, reads: Readonly<Record<string, PlayerStats>> = {}): BotView {
  const me = s.players.find((p) => p.id === id);
  if (!me) throw new Error(`No player ${id}`);
  const myTurn = s.toAct !== null && s.players[s.toAct].id === id;
  return {
    me: id,
    hole: me.hole ? [...me.hole] : [],
    board: [...s.board],
    players: s.players.map((p) => ({
      id: p.id,
      stack: p.stack,
      bet: p.bet,
      folded: p.folded,
      allIn: p.allIn,
      out: p.out,
    })),
    pots: potSize(s),
    legal: myTurn ? legalActions(s) : NO_ACTIONS,
    street: s.street,
    button: s.button,
    bb: blindsForLevel(s.level).bb,
    // Shown cards are public, but they only exist after the betting; leave them out entirely.
    history: s.events
      .filter((e) => e.t !== 'show')
      .map((e) => (e.t === 'deal' ? { ...e, board: [...e.board] } : e.t === 'act' ? { ...e, action: { ...e.action } } : { ...e })),
    reads: Object.fromEntries(Object.entries(reads).map(([k, v]) => [k, { ...v }])),
  };
}

/* Small helpers on a view (pure, used by decisions and tells). */

export const myIndex = (v: BotView) => v.players.findIndex((p) => p.id === v.me);
export const mySeat = (v: BotView) => v.players[myIndex(v)];
export const liveOpponents = (v: BotView) => v.players.filter((p) => p.id !== v.me && !p.folded && !p.out);
export const betTo = (v: BotView) => Math.max(0, ...v.players.map((p) => p.bet));
export const toCall = (v: BotView) => v.legal.callAmount;

/** Players dealt in this hand (not out). */
export const dealtIn = (v: BotView) => v.players.filter((p) => !p.out).length;

/**
 * Position 0..1: 0 = first to act preflop (early), 1 = the button.
 * Heads-up the button is 1 and the big blind 0.
 */
export function positionOf(v: BotView): number {
  const n = v.players.length;
  const alive: number[] = [];
  for (let k = 1; k <= n; k += 1) {
    const i = (v.button + k) % n;
    if (!v.players[i].out) alive.push(i);
  }
  // alive: SB, BB, UTG, …, button (heads-up: BB, button)
  const me = alive.indexOf(myIndex(v));
  const m = alive.length;
  if (m <= 2) return me === m - 1 ? 1 : 0;
  // UTG = 0 … button = 1; blinds act last preflop but are out of position postflop.
  if (me < 2) return 0.15;
  return (me - 2) / Math.max(1, m - 3);
}

/** Actions of one player in this hand's history. */
export const actionsBy = (v: BotView, id: string) =>
  v.history.filter((e): e is Extract<LogEvent, { t: 'act' }> => e.t === 'act' && e.id === id);

/** Aggressive actions (bets / raises, including raising all-ins) in the history slice. */
function raisesIn(events: readonly LogEvent[], startMax: number): { id: string; to: number }[] {
  let max = startMax;
  const out: { id: string; to: number }[] = [];
  for (const e of events) {
    if (e.t === 'act' && e.to > max) {
      out.push({ id: e.id, to: e.to });
      max = e.to;
    }
  }
  return out;
}

/** Index just after the last 'deal' event (the start of the current street's actions). */
function streetStart(history: readonly LogEvent[]): number {
  for (let i = history.length - 1; i >= 0; i -= 1) if (history[i].t === 'deal') return i + 1;
  return 0;
}

/** Bets and raises on the current street, in order. */
export function streetRaises(v: BotView): { id: string; to: number }[] {
  const start = streetStart(v.history);
  const startMax = v.street === 'preflop' ? v.bb : 0;
  return raisesIn(v.history.slice(start), startMax);
}

/** Bets and raises on a given street of this hand. */
export function raisesOn(v: BotView, street: Street): { id: string; to: number }[] {
  const start = v.history.findIndex((e) => e.t === 'deal' && e.street === street);
  if (start < 0) return [];
  let end = v.history.findIndex((e, i) => i > start && e.t === 'deal');
  if (end < 0) end = v.history.length;
  return raisesIn(v.history.slice(start + 1, end), street === 'preflop' ? v.bb : 0);
}
