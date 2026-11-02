import { shuffledDeck } from './cards';
import { describe, evaluate7 } from './evaluate';
import { blindsForLevel } from './blinds';
import { buildPots } from './pots';
import { rngFromState } from './rng';
import { alivePlayers, nextSeat, recordEliminations } from './tournament';
import type { Action, LegalActions, LogEvent, PlayerState, Street, TableState } from './types';

/*
 * No-limit hold'em hand engine. Every function is pure: it copies what it
 * changes and appends to `events`. One `applyAction` call runs everything that
 * follows automatically — closing the street, dealing, the all-in run-out, the
 * showdown, awarding pots and eliminations — so a hand only ever waits on a
 * player's decision (`toAct`) or on `startHand`.
 */

const clonePlayers = (ps: readonly PlayerState[]) => ps.map((p) => ({ ...p, hole: p.hole ? [...p.hole] : null }));

const inHand = (p: PlayerState) => !p.out && !p.folded;
const canAct = (p: PlayerState) => inHand(p) && !p.allIn;

/** Deals the next hand: rotates the button, levels up, posts blinds (heads-up rule) and deals hole cards. */
export function startHand(prev: TableState): TableState {
  if (prev.street !== 'done') throw new Error('The current hand is not finished');
  if (alivePlayers(prev).length < 2) throw new Error('The tournament is over');

  const s: TableState = { ...prev, players: clonePlayers(prev.players), events: [], board: [] };
  for (const p of s.players) {
    p.bet = 0;
    p.committed = 0;
    p.hole = null;
    p.folded = p.out;
    p.allIn = false;
    p.acted = false;
  }

  s.handNo = prev.handNo + 1;
  if (prev.handNo > 0) {
    s.button = nextSeat(s.players, prev.button, (p) => !p.out);
    if (prev.handsInLevel >= prev.handsPerLevel) {
      s.level = prev.level + 1;
      s.handsInLevel = 0;
    }
  } else if (s.players[s.button].out) {
    s.button = nextSeat(s.players, s.button, (p) => !p.out);
  }
  s.handsInLevel += 1;

  const { sb, bb } = blindsForLevel(s.level);
  const alive = alivePlayers(s).length;
  // Heads-up: the button posts the small blind.
  const sbSeat = alive === 2 ? s.button : nextSeat(s.players, s.button, (p) => !p.out);
  const bbSeat = nextSeat(s.players, sbSeat, (p) => !p.out);

  s.events.push({ t: 'hand', hand: s.handNo, sb, bb, button: s.players[s.button].id, level: s.level });
  const post = (seat: number, amount: number) => {
    const p = s.players[seat];
    const paid = Math.min(p.stack, amount);
    p.stack -= paid;
    p.bet = paid;
    p.committed = paid;
    if (p.stack === 0) p.allIn = true;
    s.events.push({ t: 'blind', id: p.id, amount: paid });
  };
  post(sbSeat, sb);
  post(bbSeat, bb);

  const rng = rngFromState(prev.rng);
  const deck = shuffledDeck(rng);
  s.rng = rng.state();
  // Two rounds of one card each, starting left of the button.
  const order: number[] = [];
  for (let k = 1; k <= s.players.length; k += 1) {
    const i = (s.button + k) % s.players.length;
    if (!s.players[i].out) order.push(i);
  }
  for (const i of order) s.players[i].hole = [deck.shift() as number];
  for (const i of order) (s.players[i].hole as number[]).push(deck.shift() as number);
  s.deck = deck;
  s.events.push({ t: 'deal', street: 'preflop', board: [] });

  s.street = 'preflop';
  s.betTo = bb;
  s.minRaise = bb;
  s.lastAggressor = null;
  s.toAct = null;
  // Preflop the first player after the big blind acts (heads-up: the button).
  return proceed(s, bbSeat);
}

