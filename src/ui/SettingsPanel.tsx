import { SPEEDS, type Speed } from '../game/speed';
import { DECK_STYLES, TABLE_THEMES, THEMES, type DeckStyle, type TableTheme } from './themes';

const SPEED_LABEL: Record<Speed, string> = { slow: 'Slow', normal: 'Normal', fast: 'Fast' };
const DECK_LABEL: Record<DeckStyle, string> = { color: 'Four-colour', grey: 'Grey' };

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
  return (
    <>
      <Segmented label="Table" value={table} options={TABLE_THEMES} names={(t) => THEMES[t].label.split(' ').pop() ?? t} onChange={(v) => set({ table: v })} />
      <Segmented label="Deck" value={deck} options={DECK_STYLES} names={(d) => DECK_LABEL[d]} onChange={(v) => set({ deck: v })} />
      <Segmented label="Speed" value={speed} options={SPEEDS} names={(s) => SPEED_LABEL[s]} onChange={(v) => set({ speed: v })} />
    </>
  );
}

export default SettingsPanel;
