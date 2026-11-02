import type { Card } from './cards';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'done';

export type PlayerState = {
  id: string;
  /** Chips behind (not yet put in). */
  stack: number;
  /** Chips put in on the current street. */
  bet: number;
  /** Chips put in during the whole hand (includes `bet`); goes into the pots. */
  committed: number;
  hole: Card[] | null;
  folded: boolean;
  allIn: boolean;
  /** Eliminated from the tournament. */
  out: boolean;
  /** Has acted since the last full raise on this street. */
  acted: boolean;
};

export type ActionKind = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allIn';
/** `amount` is the total bet on this street for bet / raise (raise *to*, not *by*). */
export type Action = { kind: ActionKind; amount?: number };

export type LegalActions = {
  canCheck: boolean;
  /** Chips needed to call (capped at the stack); 0 when checking is possible. */
  callAmount: number;
  /** Smallest legal bet/raise-to, or null when raising is not allowed. */
  minRaiseTo: number | null;
  /** Largest bet/raise-to (= all-in). */
  maxRaiseTo: number;
};

export type LogEvent =
  | { t: 'hand'; hand: number; sb: number; bb: number; button: string; level: number }
  | { t: 'blind'; id: string; amount: number }
  | { t: 'deal'; street: Street; board: Card[] }
  | { t: 'act'; id: string; action: Action; to: number }
  | { t: 'return'; id: string; amount: number }
  | { t: 'show'; id: string; hole: Card[]; value: string }
  | { t: 'win'; pot: number; ids: string[]; amount: number; value: string | null }
  | { t: 'out'; id: string; place: number };

export type TableState = {
  seed: number;
  /** Resumable rng state (mulberry32). */
  rng: number;
  /** Undealt cards, top of the deck first. */
  deck: Card[];
  board: Card[];
  players: PlayerState[];
  /** Seat index of the dealer button. */
  button: number;
  /** Seat index of the player to act, or null between hands / during the run-out. */
  toAct: number | null;
  street: Street;
  /** Number of the current hand (1-based; 0 before the first deal). */
  handNo: number;
  /** Blind level (1-based). */
  level: number;
  /** Hands dealt at the current level, including the current one. */
  handsInLevel: number;
  handsPerLevel: number;
  /** Last player to bet or raise on the current street (shows first). */
  lastAggressor: string | null;
  /** Size of the last full bet or raise on this street (the minimum raise increment). */
  minRaise: number;
  /** The bet everyone has to match on this street. */
  betTo: number;
  /** Events of the current hand. */
  events: LogEvent[];
  /** Final places of eliminated players (and 1 for the winner). */
  places: Record<string, number>;
};
