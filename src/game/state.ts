import { decide } from '../bots/decide';
import { seatBots, type BotProfile, type Difficulty } from '../bots/profiles';
import { tellFor, thinkingMs, type TellCue } from '../bots/tells';
import { toBotView } from '../bots/view';
import { applyAction, legalActions, startHand } from '../engine/hand';
import { makeRng } from '../engine/rng';
import { standingPlace } from './scoring';
import { DEFAULT_LENGTH, handsPerLevel, type Format, type LengthMin } from '../engine/schedule';
import { addHandStats, type PlayerStats } from '../engine/stats';
import { isTournamentOver, newTournament } from '../engine/tournament';
import type { Action, LegalActions, LogEvent, TableState } from '../engine/types';

export const PLAYER_ID = 'you';
/** Hands kept in the log (and in the saved session). */
export const LOG_HANDS = 200;

export type Setup = { format: Format; difficulty: Difficulty; length: LengthMin };
export const DEFAULT_SETUP: Setup = { format: 'sixMax', difficulty: 'medium', length: DEFAULT_LENGTH };

export type Phase = 'setup' | 'playing' | 'handOver' | 'finished';

export type GameState = {
  setup: Setup;
  /** Opponents in seat order after the player (seat 0). */
  bots: BotProfile[];
  table: TableState;
  phase: Phase;
  /** The player's final place once the run is over. */
  playerPlace: number | null;
  /** Events per hand, oldest first, at most LOG_HANDS hands. */
  log: LogEvent[][];
  /** Public per-player counters (character cards, and the bots' reads). */
  stats: Record<string, PlayerStats>;
  /**
   * Nonce of the last applied action while its animation plays; null when the
   * table is settled. No action is accepted while it is set.
   */
  pending: number | null;
  /** Counter behind `pending`. */
  nonce: number;
  /** The player ended the run with Finish: placed by chips among the players still in. */
  finishedEarly?: boolean;
};

export type GameAction =
  | { type: 'start'; setup: Setup; seed: number }
  | { type: 'player'; action: Action }
  | { type: 'bot'; id: string; action: Action }
  | { type: 'settle'; nonce: number }
  | { type: 'nextHand' }
  | { type: 'finish' }
  | { type: 'newTournament' };

/** A table with no players: the placeholder while the setup screen is shown. */
export function emptyTable(): TableState {
  return {
    seed: 0, rng: 0, deck: [], board: [], players: [], button: 0, toAct: null, street: 'done', handNo: 0,
    level: 1, handsInLevel: 0, handsPerLevel: 1, lastAggressor: null, minRaise: 0, betTo: 0, events: [], places: {},
  };
}

export function createInitialState(setup: Setup = DEFAULT_SETUP): GameState {
  return { setup, bots: [], table: emptyTable(), phase: 'setup', playerPlace: null, log: [], stats: {}, pending: null, nonce: 0 };
}

export const playerSeat = (s: GameState) => s.table.players.find((p) => p.id === PLAYER_ID) ?? null;
export const isPlayerTurn = (s: GameState) =>
  s.phase === 'playing' && s.table.toAct !== null && s.table.players[s.table.toAct].id === PLAYER_ID;
/** The bot whose turn it is, or null. */
export const botToAct = (s: GameState): BotProfile | null => {
  if (s.phase !== 'playing' || s.table.toAct === null) return null;
  const id = s.table.players[s.table.toAct].id;
  return s.bots.find((b) => b.id === id) ?? null;
};
export const profileOf = (s: GameState, id: string) => s.bots.find((b) => b.id === id) ?? null;

export function playerLegal(s: GameState): LegalActions | null {
  return isPlayerTurn(s) && s.pending === null ? legalActions(s.table) : null;
}

/** Replaces the newest hand's log entry with the table's events, keeping at most LOG_HANDS hands. */
function withLog(log: LogEvent[][], table: TableState, newHand: boolean): LogEvent[][] {
  const next = newHand ? [...log, table.events] : [...log.slice(0, -1), table.events];
  return next.length > LOG_HANDS ? next.slice(next.length - LOG_HANDS) : next;
}

