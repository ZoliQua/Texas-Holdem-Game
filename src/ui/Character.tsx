import type { ReactNode } from 'react';
import { useMessages } from '../arcade';
import type { CharacterLook, Species } from '../bots/profiles';
import type { TellCue } from '../bots/tells';
import { MESSAGES, type MessageKey } from '../i18n';
import styles from './Character.module.css';

import type { Pose } from './pose';

export type { Pose } from './pose';

/*
 * One parametric character rig (viewBox 100 × 100): body, arms, head, ears,
 * face and an accessory. Species pick the ear shape, muzzle and markings;
 * poses and tell cues are CSS animations on the named parts.
 */

type EarKind = 'round' | 'bigRound' | 'pointy' | 'long' | 'floppy' | 'tufts' | 'none' | 'pig';
const EARS: Record<Species, EarKind> = {
  tortoise: 'none', mouse: 'bigRound', bear: 'round', pig: 'pig', raccoon: 'round', owl: 'tufts', dog: 'floppy',
  cat: 'pointy', rabbit: 'long', frog: 'none', panda: 'round', penguin: 'none', wolf: 'pointy', fox: 'pointy', robot: 'none',
};

function Ears({ kind, fur, fur2, dark }: { kind: EarKind; fur: string; fur2: string; dark: string }) {
  switch (kind) {
    case 'round':
      return (
        <>
          <circle cx="27" cy="22" r="10" fill={dark} />
          <circle cx="73" cy="22" r="10" fill={dark} />
          <circle cx="27" cy="22" r="5" fill={fur2} opacity=".7" />
          <circle cx="73" cy="22" r="5" fill={fur2} opacity=".7" />
        </>
      );
    case 'bigRound':
      return (
        <>
          <circle cx="24" cy="20" r="15" fill={fur} />
          <circle cx="76" cy="20" r="15" fill={fur} />
          <circle cx="24" cy="20" r="9" fill={fur2} />
          <circle cx="76" cy="20" r="9" fill={fur2} />
        </>
      );
    case 'pointy':
      return (
        <>
          <path d="M22 34 L26 6 L44 24 Z" fill={fur} />
          <path d="M78 34 L74 6 L56 24 Z" fill={fur} />
          <path d="M27 28 L28 14 L37 24 Z" fill={fur2} />
          <path d="M73 28 L72 14 L63 24 Z" fill={fur2} />
        </>
      );
    case 'long':
      return (
        <>
          <ellipse cx="38" cy="10" rx="7" ry="20" fill={fur} transform="rotate(-10 38 10)" />
          <ellipse cx="62" cy="10" rx="7" ry="20" fill={fur} transform="rotate(10 62 10)" />
          <ellipse cx="38" cy="11" rx="3.5" ry="14" fill="#f7b6c2" transform="rotate(-10 38 11)" />
          <ellipse cx="62" cy="11" rx="3.5" ry="14" fill="#f7b6c2" transform="rotate(10 62 11)" />
        </>
      );
    case 'floppy':
      return (
        <>
          <ellipse cx="22" cy="40" rx="9" ry="17" fill={fur2} transform="rotate(18 22 40)" />
          <ellipse cx="78" cy="40" rx="9" ry="17" fill={fur2} transform="rotate(-18 78 40)" />
        </>
      );
    case 'tufts':
      return (
        <>
          <path d="M26 30 L22 8 L40 22 Z" fill={dark} />
          <path d="M74 30 L78 8 L60 22 Z" fill={dark} />
        </>
      );
    case 'pig':
      return (
        <>
          <path d="M24 28 L22 10 L40 20 Z" fill={fur} stroke={dark} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M76 28 L78 10 L60 20 Z" fill={fur} stroke={dark} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      );
    default:
      return null;
  }
}

/** Muzzle, nose and species markings drawn over the head. */
function Face({ species, fur2, dark }: { species: Species; fur2: string; dark: string }) {
  switch (species) {
    case 'panda':
      return (
        <>
          <ellipse cx="38" cy="43" rx="8" ry="10" fill={fur2} transform="rotate(-20 38 43)" />
          <ellipse cx="62" cy="43" rx="8" ry="10" fill={fur2} transform="rotate(20 62 43)" />
          <ellipse cx="50" cy="56" rx="11" ry="8" fill="#ffffff" />
          <ellipse cx="50" cy="53" rx="4" ry="3" fill={fur2} />
        </>
      );
    case 'raccoon':
      return (
        <>
          <path d="M24 44 Q50 32 76 44 Q70 52 58 48 Q50 46 42 48 Q30 52 24 44 Z" fill="#2b2b33" />
          <ellipse cx="50" cy="57" rx="11" ry="8" fill={fur2} />
          <ellipse cx="50" cy="53" rx="4" ry="3" fill="#2b2b33" />
        </>
      );
    case 'pig':
      return (
        <>
          <ellipse cx="50" cy="56" rx="11" ry="8" fill={fur2} stroke={dark} strokeWidth="1.5" />
          <ellipse cx="46" cy="56" rx="2" ry="3" fill={dark} />
          <ellipse cx="54" cy="56" rx="2" ry="3" fill={dark} />
        </>
      );
    case 'owl':
      return (
        <>
          <circle cx="38" cy="43" r="11" fill={fur2} />
          <circle cx="62" cy="43" r="11" fill={fur2} />
          <path d="M45 52 L55 52 L50 62 Z" fill="#f4a261" />
        </>
      );
    case 'penguin':
      return (
        <>
          <path d="M28 44 Q30 26 50 34 Q70 26 72 44 Q72 64 50 68 Q28 64 28 44 Z" fill={fur2} />
          <path d="M43 54 L57 54 L50 61 Z" fill="#f4a261" />
        </>
      );
    case 'frog':
      return <path d="M34 58 Q50 68 66 58" fill="none" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />;
    case 'tortoise':
      return (
        <>
          <ellipse cx="50" cy="56" rx="10" ry="6" fill={fur2} opacity=".55" />
          <circle cx="46" cy="54" r="1.4" fill={dark} />
          <circle cx="54" cy="54" r="1.4" fill={dark} />
        </>
      );
    case 'robot':
      return (
        <>
          <rect x="28" y="34" width="44" height="20" rx="8" fill={fur2} />
          <rect x="40" y="58" width="20" height="6" rx="3" fill={fur2} opacity=".8" />
          <circle cx="30" cy="46" r="2" fill="#ffffff" opacity=".5" />
        </>
      );
    case 'fox':
    case 'wolf':
    case 'cat':
      return (
        <>
          <path d="M30 50 Q50 76 70 50 Q62 60 50 60 Q38 60 30 50 Z" fill={fur2} />
          <path d="M46 53 L54 53 L50 58 Z" fill={dark} />
          {species === 'cat' && (
            <g stroke={dark} strokeWidth="1" opacity=".6">
              <path d="M30 56 L18 54" />
              <path d="M30 59 L18 61" />
              <path d="M70 56 L82 54" />
              <path d="M70 59 L82 61" />
            </g>
          )}
        </>
      );
    default:
      // bear, mouse, dog, rabbit: a round muzzle and nose
      return (
        <>
          <ellipse cx="50" cy="57" rx="12" ry="9" fill={species === 'dog' ? '#f3e6d0' : fur2} />
          <ellipse cx="50" cy="53" rx={species === 'mouse' ? 3 : 4.5} ry="3.2" fill={species === 'mouse' ? '#ff8fab' : dark} />
        </>
      );
  }
}

function Accessory({ look, dark }: { look: CharacterLook; dark: string }): ReactNode {
  const a = look.accent;
  switch (look.accessory) {
    case 'beanie':
      return (
        <g>
          <path d="M24 30 Q50 0 76 30 Z" fill={a} />
          <rect x="22" y="27" width="56" height="8" rx="4" fill={a} stroke={dark} strokeWidth="1" />
          <circle cx="50" cy="8" r="5" fill="#ffffff" />
        </g>
      );
    case 'bow':
      return (
        <g transform="translate(70 18) rotate(20)">
          <path d="M0 0 L-12 -7 L-12 7 Z M0 0 L12 -7 L12 7 Z" fill={a} />
          <circle r="3" fill={a} stroke={dark} strokeWidth="1" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M26 28 Q50 4 74 28 Z" fill={a} />
          <path d="M50 26 L86 30 Q84 34 74 32 L50 30 Z" fill={a} stroke={dark} strokeWidth="1" />
        </g>
      );
    case 'scarf':
      return (
        <g>
          <rect x="30" y="68" width="40" height="9" rx="4" fill={a} />
          <rect x="58" y="72" width="8" height="16" rx="3" fill={a} />
        </g>
      );
    case 'partyHat':
      return (
        <g>
          <path d="M40 22 L52 -2 L62 22 Z" fill={a} stroke={dark} strokeWidth="1" />
          <circle cx="52" cy="-2" r="4" fill="#ff5c8a" />
          <path d="M44 16 L58 14" stroke="#ffffff" strokeWidth="2" />
        </g>
      );
    case 'glasses':
      return (
        <g fill="none" stroke={a} strokeWidth="2.5">
          <circle cx="38" cy="43" r="8" />
          <circle cx="62" cy="43" r="8" />
          <path d="M46 43 L54 43" />
        </g>
      );
    case 'bandana':
      return <path d="M26 66 L74 66 L50 82 Z" fill={a} stroke={dark} strokeWidth="1" />;
    case 'bowtie':
      return (
        <g transform="translate(50 72)">
          <path d="M0 0 L-11 -6 L-11 6 Z M0 0 L11 -6 L11 6 Z" fill={a} />
          <circle r="2.5" fill={a} />
        </g>
      );
    case 'goggles':
      return (
        <g>
          <rect x="24" y="22" width="52" height="5" rx="2" fill={dark} />
          <circle cx="40" cy="24" r="7" fill={a} stroke={dark} strokeWidth="2" />
          <circle cx="60" cy="24" r="7" fill={a} stroke={dark} strokeWidth="2" />
        </g>
      );
    case 'sunglasses':
      return (
        <g>
          <path d="M28 38 L48 38 L46 48 Q38 52 31 47 Z" fill={a} />
          <path d="M52 38 L72 38 L69 47 Q62 52 54 48 Z" fill={a} />
          <path d="M48 40 L52 40" stroke={a} strokeWidth="2" />
        </g>
      );
    case 'monocle':
      return (
        <g fill="none" stroke={a} strokeWidth="2">
          <circle cx="62" cy="43" r="9" />
          <path d="M70 48 Q74 60 70 70" />
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path d="M22 44 Q22 10 50 10 Q78 10 78 44" fill="none" stroke={dark} strokeWidth="4" />
          <rect x="16" y="38" width="10" height="16" rx="4" fill={a} />
          <rect x="74" y="38" width="10" height="16" rx="4" fill={a} />
        </g>
      );
    case 'earring':
      return <circle cx="77" cy="36" r="3" fill="none" stroke={a} strokeWidth="2" />;
    case 'flower':
      return (
        <g transform="translate(30 22)" fill={a}>
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-5" rx="3.5" ry="5" transform={`rotate(${r})`} />
          ))}
          <circle r="3" fill="#ffd23f" />
        </g>
      );
    case 'antenna':
      return (
        <g>
          <path d="M50 18 L50 4" stroke={dark} strokeWidth="2.5" />
          <circle cx="50" cy="3" r="4" fill={a} />
        </g>
      );
  }
}

