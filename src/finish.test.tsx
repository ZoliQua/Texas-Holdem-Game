import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, loadSession, saveSession } from './arcade';
import { STARTING_STACK } from './engine/tournament';
import { completedHands, MIN_FINISH_HANDS, standingPlace, tournamentScore } from './game/scoring';
import { advance, isPlayerTurn, PLAYER_ID, type GameState } from './game/state';
import { riggedSixMax } from './game/testkit';
import { HoldemGame, SESSION_SCHEMA } from './HoldemGame';

beforeEach(() => {
  localStorage.clear();
  applyDental(false, { silent: true });
  applyLang('hu', { silent: true });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  applyLang('en', { silent: true });
});

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const finishBtn = () => screen.queryByRole('button', { name: 'Befejezés' });
const confirmText = () => {
  const d = screen.getByRole('alertdialog');
  return document.getElementById(d.getAttribute('aria-describedby') ?? '')?.textContent;
};
const save = (data: GameState) => saveSession('holdem', { schema: SESSION_SCHEMA, data, seconds: 42, score: 0 });
const medium = (place: number) => tournamentScore({ difficulty: 'medium', format: 'sixMax', place });

/** Restores the rigged table (by default with enough hands behind it to rank a place) and resumes it; the player acts first. */
function resume(stacks: number[], handsPlayed = MIN_FINISH_HANDS) {
  const s = riggedSixMax(stacks, { handsPlayed });
  expect(completedHands(s.table)).toBe(handsPlayed);
  expect(isPlayerTurn(s)).toBe(true);
  expect(stacks.reduce((a, b) => a + b, 0)).toBe(6 * STARTING_STACK);
  save(s);
  const onGameOver = vi.fn();
  const onRunEnd = vi.fn();
  render(<HoldemGame onGameOver={onGameOver} onRunEnd={onRunEnd} />);
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Üdv újra!' })).getByRole('button', { name: /Folytatás/ }));
  return { s, onGameOver, onRunEnd };
}

describe('standingPlace', () => {
  it('counts the players still in with at least as many chips (stack + chips already in the pot): ties take the worse place', () => {
    const s = riggedSixMax([1000, 2600, 2400, 800, 1100, 1100]);
    expect(standingPlace(s.table.players, PLAYER_ID)).toBe(5);
    expect(standingPlace(s.table.players, s.table.players[4].id)).toBe(4);
    expect(standingPlace(s.table.players, s.table.players[5].id)).toBe(4);
    // A fresh deal: everybody still has the starting stack (blinds count as theirs), so all six tie for 6th.
    const fresh = riggedSixMax([1500, 1500, 1500, 1500, 1500, 1500]);
    expect(standingPlace(fresh.table.players, PLAYER_ID)).toBe(6);
    // Busted players are already placed below everybody still in.
    const out = s.table.players.map((p, i) => (i === 1 ? { ...p, stack: 0, committed: 0, out: true } : p));
    expect(standingPlace(out, PLAYER_ID)).toBe(4);
  });

  it('a hand counts as completed once it is over', () => {
    const s = riggedSixMax([1000, 2600, 2400, 800, 1100, 1100], { handsPlayed: 4 });
    expect(completedHands(s.table)).toBe(4);
    expect(completedHands({ ...s.table, street: 'done' })).toBe(5);
    expect(MIN_FINISH_HANDS).toBe(10);
  });

  it('the reducer ends the run on the standing place and marks it finished early', () => {
    const s = riggedSixMax([1000, 2600, 2400, 800, 1100, 1100]);
    const f = advance(s, { type: 'finish' });
    expect(f).toMatchObject({ phase: 'finished', playerPlace: 5, finishedEarly: true, pending: null });
    expect(advance(f, { type: 'finish' })).toBe(f);
  });
});

