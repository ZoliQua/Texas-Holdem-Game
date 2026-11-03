import { useCallback, useState } from 'react';
import { readString, writeString } from '../arcade';
import { SPEEDS, type Speed } from '../game/speed';
import { DECK_STYLES, TABLE_THEMES, type DeckStyle, type TableTheme } from './themes';

export { SPEED_FACTOR, type Speed } from '../game/speed';

export const SETTINGS_KEYS = { table: 'holdem.table', deck: 'holdem.deck', speed: 'holdem.speed' } as const;

type Settings = { table: TableTheme; deck: DeckStyle; speed: Speed };

const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  const v = readString(key);
  return allowed.includes(v as T) ? (v as T) : fallback;
};

export function readSettings(): Settings {
  return {
    table: pick(SETTINGS_KEYS.table, TABLE_THEMES, 'neon'),
    deck: pick(SETTINGS_KEYS.deck, DECK_STYLES, 'color'),
    speed: pick(SETTINGS_KEYS.speed, SPEEDS, 'normal'),
  };
}

/** Table theme, deck and speed, remembered in localStorage. */
export function useSettings(): Settings & { set(p: Partial<Settings>): void } {
  const [settings, setSettings] = useState(readSettings);
  const set = useCallback((p: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...p };
      (Object.keys(p) as (keyof Settings)[]).forEach((k) => writeString(SETTINGS_KEYS[k], next[k]));
      return next;
    });
  }, []);
  return { ...settings, set };
}
