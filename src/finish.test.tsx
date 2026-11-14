import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDental, applyLang, formatNumber, loadSession, saveSession } from './arcade';
import { STARTING_STACK } from './engine/tournament';
import { standingPlace, tournamentScore } from './game/scoring';
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

/** Restores the rigged table and resumes it (the player is first to act). */
function resume(stacks: number[]) {
  const s = riggedSixMax(stacks);
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
  it('counts the players still in with more chips (stack + chips already in the pot); ties share the better place', () => {
    const s = riggedSixMax([1000, 2600, 2400, 800, 1100, 1100]);
    expect(standingPlace(s.table.players, PLAYER_ID)).toBe(5);
    expect(standingPlace(s.table.players, s.table.players[4].id)).toBe(3);
    expect(standingPlace(s.table.players, s.table.players[5].id)).toBe(3);
    // Busted players are already placed below everybody still in.
    const out = s.table.players.map((p, i) => (i === 1 ? { ...p, stack: 0, committed: 0, out: true } : p));
    expect(standingPlace(out, PLAYER_ID)).toBe(4);
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

  it('the chip leader gets the winner’s points', () => {
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
    expect(s.table.handNo).toBe(1);
  });
});
