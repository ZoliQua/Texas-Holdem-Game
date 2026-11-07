import type { Difficulty } from '../bots/profiles';
import type { Format } from '../engine/schedule';
import type { MessageKey } from '../i18n';

/** Dictionary keys of the setup choices, shared by the setup screen, the character card and the tournament note. */
export const FORMAT_LABEL: Record<Format, MessageKey> = { headsUp: 'formatHeadsUp', sixMax: 'formatSixMax' };
export const POOL_KEY: Record<Difficulty, MessageKey> = { easy: 'poolEasy', medium: 'poolMedium', hard: 'poolHard' };
/** Lower-case difficulty as it reads inside a sentence. */
export const POOL_NOTE_KEY: Record<Difficulty, MessageKey> = { easy: 'noteEasy', medium: 'noteMedium', hard: 'noteHard' };
