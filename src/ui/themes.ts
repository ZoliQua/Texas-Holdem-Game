export type TableTheme = 'neon' | 'classic' | 'luxe';
export type DeckStyle = 'color' | 'grey';

export const TABLE_THEMES: readonly TableTheme[] = ['neon', 'classic', 'luxe'];
export const DECK_STYLES: readonly DeckStyle[] = ['color', 'grey'];

export type ThemeSpec = {
  label: string;
  /** Room behind the table. */
  bg: string;
  rail: [string, string];
  railStroke: string;
  felt: [string, string];
  feltLine: string;
  /** Card back. */
  back: string;
  seat: string;
  seatStroke: string;
  text: string;
  /** Chip colours (paired with dashed edges and amounts — never the only cue). */
  chips: [string, string, string];
  /** Outer glow of the rail (neon only). */
  glow: string | null;
  /** Highlight for the active seat and the winning cards. */
  highlight: string;
};

/* Colours from the approved mockup (poker-table.html). */
export const THEMES: Record<TableTheme, ThemeSpec> = {
  neon: {
    label: 'Arcade neon',
    bg: '#0f1016',
    rail: ['#1c1e29', '#14151e'],
    railStroke: '#6b8cff',
    felt: ['#1f2333', '#151826'],
    feltLine: 'rgba(107,140,255,.35)',
    back: '#2b3a7a',
    seat: '#181a23',
    seatStroke: '#6b8cff',
    text: '#d8dae3',
    chips: ['#ef4c55', '#6b8cff', '#42d392'],
    glow: '#6b8cff',
    highlight: '#f4b860',
  },
  classic: {
    label: 'Classic casino',
    bg: '#101114',
    rail: ['#6b3a1f', '#3b1e0e'],
    railStroke: '#c9a46a',
    felt: ['#2f8f55', '#145a32'],
    feltLine: 'rgba(255,255,255,.18)',
    back: '#9b1c2c',
    seat: '#1d1f27',
    seatStroke: '#c9a46a',
    text: '#f5f6fa',
    chips: ['#d62828', '#1f6feb', '#111111'],
    glow: null,
    highlight: '#ffd166',
  },
  luxe: {
    label: 'Elegant dark',
    bg: '#0b0c10',
    rail: ['#26262b', '#0e0e11'],
    railStroke: '#b8954f',
    felt: ['#1d3b6b', '#0d1f3d'],
    feltLine: 'rgba(184,149,79,.35)',
    back: '#1b1b1f',
    seat: '#15161b',
    seatStroke: '#b8954f',
    text: '#efe7d6',
    chips: ['#b8954f', '#8b1e2d', '#e8e8e8'],
    glow: null,
    highlight: '#e9c46a',
  },
};

/** Four-colour deck (default) and the one-tone grey deck; suits always differ by shape. */
export const SUIT_FILL: Record<DeckStyle, Record<'s' | 'h' | 'd' | 'c', string>> = {
  color: { s: '#1b1b1f', h: '#d62828', d: '#1f6feb', c: '#1f9d45' },
  grey: { s: '#3b3d45', h: '#3b3d45', d: '#3b3d45', c: '#3b3d45' },
};
