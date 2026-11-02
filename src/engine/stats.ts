import type { LogEvent } from './types';

/** Per-player counters behind the character card (VPIP, PFR, aggression, showdowns). */
export type PlayerStats = {
  hands: number;
  /** Hands where the player voluntarily put chips in preflop. */
  vpip: number;
  /** Hands where the player raised preflop. */
  pfr: number;
  /** Bets and raises (all streets). */
  aggr: number;
  /** Calls (all streets). */
  calls: number;
  showdowns: number;
  /** Decisions facing a bet or raise, and folds among them. */
  faced: number;
  folds: number;
};

export const emptyStats = (): PlayerStats => ({ hands: 0, vpip: 0, pfr: 0, aggr: 0, calls: 0, showdowns: 0, faced: 0, folds: 0 });

/** Adds one finished (or running) hand's events to the counters. Returns a new record. */
export function addHandStats(stats: Readonly<Record<string, PlayerStats>>, events: readonly LogEvent[]): Record<string, PlayerStats> {
  const out: Record<string, PlayerStats> = {};
  for (const [id, s] of Object.entries(stats)) out[id] = { ...s };
  const get = (id: string) => (out[id] ??= emptyStats());
  const vpip = new Set<string>();
  const pfr = new Set<string>();
  const seen = new Set<string>();
  let street = 'preflop';
  let max = 0;
  let bets: Record<string, number> = {};
  for (const e of events) {
    if (e.t === 'blind') {
      seen.add(e.id);
      max = Math.max(max, e.amount);
      bets[e.id] = e.amount;
    } else if (e.t === 'deal') {
      street = e.street;
      if (street !== 'preflop') {
        max = 0;
        bets = {};
      }
    } else if (e.t === 'act') {
      seen.add(e.id);
      if (max > (bets[e.id] ?? 0)) {
        get(e.id).faced += 1;
        if (e.action.kind === 'fold') get(e.id).folds += 1;
      }
      bets[e.id] = e.to;
      const raised = e.to > max;
      const putIn = e.action.kind === 'call' || e.action.kind === 'bet' || e.action.kind === 'raise' || e.action.kind === 'allIn';
      if (raised) get(e.id).aggr += 1;
      else if (putIn) get(e.id).calls += 1;
      if (street === 'preflop' && putIn) vpip.add(e.id);
      if (street === 'preflop' && raised) pfr.add(e.id);
      max = Math.max(max, e.to);
    } else if (e.t === 'show') get(e.id).showdowns += 1;
  }
  for (const id of seen) get(id).hands += 1;
  for (const id of vpip) get(id).vpip += 1;
  for (const id of pfr) get(id).pfr += 1;
  return out;
}

/** Aggression factor: (bets + raises) / calls. */
export const aggressionFactor = (s: PlayerStats) => (s.calls === 0 ? s.aggr : s.aggr / s.calls);
export const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
