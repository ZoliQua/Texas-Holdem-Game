import { useDental, useMessages } from '../arcade';
import { SPEEDS, type Speed } from '../game/speed';
import { MESSAGES, type MessageKey } from '../i18n';
import { DentalToggle } from './DentalToggle';
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

/** Table theme, deck, animation speed and the shared dental mode. */
export function SettingsPanel({ table, deck, speed, set, dentalRowClass }: {
  table: TableTheme;
  /** Layout class for the dental-mode checkbox row. */
  dentalRowClass?: string;
  deck: DeckStyle;
  speed: Speed;
  set(p: Partial<{ table: TableTheme; deck: DeckStyle; speed: Speed }>): void;
}) {
  const t = useMessages(MESSAGES);
  const [dental] = useDental();
  return (
    <>
      <Segmented label={t('setTable')} value={table} options={TABLE_THEMES} names={(v) => t(THEME_LABEL[v])} onChange={(v) => set({ table: v })} />
      {dental && <p style={{ margin: 0, fontSize: 12, opacity: 0.75 }}>{t('clinicNote')}</p>}
      <Segmented label={t('setDeck')} value={deck} options={DECK_STYLES} names={(d) => t(DECK_LABEL[d])} onChange={(v) => set({ deck: v })} />
      <Segmented label={t('setSpeed')} value={speed} options={SPEEDS} names={(s) => t(SPEED_LABEL[s])} onChange={(v) => set({ speed: v })} />
      <DentalToggle className={dentalRowClass} />
    </>
  );
}

export default SettingsPanel;