describe('Hold’em finish early', () => {
  it('is hidden before the tournament starts and visible once it is dealt', () => {
    applyLang('en', { silent: true });
    render(<HoldemGame />);
    expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Deal me in/ }));
    expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy();
  });

  it('confirms with the points of the current place, ranks them once and shows the finished card', () => {
    // 5th of the six by chips → what a 5th place pays on Medium.
    const { onGameOver, onRunEnd } = resume([1000, 2600, 2400, 800, 1100, 1100]);
    const points = medium(5);
    expect(points).toBe(250);
    fireEvent.click(finishBtn()!);
    expect(confirmText()).toBe(`Befejezed a játékot? ${formatNumber(points, 'hu')} pont kerül a ranglistára.`);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(points, { finished: true });
    expect(onRunEnd).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'finished', score: points }));
    const card = screen.getByRole('dialog', { name: 'Idő előtt befejezve' });
    expect(card.textContent).toContain('5. hely a zsetonok alapján');
    expect(card.textContent).toContain(`+${formatNumber(points, 'hu')} pont`);
    expect(loadSession('holdem', SESSION_SCHEMA)).toBeNull();
    tick(20_000);
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(finishBtn()).toBeNull();
  });

  it('after the minimum number of hands the chip leader gets the winner’s points', () => {
    const { onGameOver } = resume([3000, 1200, 1200, 1200, 1200, 1200]);
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledWith(medium(1), { finished: true });
    expect(medium(1)).toBe(2500);
  });

  it('finishing last by chips ranks 0 points, once', () => {
    const { onGameOver } = resume([500, 1700, 1700, 1700, 1700, 1700]);
    expect(medium(6)).toBe(0);
    fireEvent.click(finishBtn()!);
    expect(screen.getByRole('alertdialog').textContent).toContain('0 pont kerül a ranglistára');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
  });

  it('a tie with the leader takes the worse place', () => {
    // The player and seat 1 both have 2,000: they tie for 1st and 2nd, so the player is 2nd.
    const { onGameOver } = resume([2000, 2000, 1250, 1250, 1250, 1250]);
    expect(medium(2)).toBe(1500);
    fireEvent.click(finishBtn()!);
    expect(confirmText()).toBe(`Befejezed a játékot? ${formatNumber(medium(2), 'hu')} pont kerül a ranglistára.`);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledWith(medium(2), { finished: true });
  });

  it('Deal → Finish ranks 0 (even as the chip leader) until enough hands are completed', () => {
    const { onGameOver } = resume([3000, 1200, 1200, 1200, 1200, 1200], 0);
    fireEvent.click(finishBtn()!);
    expect(confirmText()).toBe('Befejezed a játékot? 0 pont kerül a ranglistára.');
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
    const card = screen.getByRole('dialog', { name: 'Idő előtt befejezve' });
    expect(card.textContent).toContain(`${formatNumber(MIN_FINISH_HANDS, 'hu')} leosztásnál kevesebb ment le: nincs helyezési pont`);
  });

  it('one hand short of the minimum still ranks 0; at the minimum the place share applies', () => {
    const { onGameOver } = resume([3000, 1200, 1200, 1200, 1200, 1200], MIN_FINISH_HANDS - 1);
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Befejezem' }));
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
  });

  it('a fresh 6-max deal finished at once is 0 for everybody (no free 1st place)', () => {
    applyLang('en', { silent: true });
    const onGameOver = vi.fn();
    render(<HoldemGame onGameOver={onGameOver} />);
    fireEvent.click(screen.getByRole('button', { name: /Deal me in/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Finish' }));
    expect(onGameOver).toHaveBeenCalledWith(0, { finished: true });
  });

  it('Cancel changes nothing', () => {
    const { onGameOver } = resume([1000, 2600, 2400, 800, 1100, 1100]);
    const log = () => screen.getByRole('region', { name: /Leosztásnapló|napló/i }).textContent;
    const before = log();
    fireEvent.click(finishBtn()!);
    fireEvent.click(screen.getByRole('button', { name: 'Mégse' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onGameOver).not.toHaveBeenCalled();
    expect(log()).toBe(before);
    expect((screen.getByRole('button', { name: /^Dobás/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(loadSession('holdem', SESSION_SCHEMA)).not.toBeNull();
  });

  it('the bots and the clock stand still while the confirm is open', () => {
    const { s } = resume([1000, 2600, 2400, 800, 1100, 1100]);
    // Let the player check / call so the bots are to act, then open the confirm.
    fireEvent.click(screen.getByRole('button', { name: /^(Megadás|Passz)/ }));
    fireEvent.click(finishBtn()!);
    const log = screen.getByRole('region', { name: /napló/i }).textContent;
    const clock = screen.getByText('Idő').parentElement!.textContent;
    tick(30_000);
    expect(screen.getByRole('region', { name: /napló/i }).textContent).toBe(log);
    expect(screen.getByText('Idő').parentElement!.textContent).toBe(clock);
    expect(s.table.handNo).toBe(MIN_FINISH_HANDS + 1);
  });
});
