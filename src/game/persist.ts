import { profileById, type BotProfile } from '../bots/profiles';
import { isCard } from '../engine/cards';
import { handsPerLevel, isFormat, isLength } from '../engine/schedule';
import { STARTING_STACK } from '../engine/tournament';
import type { LogEvent, PlayerState, Street, TableState } from '../engine/types';
import { LOG_HANDS, PLAYER_ID, type GameState, type Setup } from './state';

/*
 * Guard for a saved Hold'em session. It checks the structure and the
 * invariants a real game always keeps — chips are conserved, every card
 * exists once, the player to act can act, the bots are the real roster
 * characters — so a tampered or corrupted save is dropped instead of
 * producing an impossible table.
 */

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNat = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
const isInt32 = (v: unknown): v is number => isNat(v) && v <= 0xffffffff;
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isStr = (v: unknown): v is string => typeof v === 'string';

const STREETS: readonly Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown', 'done'];
const BOARD_SIZE: Partial<Record<Street, number>> = { preflop: 0, flop: 3, turn: 4, river: 5 };
const PHASES = ['playing', 'handOver', 'finished'] as const;
const EVENT_TYPES = new Set(['hand', 'blind', 'deal', 'act', 'return', 'show', 'win', 'out']);

function isSetup(v: unknown): v is Setup {
  return (
    isObj(v) &&
    isFormat(v.format) &&
    isLength(v.length) &&
    (v.difficulty === 'easy' || v.difficulty === 'medium' || v.difficulty === 'hard')
  );
}

/** A saved bot must be exactly the roster character (no edited strengths). */
function isRosterBot(v: unknown): v is BotProfile {
  if (!isObj(v) || !isStr(v.id)) return false;
  const real = profileById(v.id);
  return real !== null && JSON.stringify(real) === JSON.stringify(v);
}

function isPlayer(v: unknown): v is PlayerState {
  if (!isObj(v)) return false;
  if (!isStr(v.id) || !isNat(v.stack) || !isNat(v.bet) || !isNat(v.committed)) return false;
  if (!isBool(v.folded) || !isBool(v.allIn) || !isBool(v.out) || !isBool(v.acted)) return false;
  if (v.bet > v.committed) return false;
  if (v.hole !== null && !(Array.isArray(v.hole) && v.hole.length === 2 && v.hole.every(isCard))) return false;
  if (v.out && (v.stack !== 0 || v.committed !== 0)) return false;
  return true;
}

function isEvent(v: unknown): v is LogEvent {
  return isObj(v) && isStr(v.t) && EVENT_TYPES.has(v.t);
}

function isStats(v: unknown): boolean {
  if (!isObj(v)) return false;
  return Object.values(v).every(
    (s) => isObj(s) && ['hands', 'vpip', 'pfr', 'aggr', 'calls', 'showdowns', 'faced', 'folds'].every((k) => isNat(s[k])),
  );
}

function isTable(t: unknown, setup: Setup, bots: BotProfile[]): t is TableState {
  if (!isObj(t)) return false;
  if (!isInt32(t.seed) || !isInt32(t.rng)) return false;
  if (!STREETS.includes(t.street as Street)) return false;
  if (!Array.isArray(t.players) || !t.players.every(isPlayer)) return false;
  const players = t.players as PlayerState[];
  const ids = [PLAYER_ID, ...bots.map((b) => b.id)];
  if (players.length !== ids.length || players.some((p, i) => p.id !== ids[i])) return false;
  if (!Array.isArray(t.deck) || !t.deck.every(isCard) || !Array.isArray(t.board) || !t.board.every(isCard)) return false;
  if (!isNat(t.button) || t.button >= players.length) return false;
  if (!isNat(t.handNo) || t.handNo < 1) return false;
  if (!isNat(t.level) || t.level < 1 || !isNat(t.handsInLevel)) return false;
  if (t.handsPerLevel !== handsPerLevel(setup.format, setup.length) || (t.handsInLevel as number) > t.handsPerLevel) return false;
  if (!isNat(t.minRaise) || !isNat(t.betTo)) return false;
  if (!(t.lastAggressor === null || (isStr(t.lastAggressor) && ids.includes(t.lastAggressor)))) return false;
  if (!Array.isArray(t.events) || !t.events.every(isEvent)) return false;
  if (!isObj(t.places) || !Object.entries(t.places).every(([id, p]) => ids.includes(id) && isNat(p) && p >= 1 && p <= ids.length)) {
    return false;
  }
  for (const p of players) if (p.out && (t.places as Rec)[p.id] === undefined) return false;

  // Chips are conserved: nobody gains or loses a chip, ever.
  const chips = players.reduce((n, p) => n + p.stack + p.committed, 0);
  if (chips !== ids.length * STARTING_STACK) return false;

  // Every card exists at most once; dealt players hold cards.
  const cards = [...(t.deck as number[]), ...(t.board as number[]), ...players.flatMap((p) => p.hole ?? [])];
  if (new Set(cards).size !== cards.length || cards.length > 52) return false;
  if (players.some((p) => !p.out && p.hole === null)) return false;

  const street = t.street as Street;
  const boardSize = BOARD_SIZE[street];
  if (boardSize !== undefined && (t.board as number[]).length !== boardSize) return false;
  if ((t.board as number[]).length > 5) return false;
  const maxBet = Math.max(0, ...players.map((p) => p.bet));
  if (street === 'done' || street === 'showdown') {
    if (t.toAct !== null || players.some((p) => p.committed !== 0 || p.bet !== 0)) return false;
  } else {
    // A betting street always waits on somebody who can act.
    if (!isNat(t.toAct) || t.toAct >= players.length) return false;
    const actor = players[t.toAct];
    if (actor.out || actor.folded || actor.allIn) return false;
    if (t.betTo < maxBet || t.minRaise < 1) return false;
  }
  return true;
}

/** Validates a saved session (structure + invariants). */
export function isHoldemSession(v: unknown): v is GameState {
  if (!isObj(v)) return false;
  if (!isSetup(v.setup)) return false;
  if (!PHASES.includes(v.phase as (typeof PHASES)[number])) return false;
  if (!Array.isArray(v.bots) || !v.bots.every(isRosterBot)) return false;
  const bots = v.bots as BotProfile[];
  const expected = v.setup.format === 'headsUp' ? 1 : 5;
  if (bots.length !== expected || new Set(bots.map((b) => b.id)).size !== bots.length) return false;
  if (!isTable(v.table, v.setup, bots)) return false;
  const table = v.table as TableState;
  if (!(v.pending === null || isNat(v.pending)) || !isNat(v.nonce)) return false;
  if (!(v.playerPlace === null || (isNat(v.playerPlace) && v.playerPlace >= 1 && v.playerPlace <= bots.length + 1))) return false;
  if (!Array.isArray(v.log) || v.log.length === 0 || v.log.length > LOG_HANDS) return false;
  if (!v.log.every((h) => Array.isArray(h) && h.every(isEvent))) return false;
  if (!isStats(v.stats)) return false;

  const done = table.street === 'done';
  if (v.phase === 'playing' && done) return false;
  if (v.phase === 'handOver' && (!done || v.playerPlace !== null)) return false;
  if (v.phase === 'finished' && (!done || v.playerPlace === null)) return false;
  // The newest log entry is the current hand.
  if (JSON.stringify(v.log[v.log.length - 1]) !== JSON.stringify(table.events)) return false;
  return true;
}
