import { randInt, shuffle, type Rng } from '../engine/rng';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Style = 'rock' | 'station' | 'tag' | 'lag' | 'maniac';
export type TellKind = 'earTwitch' | 'snapCall' | 'longStare' | 'leanBack' | 'chipShuffle' | 'glance';

export type Species =
  | 'tortoise' | 'mouse' | 'bear' | 'pig' | 'raccoon' | 'owl' | 'dog' | 'cat'
  | 'rabbit' | 'frog' | 'panda' | 'penguin' | 'wolf' | 'fox' | 'robot';
export type Accessory =
  | 'beanie' | 'bow' | 'cap' | 'scarf' | 'partyHat' | 'glasses' | 'bandana' | 'bowtie'
  | 'goggles' | 'sunglasses' | 'monocle' | 'headphones' | 'earring' | 'flower' | 'antenna';

/** Parameters of the shared SVG character rig. */
export type CharacterLook = {
  species: Species;
  /** Main fur / skin colour. */
  fur: string;
  /** Muzzle, belly or markings. */
  fur2: string;
  /** Accessory colour. */
  accent: string;
  accessory: Accessory;
};

export type BotProfile = {
  id: string;
  name: string;
  pool: Difficulty;
  style: Style;
  /** 0..1 — how few hands it plays. */
  tightness: number;
  /** 0..1 — betting and raising versus calling. */
  aggression: number;
  /** 0..1 — bluff frequency. */
  bluff: number;
  /** 0..1 — bet size habit (small … big). */
  sizing: number;
  /** 0..1 — quality of reads (ranges, position, pot odds). */
  skill: number;
  /** Monte Carlo samples per postflop equity estimate. */
  samples: number;
  /** Probability of a mistake on a decision (calling too wide, missing value). */
  mistake: number;
  tells: TellKind[];
  /** Share of shown cues that match the hand. */
  tellHonesty: number;
  /** Share of shown cues that deliberately point the other way. */
  reverseTells: number;
  look: CharacterLook;
  /** Flavour line for the character card (never reveals tells). */
  bio: string;
};

export const STYLE_PARAMS: Record<Style, Pick<BotProfile, 'tightness' | 'aggression' | 'bluff' | 'sizing'>> = {
  rock: { tightness: 0.86, aggression: 0.42, bluff: 0.03, sizing: 0.45 },
  station: { tightness: 0.45, aggression: 0.12, bluff: 0.02, sizing: 0.35 },
  tag: { tightness: 0.68, aggression: 0.72, bluff: 0.12, sizing: 0.6 },
  lag: { tightness: 0.36, aggression: 0.8, bluff: 0.22, sizing: 0.65 },
  maniac: { tightness: 0.12, aggression: 0.94, bluff: 0.42, sizing: 0.85 },
};

export const POOL_PARAMS: Record<Difficulty, Pick<BotProfile, 'skill' | 'samples' | 'mistake' | 'tellHonesty' | 'reverseTells'>> = {
  easy: { skill: 0, samples: 150, mistake: 0.35, tellHonesty: 0.8, reverseTells: 0 },
  medium: { skill: 0.45, samples: 600, mistake: 0.15, tellHonesty: 0.6, reverseTells: 0 },
  hard: { skill: 1, samples: 2000, mistake: 0.02, tellHonesty: 0.35, reverseTells: 0.3 },
};

type Entry = [id: string, name: string, pool: Difficulty, style: Style, tells: TellKind[], look: CharacterLook, bio: string];

