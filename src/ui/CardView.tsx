import type { CSSProperties } from 'react';
import { Tooth, useDental, useMessages } from '../arcade';
import { rankLabel, rankOf, suitOf, type Card, type Suit } from '../engine/cards';
import { MESSAGES } from '../i18n';
import { cardNameText } from './format';
import { SUIT_FILL, type DeckStyle } from './themes';
import styles from './CardView.module.css';

/*
 * Suit shapes as paths in a 100 × 100 box — drawn, not font glyphs, so they
 * are large, identical on every platform, never turn into emoji, and stay
 * distinct in the one-tone grey deck.
 */
export function SuitShape({ suit, fill, x = 0, y = 0, size = 100 }: { suit: Suit; fill: string; x?: number; y?: number; size?: number }) {
  const t = `translate(${x} ${y}) scale(${size / 100})`;
  switch (suit) {
    case 'h':
      return (
        <path
          data-suit="h"
          transform={t}
          fill={fill}
          d="M50 92 C22 70 2 50 2 29 C2 13 14 2 29 2 C39 2 46 8 50 17 C54 8 61 2 71 2 C86 2 98 13 98 29 C98 50 78 70 50 92 Z"
        />
      );
    case 'd':
      return <path data-suit="d" transform={t} fill={fill} d="M50 2 L88 50 L50 98 L12 50 Z" />;
    case 's':
      return (
        <path
          data-suit="s"
          transform={t}
          fill={fill}
          d="M50 2 C38 22 4 40 4 63 C4 78 15 87 28 87 C37 87 44 83 47 76 C46 88 41 94 32 98 L68 98 C59 94 54 88 53 76 C56 83 63 87 72 87 C85 87 96 78 96 63 C96 40 62 22 50 2 Z"
        />
      );
    case 'c':
      return (
        <g data-suit="c" transform={t} fill={fill}>
          <circle cx="50" cy="27" r="22" />
          <circle cx="25" cy="60" r="22" />
          <circle cx="75" cy="60" r="22" />
          <path d="M45 50 L55 50 C55 72 60 88 70 98 L30 98 C40 88 45 72 45 50 Z" />
        </g>
      );
  }
}

export type CardViewProps = {
  card: Card | null;
  deck: DeckStyle;
  /** Width in px (or any CSS length through `style`). */
  size: number;
  highlight?: boolean;
  faceDown?: boolean;
  /** Card-back colour (from the table theme). */
  back?: string;
  className?: string;
  style?: CSSProperties;
};

/** One playing card: big corner index (readable when overlapped) and a big centre pip. */
export function CardView({ card, deck, size, highlight = false, faceDown = false, back = '#2b3a7a', className, style }: CardViewProps) {
  const t = useMessages(MESSAGES);
  const [dental] = useDental();
  const hidden = faceDown || card === null;
  const cls = [styles.card, highlight ? styles.highlight : '', hidden ? styles.down : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  const css: CSSProperties = { ...(size > 0 ? { width: size } : null), ...style };
  if (hidden) {
    return (
      <svg className={cls} style={css} viewBox="0 0 100 140" role="img" aria-label={t('cardDown')}>
        <rect x="1.5" y="1.5" width="97" height="137" rx="11" fill={back} stroke="rgba(255,255,255,.7)" strokeWidth="3" />
        <rect x="12" y="12" width="76" height="116" rx="7" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" />
        {dental ? (
          // Dental mode: a tooth logo in a ring instead of the diamond.
          <g data-testid="holdem-card-back-tooth">
            <circle cx="50" cy="70" r="30" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.4)" strokeWidth="2" />
            <g transform="translate(26 46)">
              <Tooth size={48} fill="rgba(255,255,255,.92)" stroke="rgba(255,255,255,.55)" />
            </g>
          </g>
        ) : (
          <g data-testid="holdem-card-back-classic">
            <path d="M50 30 L70 70 L50 110 L30 70 Z" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2" />
            <circle cx="50" cy="70" r="9" fill="rgba(255,255,255,.22)" />
          </g>
        )}
      </svg>
    );
  }
  const suit = suitOf(card);
  const fill = SUIT_FILL[deck][suit];
  const rank = rankLabel(rankOf(card));
  return (
    <svg className={cls} style={css} viewBox="0 0 100 140" role="img" aria-label={cardNameText(card, t)} data-card={card}>
      <title>{cardNameText(card, t)}</title>
      <rect
        x="1.5"
        y="1.5"
        width="97"
        height="137"
        rx="11"
        fill="#fbfbf7"
        stroke={highlight ? '#111' : 'rgba(0,0,0,.35)'}
        strokeWidth={highlight ? 6 : 2}
      />
      <text
        x="9"
        y="38"
        fill={fill}
        fontSize={rank === '10' ? 31 : 36}
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing={rank === '10' ? -2 : 0}
      >
        {rank}
      </text>
      <SuitShape suit={suit} fill={fill} x={10} y={45} size={26} />
      <SuitShape suit={suit} fill={fill} x={34} y={66} size={60} />
    </svg>
  );
}

export default CardView;
