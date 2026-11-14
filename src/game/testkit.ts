/* Shared helpers for controller tests (not imported by the app). */
import { advance, createInitialState, isPlayerTurn, planBotTurn, type GameState, type Setup } from './state';
import { startHand } from '../engine/hand';
import { newTournament } from '../engine/tournament';

export const startGame = (setup: Partial<Setup> = {}, seed = 7): GameState =>
  advance(createInitialState(), {
    type: 'start',
    setup: { format: 'sixMax', difficulty: 'easy', length: 45, ...setup },
    seed,
  });

/** Lets bots act and settles animations until the player must act or the hand is over. */
export function runBots(s: GameState, limit = 500, onStep?: (s: GameState) => void): GameState {
  for (let i = 0; i < limit; i += 1) {
    if (s.pending !== null) s = advance(s, { type: 'settle', nonce: s.pending });
    else if (s.phase === 'playing' && !isPlayerTurn(s)) {
      const plan = planBotTurn(s);
      if (!plan) break;
      s = advance(s, { type: 'bot', id: plan.id, action: plan.action });
    } else break;
    onStep?.(s);
  }
  return s;
}

/** Plays (dealing new hands as needed) until the player is to act or the run is over. */
export function untilPlayerTurn(s: GameState, onStep?: (s: GameState) => void): GameState {
  for (let i = 0; i < 400; i += 1) {
    s = runBots(s, 500, onStep);
    if (isPlayerTurn(s) || s.phase === 'finished') return s;
    if (s.phase === 'handOver') {
      s = advance(s, { type: 'nextHand' });
      onStep?.(s);
    }
  }
  return s;
}

/**
 * A 6-max tournament on hand 1 with the given stacks (seat 0 = the player, sum 6 × 1500) and the
 * button on seat 3, so the player is under the gun and acts first: nothing has moved yet.
 */
export function riggedSixMax(stacks: number[], difficulty: Setup['difficulty'] = 'medium', seed = 11): GameState {
  const s = startGame({ difficulty }, seed);
  const ids = s.table.players.map((p) => p.id);
  let t = newTournament({ seed, playerIds: ids, handsPerLevel: s.table.handsPerLevel });
  t = startHand({ ...t, button: 3, players: t.players.map((p, i) => ({ ...p, stack: stacks[i] })) });
  return { ...s, table: t, log: [t.events] };
}
