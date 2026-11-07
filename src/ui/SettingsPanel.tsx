import { useMessages } from '../arcade';
import { SPEEDS, type Speed } from '../game/speed';
import { MESSAGES, type MessageKey } from '../i18n';
import { DECK_STYLES, TABLE_THEMES, type DeckStyle, type TableTheme } from './themes';

const SPEED_LABEL: Record<Speed, MessageKey> = { slow: 'speedSlow', normal: 'speedNormal', fast: 'speedFast' };
const DECK_LABEL: Record<DeckStyle, MessageKey> = { color: 'deckColor', grey: 'deckGrey' };
const THEME_LABEL: Record<TableTheme, MessageKey> = { neon: 'themeNeon', classic: 'themeClassic', luxe: 'themeLuxe' };

function Segmented<T extends string>({ label, value, options, names, onChange }: {
  label: string;
  value: T;
  options: readonly T[];
  names: (v: T) => string;
  onChange(v: T): void;
}) {
  return (
    <div className="arc-field" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="arc-segmented">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={o === value} onClick={() => onChange(o)}>
            {names(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Table theme, deck and animation speed. */
export function SettingsPanel({ table, deck, speed, set }: {
  table: TableTheme;
  deck: DeckStyle;
  speed: Speed;
  set(p: Partial<{ table: TableTheme; deck: DeckStyle; speed: Speed }>): void;
}) {
  const t = useMessages(MESSAGES);
  return (
    <>
      <Segmented label={t('setTable')} value={table} options={TABLE_THEMES} names={(v) => t(THEME_LABEL[v])} onChange={(v) => set({ table: v })} />
      <Segmented label={t('setDeck')} value={deck} options={DECK_STYLES} names={(d) => t(DECK_LABEL[d])} onChange={(v) => set({ deck: v })} />
      <Segmented label={t('setSpeed')} value={speed} options={SPEEDS} names={(s) => t(SPEED_LABEL[s])} onChange={(v) => set({ speed: v })} />
    </>
  );
}

export default SettingsPanel;