/** What the player to act may do. */
export function legalActions(s: TableState): LegalActions {
  if (s.toAct === null) return { canCheck: false, callAmount: 0, minRaiseTo: null, maxRaiseTo: 0 };
  const p = s.players[s.toAct];
  const toCall = Math.max(0, s.betTo - p.bet);
  const maxRaiseTo = p.bet + p.stack;
  // A player who already acted may raise again only if the bet has since grown by
  // at least one full raise (a short all-in alone does not reopen the betting).
  const reopened = !p.acted || toCall >= s.minRaise;
  const canRaise = p.stack > toCall && reopened && othersCanRespond(s, s.toAct);
  return {
    canCheck: toCall === 0,
    callAmount: Math.min(toCall, p.stack),
    minRaiseTo: canRaise ? Math.min(s.betTo + s.minRaise, maxRaiseTo) : null,
    maxRaiseTo: canRaise ? maxRaiseTo : Math.min(maxRaiseTo, s.betTo),
  };
}

/** True when somebody else in the hand still has chips to call a raise with. */
function othersCanRespond(s: TableState, seat: number): boolean {
  return s.players.some((q, i) => i !== seat && canAct(q));
}

/** Applies the acting player's decision. Throws on an illegal action. */
export function applyAction(prev: TableState, a: Action): TableState {
  if (prev.toAct === null) throw new Error('Nobody is to act');
  const legal = legalActions(prev);
  const s: TableState = { ...prev, players: clonePlayers(prev.players), events: [...prev.events] };
  const seat = prev.toAct;
  const p = s.players[seat];
  const toCall = Math.max(0, s.betTo - p.bet);

  let kind = a.kind;
  let target: number; // total bet on this street after the action
  switch (kind) {
    case 'fold':
      p.folded = true;
      target = p.bet;
      break;
    case 'check':
      if (!legal.canCheck) throw new Error('Cannot check facing a bet');
      target = p.bet;
      break;
    case 'call':
      if (toCall === 0) {
        kind = 'check';
        target = p.bet;
      } else target = p.bet + legal.callAmount;
      break;
    case 'allIn':
      target = p.bet + p.stack;
      if (target > s.betTo && legal.minRaiseTo === null) throw new Error('Raising is not allowed now');
      break;
    case 'bet':
    case 'raise': {
      if (legal.minRaiseTo === null) throw new Error('Raising is not allowed now');
      const amount = Math.floor(a.amount ?? Number.NaN);
      if (!Number.isFinite(amount)) throw new Error('A bet needs an amount');
      if (amount > legal.maxRaiseTo) throw new Error(`Bet ${amount} exceeds the stack`);
      if (amount < legal.minRaiseTo) throw new Error(`Bet ${amount} is below the minimum ${legal.minRaiseTo}`);
      target = amount;
      kind = s.betTo === 0 ? 'bet' : 'raise';
      break;
    }
    default:
      throw new Error(`Unknown action ${(a as Action).kind}`);
  }

  const put = target - p.bet;
  p.stack -= put;
  p.bet = target;
  p.committed += put;
  if (p.stack === 0 && !p.folded) {
    p.allIn = true;
    kind = 'allIn';
  }
  p.acted = true;

  if (target > s.betTo) {
    const increment = target - s.betTo;
    if (increment >= s.minRaise) {
      // A full raise reopens the betting for everybody else.
      s.minRaise = increment;
      for (const q of s.players) if (q !== p && canAct(q)) q.acted = false;
    }
    s.betTo = target;
    s.lastAggressor = p.id;
  }

  const action: Action = kind === 'fold' || kind === 'check' ? { kind } : { kind, amount: kind === 'call' ? put : target };
  s.events.push({ t: 'act', id: p.id, action, to: p.bet });
  return proceed(s, seat);
}

const needsAction = (s: TableState, p: PlayerState) => canAct(p) && (!p.acted || p.bet < s.betTo);

/** After an action (or the blinds): next player, or close the street / hand. Mutates `s` (a fresh copy). */
function proceed(s: TableState, from: number): TableState {
  const live = s.players.filter(inHand);
  if (live.length === 1) return finishHand(s, false);

  const actors = s.players.filter(canAct);
  // A lone player with chips does not bet against all-in players once he has matched them.
  const bettingOver =
    actors.length === 0 ||
    (actors.length === 1 && actors[0].bet >= Math.max(...live.filter((p) => p !== actors[0]).map((p) => p.bet)));
  if (!bettingOver) {
    const next = nextSeat(s.players, from, (p) => needsAction(s, p));
    if (next >= 0) {
      s.toAct = next;
      return s;
    }
  }
  return closeStreet(s);
}

