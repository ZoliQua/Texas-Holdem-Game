import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LegalActions } from '../engine/types';
import { ActionBar, type ActionBarHandle } from './ActionBar';
import { presetAmount } from './sizing';

const legal: LegalActions = { canCheck: false, callAmount: 40, minRaiseTo: 120, maxRaiseTo: 1500 };

describe('<ActionBar />', () => {
  it('shows fold, call with the amount and the raise amount; is disabled without a decision', () => {
    const { rerender } = render(<ActionBar legal={legal} pot={140} betTo={60} bb={20} onAction={() => {}} />);
    expect(screen.getByRole('button', { name: /Call 40/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Raise to 120/ })).toBeTruthy();
    rerender(<ActionBar legal={null} pot={140} betTo={60} bb={20} onAction={() => {}} />);
    expect((screen.getByRole('button', { name: /Fold/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('presets set the amounts expected against the legal range', () => {
    const onAction = vi.fn();
    render(<ActionBar legal={legal} pot={140} betTo={60} bb={20} onAction={onAction} />);
    // ½ pot: 60 + 0.5 × (140 + 40) = 150
    fireEvent.click(screen.getByRole('button', { name: /½ pot/ }));
    expect(screen.getByRole('button', { name: /Raise to 150/ })).toBeTruthy();
    // pot: 60 + 180 = 240
    fireEvent.click(screen.getByRole('button', { name: /^Pot/ }));
    fireEvent.click(screen.getByRole('button', { name: /Raise to 240/ }));
    expect(onAction).toHaveBeenLastCalledWith({ kind: 'raise', amount: 240 });
    fireEvent.click(screen.getByRole('button', { name: /All-in/ }));
    fireEvent.click(screen.getByRole('button', { name: /All-in 1\s500/ }));
    expect(onAction).toHaveBeenLastCalledWith({ kind: 'allIn' });
    expect(presetAmount('min', legal, 140, 60)).toBe(120);
    expect(presetAmount(0.75, legal, 140, 60)).toBe(195);
  });

  it('the slider moves the amount within min and max; keys step by the big blind', () => {
    const onAction = vi.fn();
    const ref = createRef<ActionBarHandle>();
    render(<ActionBar ref={ref} legal={legal} pot={140} betTo={60} bb={20} onAction={onAction} />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.min).toBe('120');
    expect(slider.max).toBe('1500');
    fireEvent.change(slider, { target: { value: '333' } });
    expect(screen.getByRole('button', { name: /Raise to 333/ })).toBeTruthy();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: /Raise to 353/ })).toBeTruthy();
    act(() => ref.current?.nudge(-100));
    expect(screen.getByRole('button', { name: /Raise to 120/ })).toBeTruthy();
    act(() => ref.current?.confirm());
    expect(onAction).toHaveBeenLastCalledWith({ kind: 'raise', amount: 120 });
  });

  it('check when there is nothing to call; bet when nobody has bet', () => {
    const onAction = vi.fn();
    render(<ActionBar legal={{ canCheck: true, callAmount: 0, minRaiseTo: 20, maxRaiseTo: 900 }} pot={60} betTo={0} bb={20} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: /Check/ }));
    expect(onAction).toHaveBeenLastCalledWith({ kind: 'check' });
    fireEvent.click(screen.getByRole('button', { name: /Bet 20/ }));
    expect(onAction).toHaveBeenLastCalledWith({ kind: 'bet', amount: 20 });
  });
});
