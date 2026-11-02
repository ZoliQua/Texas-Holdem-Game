/**
 * Blind calibration: how many hands per blind level make a tournament last
 * the chosen number of minutes at Normal speed?
 *
 * For each format it simulates TOURNAMENTS medium tables on the real engine,
 * with the player's seat taken by the medium tight-aggressive bot, and prices
 * every hand with a time model. The run stops when the player's seat is out
 * (the arcade run ends there) or the tournament is over. A binary search over
 * hands-per-level then finds the value whose median time is closest to each
 * target; every evaluation uses the same seeds, so the median is (nearly)
 * monotone in the level length. The result is written to src/engine/schedule.json.
 *
 *   npm run sim:calibrate            # all 8 format × length pairs, in parallel
 *   npm run sim:calibrate -- --job headsUp:45   # one pair, prints JSON (used by the parallel run)
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROSTER, seatBots } from '../src/bots/profiles';
import { playTournament } from '../src/bots/simulate';
import { makeRng } from '../src/engine/rng';
import { LENGTHS, type Format, type LengthMin } from '../src/engine/schedule';

const TOURNAMENTS = 300;
const MODEL = { dealS: 2.5, botActionS: 1.3, humanActionS: 4, streetS: 1.5, awardS: 3 };
const MIN_HPL = 2;
const MAX_HPL = 400;
const PLAYER = 'you';

const here = dirname(fileURLToPath(import.meta.url));
const stand = ROSTER.find((p) => p.pool === 'medium' && p.style === 'tag');
if (!stand) throw new Error('No medium TAG profile');

/** Median minutes over the fixed seed set for one hands-per-level value. */
function medianMinutes(format: Format, hpl: number): number {
  const minutes: number[] = [];
  for (let t = 0; t < TOURNAMENTS; t += 1) {
    const seed = (format === 'headsUp' ? 50_000 : 90_000) + t;
    const bots = seatBots({ difficulty: 'medium', count: format === 'headsUp' ? 1 : 5, rng: makeRng(seed) });
    const r = playTournament({
      seed,
      profiles: [stand as (typeof ROSTER)[number], ...bots],
      ids: [PLAYER, ...bots.map((b) => b.id)],
      handsPerLevel: hpl,
      keepHands: true,
      stopWhenOut: PLAYER,
      maxHands: 3000,
    });
    let s = 0;
    for (const h of r.records) {
      const human = h.actions[PLAYER] ?? 0;
      const all = Object.values(h.actions).reduce((a, b) => a + b, 0);
      s += MODEL.dealS + MODEL.botActionS * (all - human) + MODEL.humanActionS * human + MODEL.streetS * h.streets + MODEL.awardS;
    }
    minutes.push(s / 60);
  }
  minutes.sort((a, b) => a - b);
  const mid = minutes.length >> 1;
  return minutes.length % 2 ? minutes[mid] : (minutes[mid - 1] + minutes[mid]) / 2;
}

type Entry = { handsPerLevel: number; medianMin: number; reachable: boolean };

function calibrate(format: Format, target: LengthMin): Entry {
  const cache = new Map<number, number>();
  const at = (h: number) => {
    if (!cache.has(h)) cache.set(h, medianMinutes(format, h));
    return cache.get(h) as number;
  };
  let lo = MIN_HPL;
  let hi = MAX_HPL;
  if (at(hi) < target) {
    // Even (almost) flat blinds end sooner: the bots bust each other first.
    const m = at(hi);
    return { handsPerLevel: hi, medianMin: round1(m), reachable: Math.abs(m - target) / target <= 0.1 };
  }
  if (at(lo) >= target) return { handsPerLevel: lo, medianMin: round1(at(lo)), reachable: Math.abs(at(lo) - target) / target <= 0.1 };
  // Smallest hands-per-level whose median reaches the target, then the closer neighbour.
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (at(mid) >= target) hi = mid;
    else lo = mid;
  }
  const best = Math.abs(at(lo) - target) < Math.abs(at(hi) - target) ? lo : hi;
  const m = at(best);
  return { handsPerLevel: best, medianMin: round1(m), reachable: Math.abs(m - target) / target <= 0.1 };
}

const round1 = (x: number) => Math.round(x * 10) / 10;

function runJob(spec: string) {
  const [format, length] = spec.split(':');
  const started = Date.now();
  const entry = calibrate(format as Format, Number(length) as LengthMin);
  console.log(JSON.stringify({ format, length: Number(length), ...entry, seconds: Math.round((Date.now() - started) / 1000) }));
}

function job(spec: string): Promise<{ format: Format; length: LengthMin } & Entry> {
  return new Promise((resolve, reject) => {
    const bin = join(here, '..', 'node_modules', '.bin', 'vite-node');
    const child = spawn(bin, [fileURLToPath(import.meta.url), '--', '--job', spec], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (d) => (out += String(d)));
    child.on('exit', (code) => {
      const line = out.trim().split('\n').pop() ?? '';
      if (code !== 0) reject(new Error(`job ${spec} failed (${code})`));
      else resolve(JSON.parse(line));
    });
  });
}

async function main() {
  const jobIndex = process.argv.indexOf('--job');
  if (jobIndex >= 0) {
    runJob(process.argv[jobIndex + 1]);
    return;
  }
  const started = Date.now();
  const specs = (['headsUp', 'sixMax'] as const).flatMap((f) => LENGTHS.map((l) => `${f}:${l}`));
  const results = await Promise.all(specs.map(job));
  const entries: Record<Format, Record<string, Entry>> = { headsUp: {}, sixMax: {} };
  for (const r of results) entries[r.format][String(r.length)] = { handsPerLevel: r.handsPerLevel, medianMin: r.medianMin, reachable: r.reachable };
  const out = {
    generatedBy: 'scripts/calibrate-blinds.ts (npm run sim:calibrate)',
    tournaments: TOURNAMENTS,
    table: 'medium pool (seatBots), player seat = medium tight-aggressive bot; a run ends when that seat is out',
    model: MODEL,
    entries,
  };
  writeFileSync(join(here, '..', 'src', 'engine', 'schedule.json'), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Blind calibration · ${TOURNAMENTS} tournaments per evaluation · Normal speed time model`);
  console.log('format    length  hands/level  median   within ±10 %');
  for (const f of ['headsUp', 'sixMax'] as const) {
    for (const l of LENGTHS) {
      const e = entries[f][String(l)];
      console.log(
        `${f.padEnd(8)}  ${String(l).padStart(3)} min  ${String(e.handsPerLevel).padStart(6)}     ${e.medianMin.toFixed(1).padStart(5)} min  ${e.reachable ? 'yes' : 'NO'}`,
      );
    }
  }
  console.log(`done in ${Math.round((Date.now() - started) / 1000)} s`);
}

void main();
