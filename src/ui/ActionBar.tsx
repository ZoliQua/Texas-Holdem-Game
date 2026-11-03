import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Action, LegalActions } from '../engine/types';
import { formatChips } from './format';
import { presetAmount } from './sizing';
import styles from './ActionBar.module.css';

export type ActionBarHandle = {
  focusSlider(): void;
  /** Moves the raise amount by `steps` big blinds. */
  nudge(steps: number): void;
  setAllIn(): void;
  /** Confirms the selected bet / raise (Enter). */
  confirm(): void;
  fold(): void;
  checkOrCall(): void;
};

export type ActionBarProps = {
  /** Null while it is not the player's turn or the table is animating. */
  legal: LegalActions | null;
  /** Chips in the middle including every current bet. */
  pot: number;
  /** The bet to match on this street. */
  betTo: number;
  bb: number;
  onAction(a: Action): void;
};

const PRESETS: { label: string; f: number | 'min' | 'max' }[] = [
  { label: 'Min', f: 'min' },
  { label: '½ pot', f: 0.5 },
  { label: '¾ pot', f: 0.75 },
  { label: 'Pot', f: 1 },
  { label: 'All-in', f: 'max' },
];

/** Fold · Check/Call · Bet/Raise with a slider, presets and a confirm button showing the amount. */
export const ActionBar = forwardRef<ActionBarHandle, ActionBarProps>(function ActionBar({ legal, pot, betTo, bb, onAction }, ref) {
  const canRaise = legal !== null && legal.minRaiseTo !== null;
  const min = legal?.minRaiseTo ?? 0;
  const max = legal?.maxRaiseTo ?? 0;
  const [amount, setAmount] = useState(min);
  const slider = useRef<HTMLInputElement>(null);
  const latest = useRef({ legal, amount, min, max });
  latest.current = { legal, amount, min, max };

  // A new decision starts at the minimum raise.
  const decisionKey = legal ? `${legal.callAmount}:${legal.minRaiseTo}:${legal.maxRaiseTo}:${betTo}` : null;
  useEffect(() => {
    if (legal?.minRaiseTo != null) setAmount(legal.minRaiseTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionKey]);

  const value = Math.min(max, Math.max(min, amount));
  const bet = betTo === 0;
  const allIn = canRaise && value >= max;
  const raiseLabel = allIn ? `All-in ${formatChips(value)}` : `${bet ? 'Bet' : 'Raise to'} ${formatChips(value)}`;

  const act = (a: Action) => {
    if (latest.current.legal) onAction(a);
  };
  const fold = () => act({ kind: 'fold' });
  const checkOrCall = () => act(latest.current.legal?.canCheck ? { kind: 'check' } : { kind: 'call' });
  const confirm = () => {
    const l = latest.current;
    if (!l.legal || l.legal.minRaiseTo === null) return;
    const v = Math.min(l.max, Math.max(l.min, l.amount));
    act(v >= l.max ? { kind: 'allIn' } : { kind: betTo === 0 ? 'bet' : 'raise', amount: v });
  };

  useImperativeHandle(ref, () => ({
    focusSlider: () => slider.current?.focus(),
    nudge: (steps) => setAmount((a) => Math.min(latest.current.max, Math.max(latest.current.min, a + steps * bb))),
    setAllIn: () => setAmount(latest.current.max),
    confirm,
    fold,
    checkOrCall,
  }));

  const disabled = legal === null;
  return (
    <div className={styles.bar} role="group" aria-label="Your action" aria-disabled={disabled}>
      <div className={styles.main}>
        <button type="button" className={`arc-btn ${styles.fold}`} onClick={fold} disabled={disabled}>
          Fold <kbd className="arc-kbd">F</kbd>
        </button>
        <button type="button" className={`arc-btn ${styles.call}`} onClick={checkOrCall} disabled={disabled}>
          {legal?.canCheck || !legal ? 'Check' : `Call ${formatChips(legal.callAmount)}`}{' '}
          <kbd className="arc-kbd">C</kbd>
        </button>
        <button type="button" className={`arc-btn arc-btn--primary ${styles.raise}`} onClick={confirm} disabled={disabled || !canRaise}>
          {canRaise ? raiseLabel : bet ? 'Bet' : 'Raise'} <kbd className="arc-kbd">Enter</kbd>
        </button>
      </div>
      <div className={styles.sizing}>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>
            {bet ? 'Bet' : 'Raise to'} <kbd className="arc-kbd">R</kbd> <kbd className="arc-kbd">←</kbd>
            <kbd className="arc-kbd">→</kbd>
          </span>
          <input
            ref={slider}
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            disabled={disabled || !canRaise}
            onChange={(e) => setAmount(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirm();
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                // One big blind per step (the native step of one chip is too fine).
                e.preventDefault();
                const dir = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1;
                setAmount((a) => Math.min(max, Math.max(min, a + dir * bb)));
              }
            }}
            aria-label={bet ? 'Bet amount' : 'Raise to'}
            aria-valuetext={formatChips(value)}
          />
        </label>
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`arc-btn arc-btn--ghost ${styles.preset}`}
              disabled={disabled || !canRaise}
              aria-pressed={canRaise && legal !== null && presetAmount(p.f, legal, pot, betTo) === value}
              onClick={() => legal && setAmount(presetAmount(p.f, legal, pot, betTo))}
            >
              {p.label}
              {p.f === 'max' && <kbd className="arc-kbd">A</kbd>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ActionBar;