export type CharacterProps = {
  look: CharacterLook;
  pose: Pose;
  cue: TellCue | null;
  /** Width in px (or `style` for a CSS length). */
  size: number;
  className?: string;
  style?: React.CSSProperties;
};

const SPECIES_KEY: Record<Species, MessageKey> = {
  tortoise: 'spTortoise', mouse: 'spMouse', bear: 'spBear', pig: 'spPig', raccoon: 'spRaccoon', owl: 'spOwl', dog: 'spDog',
  cat: 'spCat', rabbit: 'spRabbit', frog: 'spFrog', panda: 'spPanda', penguin: 'spPenguin', wolf: 'spWolf', fox: 'spFox', robot: 'spRobot',
};
const POSE_KEY: Record<Pose, MessageKey> = {
  idle: 'poseIdle', thinking: 'poseThinking', fold: 'poseFold', bet: 'poseBet', allIn: 'poseAllIn', win: 'poseWin', busted: 'poseBusted',
};

export function Character({ look, pose, cue, size, className, style }: CharacterProps) {
  const t = useMessages(MESSAGES);
  const dark = '#22232b';
  const shellSpecies = look.species === 'tortoise';
  const cls = [styles.char, styles[`pose-${pose}`], cue ? styles[`tell-${cue.kind}`] : '', className ?? ''].filter(Boolean).join(' ');
  const cueStyle = cue
    ? ({ '--cue-delay': `${cue.atMs}ms`, '--cue-dur': `${Math.max(cue.durationMs, 400)}ms` } as React.CSSProperties)
    : undefined;
  return (
    <svg
      className={cls}
      style={{ ...(size > 0 ? { width: size } : null), ...cueStyle, ...style }}
      viewBox="-6 -10 112 114"
      role="img"
      aria-label={t('charLabel', { species: t(SPECIES_KEY[look.species]), pose: t(POSE_KEY[pose]) })}
      data-pose={pose}
      data-tell={cue?.kind ?? undefined}
    >
      <g className={styles.lean}>
        {/* body */}
        <g className={styles.body}>
          {shellSpecies && <ellipse cx="50" cy="92" rx="38" ry="16" fill={look.fur2} stroke={dark} strokeWidth="1.5" />}
          <path d="M18 104 Q18 70 50 70 Q82 70 82 104 Z" fill={look.fur} />
          <path d="M34 104 Q34 80 50 80 Q66 80 66 104 Z" fill={look.species === 'panda' || look.species === 'penguin' ? '#f5f5f5' : look.fur2} opacity=".9" />
        </g>
        {/* arms */}
        <g className={styles.armL}>
          <rect x="12" y="74" width="12" height="26" rx="6" fill={look.species === 'panda' ? look.fur2 : look.fur} stroke={dark} strokeOpacity=".25" />
        </g>
        <g className={styles.armR}>
          <rect x="76" y="74" width="12" height="26" rx="6" fill={look.species === 'panda' ? look.fur2 : look.fur} stroke={dark} strokeOpacity=".25" />
        </g>
        {/* a little chip stack for chipShuffle */}
        <g className={styles.chips}>
          <ellipse cx="88" cy="98" rx="7" ry="2.5" fill="#ef4c55" stroke="#fff" strokeDasharray="2 2" />
          <ellipse cx="88" cy="95" rx="7" ry="2.5" fill="#6b8cff" stroke="#fff" strokeDasharray="2 2" />
          <ellipse cx="88" cy="92" rx="7" ry="2.5" fill="#42d392" stroke="#fff" strokeDasharray="2 2" />
        </g>
        {/* head */}
        <g className={styles.head}>
          <g className={styles.ears}>
            <Ears kind={EARS[look.species]} fur={look.fur} fur2={look.fur2} dark={look.species === 'panda' ? look.fur2 : dark} />
          </g>
          {look.species === 'robot' ? (
            <rect x="22" y="18" width="56" height="52" rx="14" fill={look.fur} stroke={dark} strokeWidth="1.5" />
          ) : look.species === 'frog' ? (
            <>
              <ellipse cx="50" cy="48" rx="30" ry="24" fill={look.fur} />
              <circle cx="36" cy="26" r="11" fill={look.fur} />
              <circle cx="64" cy="26" r="11" fill={look.fur} />
            </>
          ) : (
            <circle cx="50" cy="44" r="28" fill={look.fur} />
          )}
          <Face species={look.species} fur2={look.fur2} dark={dark} />
          {/* eyes */}
          <g className={styles.eyes}>
            {(() => {
              const y = look.species === 'frog' ? 26 : look.species === 'robot' ? 44 : 43;
              const white = look.species === 'robot' ? '#e8fbff' : '#ffffff';
              return (
                <>
                  <ellipse className={styles.eyeWhite} cx="38" cy={y} rx="6" ry="6.5" fill={white} />
                  <ellipse className={styles.eyeWhite} cx="62" cy={y} rx="6" ry="6.5" fill={white} />
                  <g className={styles.pupils}>
                    <circle cx="38.5" cy={y + 0.5} r="3.2" fill={dark} />
                    <circle cx="62.5" cy={y + 0.5} r="3.2" fill={dark} />
                    <circle cx="39.6" cy={y - 0.8} r="1" fill="#fff" />
                    <circle cx="63.6" cy={y - 0.8} r="1" fill="#fff" />
                  </g>
                  <g className={styles.lids}>
                    <rect x="31" y={y - 7} width="14" height="14" fill={look.species === 'panda' ? look.fur2 : look.fur} />
                    <rect x="55" y={y - 7} width="14" height="14" fill={look.species === 'panda' ? look.fur2 : look.fur} />
                  </g>
                </>
              );
            })()}
          </g>
          {/* mouth: smiles when winning, flat otherwise */}
          <path
            className={styles.mouth}
            d={pose === 'win' ? 'M42 63 Q50 70 58 63' : pose === 'busted' || pose === 'fold' ? 'M43 66 Q50 62 57 66' : 'M44 64 Q50 66 56 64'}
            fill="none"
            stroke={dark}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Accessory look={look} dark={dark} />
        </g>
      </g>
    </svg>
  );
}

export default Character;