/** After a table change: hand over, player busted or won. */
function afterTable(s: GameState, table: TableState): GameState {
  const next: GameState = { ...s, table, log: withLog(s.log, table, false) };
  if (table.street !== 'done') return next;
  next.stats = addHandStats(s.stats, table.events);
  const place = table.places[PLAYER_ID];
  if (place !== undefined || isTournamentOver(table)) {
    // The run ends when the player is out or has won; the bots do not need to finish.
    return { ...next, phase: 'finished', playerPlace: place ?? 1 };
  }
  return { ...next, phase: 'handOver' };
}

function act(s: GameState, actorId: string, action: Action): GameState {
  if (s.phase !== 'playing' || s.pending !== null || s.table.toAct === null) return s;
  if (s.table.players[s.table.toAct].id !== actorId) return s;
  let table: TableState;
  try {
    table = applyAction(s.table, action);
  } catch {
    return s; // an illegal action is ignored, never applied half-way
  }
  const nonce = s.nonce + 1;
  return afterTable({ ...s, pending: nonce, nonce }, table);
}

export function advance(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'start': {
      const rng = makeRng(a.seed ^ 0x5eed);
      const bots = seatBots({ difficulty: a.setup.difficulty, count: a.setup.format === 'headsUp' ? 1 : 5, rng });
      const table = startHand(
        newTournament({
          seed: a.seed,
          playerIds: [PLAYER_ID, ...bots.map((b) => b.id)],
          handsPerLevel: handsPerLevel(a.setup.format, a.setup.length),
        }),
      );
      return {
        setup: a.setup,
        bots,
        table,
        phase: 'playing',
        playerPlace: null,
        log: [table.events],
        stats: {},
        pending: null,
        nonce: 0,
      };
    }
    case 'player':
      return act(s, PLAYER_ID, a.action);
    case 'bot':
      return a.id === PLAYER_ID ? s : act(s, a.id, a.action);
    case 'settle':
      return s.pending === a.nonce ? { ...s, pending: null } : s;
    case 'nextHand': {
      if (s.phase !== 'handOver') return s;
      const table = startHand(s.table);
      return { ...s, table, phase: 'playing', pending: null, log: withLog(s.log, table, true) };
    }
    case 'finish':
      // Ends the whole tournament now; the current hand is not played out.
      if (s.phase !== 'playing' && s.phase !== 'handOver') return s;
      return { ...s, phase: 'finished', playerPlace: standingPlace(s.table.players, PLAYER_ID), finishedEarly: true, pending: null };
    case 'newTournament':
      return createInitialState(s.setup);
  }
}

/** Deterministic rng for one bot decision: the same turn always gets the same draw (pause, restore). */
export function turnRng(s: GameState, id: string) {
  let h = (s.table.seed ^ Math.imul(s.table.handNo, 0x9e3779b1) ^ Math.imul(s.table.events.length + 1, 0x85ebca6b)) >>> 0;
  for (let i = 0; i < id.length; i += 1) h = Math.imul(h ^ id.charCodeAt(i), 0x01000193) >>> 0;
  return makeRng(h);
}

export type BotTurn = { id: string; action: Action; cue: TellCue | null; thinkMs: number };

/** The current bot's decision, its tell and its thinking time (Normal speed). Null when no bot is to act. */
export function planBotTurn(s: GameState): BotTurn | null {
  const bot = botToAct(s);
  if (!bot) return null;
  const view = toBotView(s.table, bot.id, s.stats);
  const rng = turnRng(s, bot.id);
  const action = decide(view, bot, rng);
  const cue = tellFor(view, bot, action, rng);
  return { id: bot.id, action, cue, thinkMs: cue ? cue.thinkMs : thinkingMs(view, bot, rng) };
}