const ENTRIES: Entry[] = [
  ['pebble', 'Pebble', 'easy', 'rock', ['glance', 'leanBack'],
    { species: 'tortoise', fur: '#7fae5a', fur2: '#c8a165', accent: '#e9c46a', accessory: 'beanie' },
    'Has waited ninety years for pocket aces and is happy to wait ninety more.'],
  ['muffin', 'Muffin', 'easy', 'station', ['earTwitch', 'snapCall'],
    { species: 'mouse', fur: '#c9b8a8', fur2: '#f6d8d8', accent: '#ff8fab', accessory: 'bow' },
    'Came for the snacks, stayed for the flops. Every single flop.'],
  ['bruno', 'Bruno', 'easy', 'tag', ['earTwitch', 'chipShuffle'],
    { species: 'bear', fur: '#9c6b3f', fur2: '#dcb68c', accent: '#e63946', accessory: 'cap' },
    'Read half a poker book in a cave one winter. The good half, he says.'],
  ['truffle', 'Truffle', 'easy', 'lag', ['glance', 'longStare'],
    { species: 'pig', fur: '#f4a6b7', fur2: '#fcd5de', accent: '#2a9d8f', accessory: 'scarf' },
    'Sniffs out weakness. Sometimes it is just the smell of the buffet.'],
  ['ziggy', 'Ziggy', 'easy', 'maniac', ['earTwitch', 'longStare'],
    { species: 'raccoon', fur: '#8d8d99', fur2: '#ececf0', accent: '#ffd23f', accessory: 'partyHat' },
    'Treats every pot like the last cookie in the jar.'],

  ['basil', 'Basil', 'medium', 'rock', ['earTwitch', 'leanBack'],
    { species: 'owl', fur: '#8b6f47', fur2: '#ead7b0', accent: '#457b9d', accessory: 'glasses' },
    'Keeps a notebook of every hand. Has never once needed to look at it.'],
  ['dottie', 'Dottie', 'medium', 'station', ['glance', 'snapCall'],
    { species: 'dog', fur: '#ead6b4', fur2: '#6b4f3a', accent: '#e76f51', accessory: 'bandana' },
    'Will fetch any bet you throw. Wags happily the whole time.'],
  ['juniper', 'Juniper', 'medium', 'tag', ['glance', 'chipShuffle'],
    { species: 'cat', fur: '#f2a65a', fur2: '#fff1e0', accent: '#6a4c93', accessory: 'bowtie' },
    'Patient, precise and slightly judgemental about your bet sizing.'],
  ['rocket', 'Rocket', 'medium', 'lag', ['earTwitch', 'snapCall'],
    { species: 'rabbit', fur: '#dcdce6', fur2: '#ffffff', accent: '#ef476f', accessory: 'goggles' },
    'Fast hands, fast decisions, occasionally fast exits.'],
  ['wasabi', 'Wasabi', 'medium', 'maniac', ['glance', 'longStare'],
    { species: 'frog', fur: '#7cc26b', fur2: '#d8f0c8', accent: '#222222', accessory: 'sunglasses' },
    'Hops into every pot. Wears sunglasses indoors, at night.'],

  ['granite', 'Granite', 'hard', 'rock', ['earTwitch', 'chipShuffle'],
    { species: 'panda', fur: '#f5f5f5', fur2: '#26262b', accent: '#c9a46a', accessory: 'monocle' },
    'Calm as a mountain. When the mountain moves, step aside.'],
  ['waddles', 'Waddles', 'hard', 'station', ['glance', 'leanBack'],
    { species: 'penguin', fur: '#2b2d42', fur2: '#f5f5f5', accent: '#f4a261', accessory: 'headphones' },
    'Looks sleepy, calls everything, and somehow ends up with the chips.'],
  ['sable', 'Sable', 'hard', 'tag', ['earTwitch', 'longStare'],
    { species: 'wolf', fur: '#6c7a89', fur2: '#cfd6de', accent: '#e63946', accessory: 'earring' },
    'Hunts the weakest stack at the table, quietly and on purpose.'],
  ['vixen', 'Vixen', 'hard', 'lag', ['glance', 'snapCall'],
    { species: 'fox', fur: '#e76f51', fur2: '#fff4ec', accent: '#2a9d8f', accessory: 'flower' },
    'Charming smile, relentless raises. Never quite where you expect.'],
  ['pixel', 'Pixel', 'hard', 'maniac', ['earTwitch', 'longStare'],
    { species: 'robot', fur: '#8ecae6', fur2: '#219ebc', accent: '#ffb703', accessory: 'antenna' },
    'Ran a billion simulations. Concluded that raising is fun.'],
];

export const ROSTER: readonly BotProfile[] = ENTRIES.map(([id, name, pool, style, tells, look, bio]) => ({
  id,
  name,
  pool,
  style,
  ...STYLE_PARAMS[style],
  ...POOL_PARAMS[pool],
  tells,
  look,
  bio,
}));

export const profileById = (id: string) => ROSTER.find((p) => p.id === id) ?? null;

/**
 * Draws the opponents for a table. Easy and Hard draw only from their own pool;
 * a Medium table draws four Medium bots and one random Easy or Hard bot;
 * heads-up draws one bot from the chosen pool. The order is shuffled.
 */
export function seatBots(o: { difficulty: Difficulty; count: 1 | 5; rng: Rng }): BotProfile[] {
  const pool = (d: Difficulty) => ROSTER.filter((p) => p.pool === d);
  const own = shuffle(o.rng, pool(o.difficulty));
  if (o.count === 1) return [own[0]];
  if (o.difficulty !== 'medium') return own.slice(0, 5);
  const guests = [...pool('easy'), ...pool('hard')];
  return shuffle(o.rng, [...own.slice(0, 4), guests[randInt(o.rng, guests.length)]]);
}
