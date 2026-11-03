import { useEffect, useRef } from 'react';
import type { TellCue } from '../bots/tells';
import { SPEED_FACTOR, type Speed } from './speed';
import { botToAct, planBotTurn, type GameAction, type GameState } from './state';

/**
 * Schedules the acting bot's decision. When it becomes a bot's turn (and the
 * game is not paused or animating), the bot decides from its BotView, its
 * tell cue is reported through `onCue`, and the action is dispatched after
 * its visible thinking time. Exactly one action per turn: any change of the
 * turn, a pause or unmounting cancels the timer, and the decision is
 * deterministic per turn, so resuming re-schedules the very same action.
 */
export function useBotTurns(o: {
  state: GameState;
  dispatch: (a: GameAction) => void;
  paused: boolean;
  speed: Speed;
  onCue(id: string, cue: TellCue | null): void;
  /** The acting bot and its scaled thinking time (for the turn ring), or null when it acts. */
  onTurn?(turn: { id: string; ms: number } | null): void;
}): void {
  const { state, dispatch, paused, speed } = o;
  const onCue = useRef(o.onCue);
  onCue.current = o.onCue;
  const onTurn = useRef(o.onTurn);
  onTurn.current = o.onTurn;
  const latest = useRef(state);
  latest.current = state;

  const bot = botToAct(state);
  const active = bot !== null && !paused && state.pending === null;
  // Identifies one turn: the same hand, the same number of events, the same seat.
  const turnKey = active ? `${state.table.handNo}:${state.table.events.length}:${bot.id}` : null;

  useEffect(() => {
    if (turnKey === null) return;
    const plan = planBotTurn(latest.current);
    if (!plan) return;
    const ms = Math.round(plan.thinkMs * SPEED_FACTOR[speed]);
    onCue.current(plan.id, plan.cue);
    onTurn.current?.({ id: plan.id, ms });
    const timer = window.setTimeout(() => {
      onCue.current(plan.id, null);
      onTurn.current?.(null);
      dispatch({ type: 'bot', id: plan.id, action: plan.action });
    }, ms);
    return () => {
      window.clearTimeout(timer);
      onTurn.current?.(null);
    };
  }, [turnKey, speed, dispatch]);
}
