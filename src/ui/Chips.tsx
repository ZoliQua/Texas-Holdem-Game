import type { CSSProperties } from 'react';
import { useLang, useMessages } from '../arcade';
import { MESSAGES } from '../i18n';
import { formatChips } from './format';
import styles from './Table.module.css';

/** Chip denominations used to draw a stack (colour is decoration; the amount is always written). */
const DENOMS = [1000, 500, 100, 25, 5, 1];

/** Up to `max` chips, biggest denominations first. */
function chipStack(amount: number, max = 7): number[] {
  const out: number[] = [];
  let rest = Math.max(0, Math.floor(amount));
  for (const d of DENOMS) {
    while (rest >= d && out.length < max) {
      out.push(d);
      rest -= d;
    }
  }
  return out;
}

export function Chips({
  amount,
  colors,
  label = true,
  className,
  style,
}: {
  amount: number;
  colors: readonly string[];
  label?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const t = useMessages(MESSAGES);
  const [lang] = useLang();
  if (amount <= 0) return null;
  const stack = chipStack(amount);
  return (
    <span className={`${styles.chips} ${className ?? ''}`} style={style} aria-label={t('chipsLabel', { n: formatChips(amount, lang) })}>
      <svg viewBox={`0 0 24 ${10 + stack.length * 3}`} className={styles.chipSvg} aria-hidden="true">
        {stack.map((d, i) => (
          <ellipse
            key={i}
            cx="12"
            cy={6 + (stack.length - 1 - i) * 3}
            rx="10"
            ry="4"
            fill={colors[DENOMS.indexOf(d) % colors.length]}
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeDasharray="3 2.4"
          />
        ))}
      </svg>
      {label && <span className={styles.chipAmount}>{formatChips(amount, lang)}</span>}
    </span>
  );
}
