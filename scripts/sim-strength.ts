/**
 * Strength acceptance: bot-only heads-up matches between difficulty pools on
 * the real engine. Every pool pair plays MATCHES matches, styles paired evenly,
 * and every deal is played twice with the seats swapped (the deck order only
 * depends on the table seed, so both bots see the same cards).
 *
 *   npm run sim:strength                        # 500 matches per pair
 *   npm run sim:strength -- 1000                # more
 *   PAIR=hard,medium npm run sim:strength       # one pair only
 *   SIM_VERBOSE=1 npm run sim:strength          # per style pairing
 */
import { ROSTER, type BotProfile, type Difficulty } from '../src/bots/profiles';
import { playTournament } from '../src/bots/simulate';

const MATCHES = Math.max(2, Number(process.argv[2] ?? 500));
// Provisional level length until the blind schedule is calibrated (override with HPL=…).
const HANDS_PER_LEVEL = Number(process.env.HPL ?? 40);
const ONLY = process.env.PAIR;
const PAIRS: [Difficulty, Difficulty][] = [
  ['hard', 'medium'],
  ['medium', 'easy'],
  ['hard', 'easy'],
];

const pool = (d: Difficulty) => ROSTER.filter((p) => p.pool === d);

function run(a: Difficulty, b: Difficulty) {
  const A = pool(a);
  const B = pool(b);
  let winsA = 0;
  let hands = 0;
  const byStyle = new Map<string, [number, number]>();
  for (let m = 0; m < MATCHES; m += 1) {
    const deal = Math.floor(m / 2);
    const pa: BotProfile = A[deal % 5];
    const pb: BotProfile = B[Math.floor(deal / 5) % 5];
    const swapped = m % 2 === 1;
    const profiles = swapped ? [pb, pa] : [pa, pb];
    const ids = swapped ? ['b', 'a'] : ['a', 'b'];
    const r = playTournament({ seed: 10_000 + deal, profiles, ids, handsPerLevel: HANDS_PER_LEVEL });
    hands += r.hands;
    const won = r.winner === 'a';
    if (won) winsA += 1;
    const key = `${pa.style} vs ${pb.style}`;
    const t = byStyle.get(key) ?? [0, 0];
    byStyle.set(key, [t[0] + (won ? 1 : 0), t[1] + 1]);
  }
  return { winsA, hands, byStyle };
}

const started = Date.now();
const rows: string[] = [];
let ok = true;
for (const [a, b] of PAIRS.filter(([x, y]) => !ONLY || ONLY === `${x},${y}`)) {
  const { winsA, hands, byStyle } = run(a, b);
  const rate = winsA / MATCHES;
  const pass = rate >= 0.6;
  if (a !== 'hard' || b !== 'easy') ok &&= pass;
  rows.push(
    `${a.padEnd(6)} vs ${b.padEnd(6)}  ${String(winsA).padStart(4)}/${MATCHES}  ${(rate * 100).toFixed(1).padStart(5)} %  ` +
      `avg ${(hands / MATCHES).toFixed(0)} hands  ${pass ? 'PASS' : 'FAIL'} (≥ 60 %)`,
  );
  if (process.env.SIM_VERBOSE) {
    for (const [k, [w, n]] of byStyle) rows.push(`    ${k.padEnd(20)} ${w}/${n}`);
  }
}
console.log(`Heads-up strength simulation · ${MATCHES} matches per pair · ${HANDS_PER_LEVEL} hands per level`);
for (const r of rows) console.log(r);
console.log(`${ok ? 'Acceptance met' : 'Acceptance NOT met'} · ${((Date.now() - started) / 1000).toFixed(1)} s`);
process.exitCode = ok ? 0 : 1;
