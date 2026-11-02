import { describe, expect, it } from 'vitest';
import { buildPots } from './pots';
import type { PlayerState } from './types';

const P = (id: string, committed: number, folded = false): PlayerState => ({
  id, stack: 0, bet: 0, committed, hole: null, folded, allIn: !folded, out: false, acted: true,
});

describe('buildPots', () => {
  it('a single pot when everybody put in the same', () => {
    expect(buildPots([P('a', 100), P('b', 100), P('c', 20, true)])).toEqual([{ amount: 220, eligible: ['a', 'b'] }]);
  });

  it('three different all-ins make a main pot and two side pots', () => {
    const pots = buildPots([P('a', 100), P('b', 250), P('c', 400), P('d', 400), P('e', 60, true)]);
    expect(pots).toEqual([
      { amount: 100 * 4 + 60, eligible: ['a', 'b', 'c', 'd'] },
      { amount: 150 * 3, eligible: ['b', 'c', 'd'] },
      { amount: 150 * 2, eligible: ['c', 'd'] },
    ]);
  });

  it('four different all-ins with a folded player above the smallest level', () => {
    const pots = buildPots([P('a', 50), P('b', 120), P('c', 300), P('d', 700), P('e', 700), P('f', 200, true)]);
    expect(pots).toEqual([
      { amount: 50 * 6, eligible: ['a', 'b', 'c', 'd', 'e'] },
      { amount: 70 * 5, eligible: ['b', 'c', 'd', 'e'] },
      { amount: 180 * 3 + 80, eligible: ['c', 'd', 'e'] },
      { amount: 400 * 2, eligible: ['d', 'e'] },
    ]);
    const total = pots.reduce((n, p) => n + p.amount, 0);
    expect(total).toBe(50 + 120 + 300 + 700 + 700 + 200);
  });
});
