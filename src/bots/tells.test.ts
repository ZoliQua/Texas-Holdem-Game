import { describe, expect, it } from 'vitest';
import { makeRng } from '../engine/rng';
import { decide } from './decide';
import { ROSTER, type BotProfile } from './profiles';
import { handBucket, TELL_MEANING, tellFor, thinkingMs } from './tells';
import { forEachDecision, permuteHidden } from './testkit';
import { toBotView, type BotView } from './view';

// Compile-time: tells see a BotView, nothing else.
type TellInput = Parameters<typeof tellFor>[0];
const sameType: TellInput extends BotView ? (BotView extends TellInput ? true : false) : false = true;

function sample(pool: BotProfile['pool'], decisions: number) {
  const profiles = ROSTER.filter((p) => p.pool === pool);
  let fired = 0;
  let honest = 0;
  let seen = 0;
  forEachDecision({ seed: pool.length * 17, count: decisions, profiles, players: 6 }, ({ table, id, profile, reads }) => {
    const view = toBotView(table, id, reads);
    const rng = makeRng(seen + 5);
    const action = decide(view, profile, rng);
    const cue = tellFor(view, profile, action, rng);
    seen += 1;
    if (!cue) return;
    fired += 1;
    if (TELL_MEANING[cue.kind] === handBucket(view, action)) honest += 1;
  });
  return { fired, honest, seen };
}

describe('tellFor', () => {
  it('takes only the bot’s own view', () => {
    expect(sameType).toBe(true);
  });

  it('easy bots tell honestly about 80 % of the time', () => {
    let fired = 0;
    let honest = 0;
    for (let round = 0; fired < 2000; round += 1) {
      const r = sample('easy', 3000);
      fired += r.fired;
      honest += r.honest;
      if (round > 5) break;
    }
    expect(fired).toBeGreaterThanOrEqual(2000);
    const rate = honest / fired;
    expect(rate).toBeGreaterThanOrEqual(0.75);
    expect(rate).toBeLessThanOrEqual(0.85);
  }, 60_000);

  it('hard bots tell rarely (≤ 40 % of decisions) and sometimes reverse', () => {
    const r = sample('hard', 3000);
    expect(r.fired / r.seen).toBeLessThanOrEqual(0.4);
    expect(r.fired).toBeGreaterThan(50);
    const rate = r.honest / r.fired;
    expect(rate).toBeLessThan(0.7);
    expect(rate).toBeGreaterThan(0.3);
  }, 60_000);

  it('does not change when hidden cards are permuted', () => {
    let n = 0;
    forEachDecision({ seed: 5, count: 300 }, ({ table, id, profile, reads }) => {
      const run = (s: typeof table) => {
        const rng = makeRng(n + 1);
        const view = toBotView(s, id, reads);
        const action = decide(view, profile, rng);
        return tellFor(view, profile, action, rng);
      };
      expect(run(permuteHidden(table, id, n + 7))).toEqual(run(table));
      n += 1;
    });
  });

  it('cues last long enough to notice and stay inside the 0.6–2 s thinking window', () => {
    forEachDecision({ seed: 9, count: 500 }, ({ table, id, profile, reads }) => {
      const rng = makeRng(1);
      const view = toBotView(table, id, reads);
      const t = thinkingMs(view, profile, rng);
      expect(t).toBeGreaterThanOrEqual(600);
      expect(t).toBeLessThanOrEqual(2000);
      const cue = tellFor(view, profile, decide(view, profile, rng), rng);
      if (cue) {
        expect(cue.thinkMs).toBeGreaterThanOrEqual(600);
        expect(cue.thinkMs).toBeLessThanOrEqual(2000);
        expect(cue.atMs + cue.durationMs).toBeLessThanOrEqual(cue.thinkMs);
        if (cue.kind !== 'snapCall') expect(cue.durationMs).toBeGreaterThanOrEqual(800);
      }
    });
  });
});
