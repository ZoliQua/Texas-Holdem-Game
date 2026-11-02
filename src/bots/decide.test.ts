import { describe, expect, it } from 'vitest';
import { applyAction } from '../engine/hand';
import { makeRng } from '../engine/rng';
import { aggressionFactor, type PlayerStats } from '../engine/stats';
import { decide } from './decide';
import { ROSTER, type Style } from './profiles';
import { playTournament } from './simulate';
import { fast, forEachDecision, permuteHidden } from './testkit';
import { toBotView, type BotView } from './view';

/** Every array of numbers anywhere in a value (cards are numbers 0..51). */
function numberArrays(v: unknown, out: number[][] = []): number[][] {
  if (Array.isArray(v)) {
    if (v.length > 0 && v.every((x) => typeof x === 'number')) out.push(v as number[]);
    else for (const x of v) numberArrays(x, out);
  } else if (v && typeof v === 'object') for (const x of Object.values(v)) numberArrays(x, out);
  return out;
}

function keysOf(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) for (const x of v) keysOf(x, out);
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      out.add(k);
      keysOf(x, out);
    }
  }
  return out;
}

// Compile-time: the view type has no field for the deck or a seat's cards.
type NoDeck = 'deck' extends keyof BotView ? false : true;
type NoSeatCards = 'hole' extends keyof BotView['players'][number] ? false : true;
const typeChecks: [NoDeck, NoSeatCards] = [true, true];

describe('toBotView', () => {
  it('contains the bot’s own cards and the board, and no other card anywhere', () => {
    expect(typeChecks).toEqual([true, true]);
    let checked = 0;
    forEachDecision({ seed: 3, count: 400 }, ({ table, id, reads }) => {
      const view = toBotView(table, id, reads);
      const mine = new Set([...(table.players.find((p) => p.id === id)?.hole ?? []), ...table.board]);
      for (const arr of numberArrays({ hole: view.hole, board: view.board, history: view.history })) {
        for (const c of arr) expect(mine.has(c)).toBe(true);
      }
      const keys = keysOf(view);
      expect(keys.has('deck')).toBe(false);
      expect(keys.has('rng')).toBe(false);
      expect(keys.has('seed')).toBe(false);
      expect(view.players.every((p) => !('hole' in p))).toBe(true);
      checked += 1;
    });
    expect(checked).toBe(400);
  });
});

describe('anti-cheat', () => {
  it('decisions do not change when the opponents’ hidden cards and the deck are permuted', () => {
    let compared = 0;
    forEachDecision({ seed: 11, count: 600 }, ({ table, id, profile, reads }) => {
      const a = decide(toBotView(table, id, reads), profile, makeRng(compared + 1));
      const shuffled = permuteHidden(table, id, compared + 99);
      expect(shuffled.players.find((p) => p.id === id)?.hole).toEqual(table.players.find((p) => p.id === id)?.hole);
      const b = decide(toBotView(shuffled, id, reads), profile, makeRng(compared + 1));
      expect(b).toEqual(a);
      compared += 1;
    });
    expect(compared).toBe(600);
  });
});

describe('decide', () => {
  it('always returns a legal action (2 000 states, every character)', () => {
    let n = 0;
    forEachDecision({ seed: 21, count: 2000 }, ({ table, id, profile, reads }) => {
      const action = decide(toBotView(table, id, reads), profile, makeRng(n));
      expect(() => applyAction(table, action)).not.toThrow();
      n += 1;
    });
    expect(n).toBe(2000);
  });
});

describe('styles', () => {
  it('differ measurably over 3 000 simulated hands (VPIP and aggression)', () => {
    const pool = ROSTER.filter((p) => p.pool === 'medium').map((p) => fast(p, 30));
    const totals = new Map<Style, PlayerStats>();
    let hands = 0;
    for (let seed = 1; hands < 3000; seed += 1) {
      const r = playTournament({ seed, profiles: pool, handsPerLevel: 15 });
      hands += r.hands;
      for (const p of pool) {
        const s = r.stats[p.id];
        const t = totals.get(p.style);
        totals.set(
          p.style,
          t ? (Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v + s[k as keyof PlayerStats]])) as PlayerStats) : { ...s },
        );
      }
    }
    const vpip = (st: Style) => (totals.get(st) as PlayerStats).vpip / (totals.get(st) as PlayerStats).hands;
    const af = (st: Style) => aggressionFactor(totals.get(st) as PlayerStats);
    expect(vpip('maniac')).toBeGreaterThan(vpip('lag'));
    expect(vpip('lag')).toBeGreaterThan(vpip('station'));
    expect(vpip('station')).toBeGreaterThan(vpip('tag'));
    expect(vpip('tag')).toBeGreaterThan(vpip('rock'));
    expect(af('maniac')).toBeGreaterThan(af('lag'));
    expect(af('lag')).toBeGreaterThan(af('tag'));
    expect(af('tag')).toBeGreaterThan(af('rock'));
    expect(af('rock')).toBeGreaterThan(af('station'));
  }, 60_000);
});
