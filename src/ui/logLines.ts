import type { LogEvent, Street } from '../engine/types';
import { actionText, actionTextYou, formatChips, ordinal, withArticle } from './format';

export const STREET_LABEL: Record<Street, string> = {
  preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Showdown', done: 'Result',
};

export type Line = { key: string; text: string; cards?: number[]; kind: 'act' | 'show' | 'win' | 'out' | 'info' };
export type Group = { street: Street; board: number[]; lines: Line[] };

/** Turns one hand's events into street groups of readable lines. */
export function handLines(events: readonly LogEvent[], name: (id: string) => string, you: string): { title: string; groups: Group[] } {
  let title = '';
  const groups: Group[] = [];
  let current: Group = { street: 'preflop', board: [], lines: [] };
  const wins = events.filter((e) => e.t === 'win').length;
  const shown = events.some((e) => e.t === 'show');
  let resultOpened = false;
  const openResult = () => {
    if (resultOpened) return;
    resultOpened = true;
    if (current.lines.length || current.board.length) groups.push(current);
    current = { street: 'done', board: [], lines: [] };
  };
  events.forEach((e, i) => {
    const key = `${i}`;
    const who = e.t === 'hand' ? '' : 'id' in e ? e.id : '';
    const isYou = who === you;
    switch (e.t) {
      case 'hand':
        title = `Hand #${e.hand} · Blinds ${formatChips(e.sb)}/${formatChips(e.bb)}`;
        current.lines.push({ key, kind: 'info', text: `${e.button === you ? 'You have' : `${name(e.button)} has`} the button` });
        break;
      case 'blind': {
        const blind = current.lines.some((l) => l.text.includes('small blind')) ? 'big blind' : 'small blind';
        current.lines.push({ key, kind: 'info', text: `${isYou ? 'You post' : `${name(e.id)} posts`} the ${blind} ${formatChips(e.amount)}` });
        break;
      }
      case 'deal':
        if (e.street === 'preflop') break;
        groups.push(current);
        current = { street: e.street, board: [...e.board], lines: [] };
        break;
      case 'act':
        current.lines.push({
          key,
          kind: 'act',
          text: isYou ? `You ${actionTextYou(e.action, e.to)}` : `${name(e.id)} ${actionText(e.action, e.to).toLowerCase()}`,
        });
        break;
      case 'return':
        current.lines.push({ key, kind: 'info', text: `Uncalled ${formatChips(e.amount)} returned to ${isYou ? 'you' : name(e.id)}` });
        break;
      case 'show':
        openResult();
        current.lines.push({ key, kind: 'show', cards: e.hole, text: `${isYou ? 'You show' : `${name(e.id)} shows`} — ${e.value}` });
        break;
      case 'win': {
        openResult();
        const pot = wins > 1 ? (e.pot === 0 ? ' the main pot' : ` side pot ${e.pot}`) : '';
        const names = e.ids.map((id) => (id === you ? 'You' : name(id)));
        const subject = names.length > 1 ? `${names.join(' and ')} split` : `${names[0]} ${names[0] === 'You' ? 'win' : 'wins'}`;
        const how = e.value ? ` with ${withArticle(e.value)}` : shown ? '' : ' (no showdown)';
        current.lines.push({ key, kind: 'win', text: `${subject}${pot} ${formatChips(e.amount)}${how}` });
        break;
      }
      case 'out':
        openResult();
        current.lines.push({ key, kind: 'out', text: `${isYou ? 'You are' : `${name(e.id)} is`} out in ${ordinal(e.place)}` });
        break;
    }
  });
  groups.push(current);
  return { title, groups: groups.filter((g) => g.lines.length > 0 || g.board.length > 0) };
}

