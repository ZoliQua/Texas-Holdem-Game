import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useIsTouch, useLang, useMessages } from '../arcade';
import type { Action, LegalActions } from '../engine/types';
import { MESSAGES, type MessageKey } from '../i18n';
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

const PRESETS: { label: MessageKey; f: number | 'min' | 'max' }[] = [
  { label: 'presetMin', f: 'min' },
  { label: 'presetHalf', f: 0.5 },
  { label: 'presetThreeQuarter', f: 0.75 },
  { label: 'presetPot', f: 1 },
  { label: 'presetAllIn', f: 'max' },
];

/** Fold · Check/Call · Bet/Raise with a slider, presets and a confirm button showing the amount. */
export const ActionBar = forwardRef<ActionBarHandle, ActionBarProps>(function ActionBar({ legal, pot, betTo, bb, onAction }, ref) {
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
  // On a phone the bar is the bottom bar: no key hints, thumb-sized controls (see the coarse-pointer CSS).
  const touch = useIsTouch();
  const kbd = (k: string) => (touch ? null : <kbd className="arc-kbd">{k}</kbd>);
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
  const raiseLabel = t(allIn ? 'abAllInN' : bet ? 'abBetN' : 'abRaiseToN', { n: formatChips(value, lang) });

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
    <div className={styles.bar} role="group" aria-label={t('abGroup')} aria-disabled={disabled} data-touch={touch}>
      <div className={styles.main}>
        <button type="button" className={`arc-btn ${styles.fold}`} onClick={fold} disabled={disabled}>
          {t('abFold')} {kbd('F')}
        </button>
        <button type="button" className={`arc-btn ${styles.call}`} onClick={checkOrCall} disabled={disabled}>
          {legal?.canCheck || !legal ? t('abCheck') : t('abCallN', { n: formatChips(legal.callAmount, lang) })}{' '}
          {kbd('C')}
        </button>
        <button type="button" className={`arc-btn arc-btn--primary ${styles.raise}`} onClick={confirm} disabled={disabled || !canRaise}>
          {canRaise ? raiseLabel : bet ? t('abBet') : t('abRaise')} {kbd('Enter')}
        </button>
      </div>
      <div className={styles.sizing}>
        <label className={styles.slider}>
          <span className={styles.sliderLabel}>
            {bet ? t('abBet') : t('abRaiseTo')} {kbd('R')} {kbd('←')}
            {kbd('→')}
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
            aria-label={bet ? t('abBetAmount') : t('abRaiseTo')}
            aria-valuetext={formatChips(value, lang)}
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
              {t(p.label)}
              {p.f === 'max' && kbd('A')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ActionBar;
