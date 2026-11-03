import { useEffect, useMemo, useState } from 'react';
import type { ArcadeDemoProps } from '../arcade';
import { ROSTER, type BotProfile } from '../bots/profiles';
import { startHand } from '../engine/hand';
import { makeRng, shuffle } from '../engine/rng';
import { newTournament } from '../engine/tournament';
import { SPEED_FACTOR } from '../game/speed';
import { advance, planBotTurn, type GameState } from '../game/state';
import { Table } from '../ui/Table';

/** Hands per level of the attract table: blinds climb quickly so the show keeps moving. */
const DEMO_HANDS_PER_LEVEL = 6;
/** Pause between hands and before a new table (ms, already fast). */
const DEMO_HAND_PAUSE_MS = 1400;
/** Cap on equity samples so the landing page stays light. */
const DEMO_SAMPLES = 120;

/** A bots-only 6-max table: two characters from each pool, in a seeded random order. */
function createDemoState(seed: number): GameState {
  const rng = makeRng(seed);
  const pick = (pool: BotProfile['pool']) => shuffle(rng, ROSTER.filter((p) => p.pool === pool)).slice(0, 2);
  const bots = shuffle(rng, [...pick('easy'), ...pick('medium'), ...pick('hard')]).map((p) => ({
    ...p,
    samples: Math.min(p.samples, DEMO_SAMPLES),
  }));
  const table = startHand(newTournament({ seed, playerIds: bots.map((b) => b.id), handsPerLevel: DEMO_HANDS_PER_LEVEL }));
  return {
    setup: { format: 'sixMax', difficulty: 'medium', length: 20 },
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

/** One step of the demo and the delay before it (Fast speed). */
function step(s: GameState, seed: number): { delay: number; next: () => GameState } {
  const fast = SPEED_FACTOR.fast;
  if (s.pending !== null) return { delay: 350 * fast, next: () => advance(s, { type: 'settle', nonce: s.pending as number }) };
  if (s.phase === 'playing') {
    const plan = planBotTurn(s);
    if (plan) return { delay: plan.thinkMs * fast, next: () => advance(s, { type: 'bot', id: plan.id, action: plan.action }) };
  }
  if (s.phase === 'handOver') {
    const over = s.table.players.filter((p) => !p.out).length <= 1;
    return { delay: DEMO_HAND_PAUSE_MS, next: () => (over ? createDemoState(seed + s.table.handNo) : advance(s, { type: 'nextHand' })) };
  }
  // A finished table (somebody won): start a new one.
  return { delay: DEMO_HAND_PAUSE_MS * 1.5, next: () => createDemoState(seed + s.table.handNo + 1) };
}

/**
 * Attract mode for the portal: six bots play the real engine and AI at Fast
 * speed. Hole cards stay face down except at showdown. No keyboard, no
 * stats, no storage; frozen while `active` is false.
 */
export function HoldemDemo({ active = true }: ArcadeDemoProps) {
  const seed = useMemo(() => 0x5eed, []);
  const [state, setState] = useState(() => createDemoState(seed));

  useEffect(() => {
    if (!active) return;
    const { delay, next } = step(state, seed);
    const id = window.setTimeout(() => setState(next), delay);
    return () => window.clearTimeout(id);
  }, [active, state, seed]);

  return (
    <div className="arc-demo" aria-hidden="true">
      <Table
        state={state}
        theme="neon"
        deck="color"
        speed="fast"
        cues={{}}
        callouts={{}}
        onOpenCharacter={() => {}}
        orientation="landscape"
        mini
      />
    </div>
  );
}

export default HoldemDemo;
