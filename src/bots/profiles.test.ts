import { describe, expect, it } from 'vitest';
import { makeRng } from '../engine/rng';
import { ROSTER, seatBots, type Difficulty, type Style } from './profiles';

const STYLES: Style[] = ['rock', 'station', 'tag', 'lag', 'maniac'];
const POOLS: Difficulty[] = ['easy', 'medium', 'hard'];

describe('ROSTER', () => {
  it('has 15 unique characters: every style once in every pool', () => {
    expect(ROSTER).toHaveLength(15);
    expect(new Set(ROSTER.map((p) => p.id)).size).toBe(15);
    expect(new Set(ROSTER.map((p) => p.name)).size).toBe(15);
    expect(new Set(ROSTER.map((p) => p.look.species)).size).toBe(15);
    for (const pool of POOLS) {
      expect(ROSTER.filter((p) => p.pool === pool).map((p) => p.style).sort()).toEqual([...STYLES].sort());
    }
  });

  it('strength and tell honesty rise and fall with the pool', () => {
    const by = (d: Difficulty) => ROSTER.find((p) => p.pool === d) as (typeof ROSTER)[number];
    expect(by('easy').skill).toBeLessThan(by('medium').skill);
    expect(by('medium').skill).toBeLessThan(by('hard').skill);
    expect(by('easy').samples).toBeLessThan(by('hard').samples);
    expect(by('easy').mistake).toBeGreaterThan(by('hard').mistake);
    expect([by('easy').tellHonesty, by('medium').tellHonesty, by('hard').tellHonesty]).toEqual([0.8, 0.6, 0.35]);
    expect([by('easy').reverseTells, by('medium').reverseTells, by('hard').reverseTells]).toEqual([0, 0, 0.3]);
  });

  it('every character has one or two personal tells with different meanings', () => {
    for (const p of ROSTER) {
      expect(p.tells.length).toBeGreaterThanOrEqual(1);
      expect(p.tells.length).toBeLessThanOrEqual(2);
      expect(new Set(p.tells).size).toBe(p.tells.length);
    }
  });
});

describe('seatBots', () => {
  it('a medium table seats exactly four medium bots and one easy or hard guest', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const bots = seatBots({ difficulty: 'medium', count: 5, rng: makeRng(seed) });
      expect(bots).toHaveLength(5);
      expect(new Set(bots.map((b) => b.id)).size).toBe(5);
      expect(bots.filter((b) => b.pool === 'medium')).toHaveLength(4);
      expect(bots.filter((b) => b.pool !== 'medium')).toHaveLength(1);
    }
  });

  it('easy and hard tables draw only from their own pool', () => {
    for (const difficulty of ['easy', 'hard'] as const) {
      for (let seed = 1; seed <= 50; seed += 1) {
        const bots = seatBots({ difficulty, count: 5, rng: makeRng(seed) });
        expect(bots.every((b) => b.pool === difficulty)).toBe(true);
        expect(new Set(bots.map((b) => b.id)).size).toBe(5);
      }
    }
  });

  it('heads-up draws one bot from the chosen pool, and the draw varies with the seed', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed += 1) {
      const bots = seatBots({ difficulty: 'hard', count: 1, rng: makeRng(seed) });
      expect(bots).toHaveLength(1);
      expect(bots[0].pool).toBe('hard');
      seen.add(bots[0].id);
    }
    expect(seen.size).toBe(5);
  });

  it('shuffles the seat order', () => {
    const orders = new Set<string>();
    for (let seed = 1; seed <= 20; seed += 1) {
      orders.add(seatBots({ difficulty: 'easy', count: 5, rng: makeRng(seed) }).map((b) => b.id).join());
    }
    expect(orders.size).toBeGreaterThan(5);
  });
});
