import { describe, expect, it } from 'vitest';
import { MAX_SCORE, tournamentScore } from './scoring';

describe('tournamentScore', () => {
  it('pays by difficulty and place', () => {
    expect(tournamentScore({ difficulty: 'hard', format: 'sixMax', place: 1 })).toBe(5000);
    expect(tournamentScore({ difficulty: 'medium', format: 'sixMax', place: 3 })).toBe(1000);
    expect(tournamentScore({ difficulty: 'easy', format: 'headsUp', place: 1 })).toBe(400);
    expect(tournamentScore({ difficulty: 'hard', format: 'headsUp', place: 2 })).toBe(0);
    expect(tournamentScore({ difficulty: 'easy', format: 'sixMax', place: 5 })).toBe(100);
    expect(tournamentScore({ difficulty: 'hard', format: 'sixMax', place: 6 })).toBe(0);
  });

  it('never exceeds the arcade cap', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (const format of ['headsUp', 'sixMax'] as const) {
        for (let place = 1; place <= 6; place += 1) {
          expect(tournamentScore({ difficulty, format, place })).toBeLessThanOrEqual(MAX_SCORE);
        }
      }
    }
  });
});