function closeStreet(s: TableState): TableState {
  returnUncalled(s);
  for (const p of s.players) p.bet = 0;
  s.toAct = null;

  const order: Street[] = ['preflop', 'flop', 'turn', 'river'];
  const idx = order.indexOf(s.street);
  if (idx === 3) return finishHand(s, true);

  const street = order[idx + 1];
  s.deck = [...s.deck];
  s.deck.shift(); // burn
  const n = street === 'flop' ? 3 : 1;
  s.board = [...s.board, ...s.deck.splice(0, n)];
  s.street = street;
  s.betTo = 0;
  s.minRaise = blindsForLevel(s.level).bb;
  s.lastAggressor = null;
  for (const p of s.players) p.acted = false;
  s.events.push({ t: 'deal', street, board: [...s.board] });

  const actors = s.players.filter(canAct);
  if (actors.length < 2) return closeStreet(s); // all-in run-out: deal on without betting
  s.toAct = nextSeat(s.players, s.button, canAct);
  return s;
}

/** The part of the top bet that nobody matched goes back to its owner. */
function returnUncalled(s: TableState): void {
  const bets = s.players.map((p) => p.bet).sort((a, b) => b - a);
  const top = bets[0] ?? 0;
  const second = bets[1] ?? 0;
  if (top <= second) return;
  const p = s.players.find((q) => q.bet === top) as PlayerState;
  const back = top - second;
  p.bet -= back;
  p.committed -= back;
  p.stack += back;
  if (p.stack > 0) p.allIn = false;
  s.events.push({ t: 'return', id: p.id, amount: back });
}

/** Seat order for showdown and odd chips: clockwise starting left of the button. */
function fromButton(s: TableState): number[] {
  const n = s.players.length;
  return Array.from({ length: n }, (_, k) => (s.button + 1 + k) % n);
}

function finishHand(s: TableState, showdown: boolean): TableState {
  returnUncalled(s);
  for (const p of s.players) p.bet = 0;
  s.toAct = null;
  const startStacks: Record<string, number> = {};
  for (const p of s.players) startStacks[p.id] = p.stack + p.committed;

  const scores = new Map<string, number>();
  const descriptions = new Map<string, string>();
  if (showdown) {
    s.street = 'showdown';
    const order = fromButton(s).filter((i) => inHand(s.players[i]));
    // The last aggressor on the river shows first, then clockwise.
    const first = s.lastAggressor ? order.findIndex((i) => s.players[i].id === s.lastAggressor) : -1;
    const shown = first > 0 ? [...order.slice(first), ...order.slice(0, first)] : order;
    for (const i of shown) {
      const p = s.players[i];
      const v = evaluate7([...(p.hole as number[]), ...s.board]);
      scores.set(p.id, v.score);
      descriptions.set(p.id, describe(v));
      s.events.push({ t: 'show', id: p.id, hole: [...(p.hole as number[])], value: describe(v) });
    }
  }

  const pots = buildPots(s.players);
  const seatOrder = fromButton(s);
  pots.forEach((pot, index) => {
    let winners = pot.eligible;
    if (showdown && winners.length > 1) {
      const best = Math.max(...winners.map((id) => scores.get(id) as number));
      winners = winners.filter((id) => scores.get(id) === best);
    }
    // Winners in seat order from the button: the first one gets any odd chip.
    const ordered = seatOrder.map((i) => s.players[i]).filter((p) => winners.includes(p.id));
    const share = Math.floor(pot.amount / ordered.length);
    let odd = pot.amount - share * ordered.length;
    for (const p of ordered) {
      p.stack += share + (odd > 0 ? 1 : 0);
      if (odd > 0) odd -= 1;
    }
    const value = showdown && pot.eligible.length > 1 ? (descriptions.get(ordered[0].id) ?? null) : null;
    s.events.push({ t: 'win', pot: index, ids: ordered.map((p) => p.id), amount: pot.amount, value });
  });
  for (const p of s.players) {
    p.committed = 0;
    p.allIn = false;
  }

  s.places = { ...s.places };
  const outs = recordEliminations(s.players, s.places, startStacks);
  for (const o of outs) s.events.push({ t: 'out', id: o.id, place: o.place } satisfies LogEvent);
  s.street = 'done';
  return s;
}

/** Chips currently in the middle (all streets of this hand). */
export const potSize = (s: TableState) => s.players.reduce((n, p) => n + p.committed, 0);
