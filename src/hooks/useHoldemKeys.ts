import { useEffect, useRef } from 'react';
import { ARCADE_KEYS, isKey, shouldIgnoreKey } from '../arcade';

export type HoldemKeyHandlers = {
  /** A dialog is open: Enter confirms, Esc cancels; nothing else. */
  dialog: boolean;
  onDialogConfirm(): void;
  onDialogCancel(): void;
  /** Enter / Space outside the table: start, resume, next. */
  onPrimary(): void;
  onFold(): void;
  onCheckCall(): void;
  onFocusRaise(): void;
  onNudge(steps: number): void;
  onAllIn(): void;
  onConfirm(): void;
  onTogglePause(): void;
};

/** One window listener for the game's hotkeys (handlers through a ref; ignores typing and modifiers). */
export function useHoldemKeys(h: HoldemKeyHandlers): void {
  const ref = useRef(h);
  ref.current = h;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreKey(e)) return;
      const k = ref.current;
      const onButton = (e.target as HTMLElement | null)?.tagName === 'BUTTON';
      if (k.dialog) {
        if (e.key === 'Escape') {
          e.preventDefault();
          k.onDialogCancel();
        } else if (e.key === 'Enter' && !onButton) {
          e.preventDefault();
          k.onDialogConfirm();
        }
        return;
      }
      if (isKey(e, ARCADE_KEYS.pause)) {
        e.preventDefault();
        k.onTogglePause();
        return;
      }
      switch (e.key) {
        case 'f':
        case 'F':
          k.onFold();
          break;
        case 'c':
        case 'C':
          k.onCheckCall();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          k.onFocusRaise();
          break;
        case 'a':
        case 'A':
          k.onAllIn();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          k.onNudge(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          k.onNudge(1);
          break;
        case 'Enter':
          // A focused button handles Enter natively (one click).
          if (onButton) return;
          e.preventDefault();
          k.onConfirm();
          break;
        case ' ':
          if (onButton) return;
          e.preventDefault();
          k.onPrimary();
          break;
        default:
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
