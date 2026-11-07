import type { Lang } from '../arcade';
import type { LogEvent, Street } from '../engine/types';
import { translator, type MessageKey } from '../i18n';
import { actionLogLine, formatChips, handValuePhrase, handValueText, ordinal } from './format';

export const STREET_KEY: Record<Street, MessageKey> = {
  preflop: 'streetPreflop', flop: 'streetFlop', turn: 'streetTurn', river: 'streetRiver', showdown: 'streetShowdown', done: 'streetDone',
};

export type Line = { key: string; text: string; cards?: number[]; kind: 'act' | 'show' | 'win' | 'out' | 'info' };
export type Group = { street: Street; board: number[]; lines: Line[] };

/**
 * Turns one hand's events into street groups of readable lines in `lang`.
 * The events are the stored, language-free record (hand values are the evaluator's
 * English text and are re-worded here), so saved hands render in any language.
 */
export function handLines(
  events: readonly LogEvent[],
  name: (id: string) => string,
  you: string,
  lang: Lang = 'en',
): { title: string; groups: Group[] } {
  const tr = translator(lang);
  let title = '';
  const groups: Group[] = [];
  let current: Group = { street: 'preflop', board: [], lines: [] };
  const wins = events.filter((e) => e.t === 'win').length;
  const shown = events.some((e) => e.t === 'show');
  let blinds = 0;
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
        title = tr('logHand', { hand: e.hand, sb: formatChips(e.sb, lang), bb: formatChips(e.bb, lang) });
        current.lines.push({ key, kind: 'info', text: e.button === you ? tr('logButtonYou') : tr('logButton', { name: name(e.button) }) });
        break;
      case 'blind': {
        // The first blind of a hand is the small blind, any later one the big blind.
        const small = blinds === 0;
        blinds += 1;
        const k: MessageKey = small ? (isYou ? 'logSmallYou' : 'logSmall') : isYou ? 'logBigYou' : 'logBig';
        current.lines.push({ key, kind: 'info', text: tr(k, { name: name(e.id), n: formatChips(e.amount, lang) }) });
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
          text: actionLogLine(e.action, e.to, isYou ? { you: true } : { you: false, name: name(e.id) }, lang),
        });
        break;
      case 'return': {
        const n = formatChips(e.amount, lang);
        current.lines.push({ key, kind: 'info', text: isYou ? tr('logReturnYou', { n }) : tr('logReturn', { n, name: name(e.id) }) });
        break;
      }
      case 'show': {
        openResult();
        const hand = handValueText(e.value, lang);
        current.lines.push({ key, kind: 'show', cards: e.hole, text: isYou ? tr('logShowYou', { hand }) : tr('logShow', { name: name(e.id), hand }) });
        break;
      }
      case 'win': {
        openResult();
        const pot = wins > 1 ? (e.pot === 0 ? tr('logMainPot') : tr('logSidePot', { k: e.pot })) : '';
        const how = e.value ? tr('logWith', { hand: handValuePhrase(e.value, lang) }) : shown ? '' : tr('logNoShowdown');
        const vars = { pot, how, n: formatChips(e.amount, lang) };
        let text: string;
        if (e.ids.length > 1) {
          const names = e.ids.map((id) => (id === you ? tr('you') : name(id))).join(tr('logAnd'));
          text = tr('logSplit', { ...vars, names });
        } else if (e.ids[0] === you) text = tr('logWinYou', vars);
        else text = tr('logWin', { ...vars, name: name(e.ids[0]) });
        current.lines.push({ key, kind: 'win', text });
        break;
      }
      case 'out': {
        openResult();
        const ord = ordinal(e.place, lang);
        current.lines.push({ key, kind: 'out', text: isYou ? tr('logOutYou', { ord }) : tr('logOut', { name: name(e.id), ord }) });
        break;
      }
    }
  });
  groups.push(current);
  return { title, groups: groups.filter((g) => g.lines.length > 0 || g.board.length > 0) };
}
