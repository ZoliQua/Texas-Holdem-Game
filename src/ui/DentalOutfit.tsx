import type { CharacterLook } from '../bots/profiles';
import { GARMENT, type DentalRole } from './dentalOutfits';
import type { Pose } from './pose';

/*
 * Dental-mode clothes for the character rig (viewBox 100 × 100, same parts as
 * Character). Nothing here covers the ears, eyes or pupils and nothing moves on
 * its own: the tells (ear twitch, glance, long stare, lean back, chip shuffle,
 * snap call) and the poses still animate the same named groups.
 */

const INK = '#22232b';
const STEEL = '#8a96a0';
/** A small incisor in a 100 × 100 box (scaled down for emblems). */
const TOOTH =
  'M30 14c-9 0-16 7-16 17 0 7 2 12 4 18 2 5 4 13 5 22 1 8 4 13 8 13 4 0 6-3 7-10 1-7 2-11 5-11 3 0 4 4 5 11 1 7 3 10 7 10 4 0 7-5 8-13 1-9 3-17 5-22 2-6 4-11 4-18 0-10-7-17-16-17-5 0-9 2-12 5-3-3-7-5-12-5z';

function ToothEmblem({ x, y, size, fill = '#ffffff', stroke = '#5fb3a5' }: { x: number; y: number; size: number; fill?: string; stroke?: string }) {
  return <path d={TOOTH} transform={`translate(${x} ${y}) scale(${size / 100})`} fill={fill} stroke={stroke} strokeWidth={100 / size} />;
}

function Bib({ color }: { color: string }) {
  return (
    <g>
      <path d="M32 73 L68 73 L66 97 Q50 101 34 97 Z" fill={color} stroke="rgba(0,0,0,.18)" />
      <path d="M33 73 Q50 66 67 73" fill="none" stroke={STEEL} strokeWidth="1.4" strokeDasharray="1.6 1.6" />
      <circle cx="33" cy="73.5" r="2" fill={STEEL} />
      <circle cx="67" cy="73.5" r="2" fill={STEEL} />
    </g>
  );
}

function Lapels({ stroke }: { stroke: string }) {
  return (
    <g fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M42 71 L50 86 L47 104" />
      <path d="M58 71 L50 86" />
    </g>
  );
}

/** Garment, bib or apron over the body. Drawn inside the body group, after the fur. */
export function OutfitBody({ role, look }: { role: DentalRole; look: CharacterLook }) {
  const garment = GARMENT[role];
  const vneck = <path d="M42 70.4 L50 82 L58 70.4 Z" fill={look.species === 'panda' ? look.fur : look.fur2} />;
  return (
    <g data-part="outfit-body">
      {role === 'toothFairy' && (
        <g fill="#f3e8ff" stroke="#c4a5e8" strokeWidth="1" opacity=".9">
          <ellipse cx="25" cy="80" rx="9" ry="14" transform="rotate(-28 25 80)" />
          <ellipse cx="75" cy="80" rx="9" ry="14" transform="rotate(28 75 80)" />
        </g>
      )}
      {garment && <path d="M18 104 Q18 70 50 70 Q82 70 82 104 Z" fill={garment} stroke="rgba(0,0,0,.12)" />}
      {garment && role !== 'bracesPatient' && vneck}
      {(role === 'dentist' || role === 'professor' || role === 'orthodontist') && (
        <>
          <Lapels stroke={role === 'orthodontist' ? '#93b4dc' : '#c3ced5'} />
          <rect x="60" y="88" width="10" height="8" rx="1.5" fill="none" stroke={role === 'orthodontist' ? '#93b4dc' : '#c3ced5'} strokeWidth="1.4" />
          <path d="M63 86 L63 91" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {role === 'professor' && (
        <g transform="translate(50 73)">
          <path d="M0 0 L-8 -4.5 L-8 4.5 Z M0 0 L8 -4.5 L8 4.5 Z" fill="#8b1e2d" />
          <circle r="2" fill="#8b1e2d" />
        </g>
      )}
      {(role === 'hygienist' || role === 'assistant' || role === 'surgeon') && (
        <rect x="58" y="86" width="11" height="9" rx="2" fill="rgba(0,0,0,.14)" />
      )}
      {role === 'hygienist' && <path d="M61 87 L61 79 M59.5 79 L62.5 79" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />}
      {role === 'bracesPatient' && <ToothEmblem x={42} y={80} size={16} stroke="#c99a1e" />}
      {role === 'nurse' && (
        <>
          <path d="M40 70.6 L50 78 L44 82 Z M60 70.6 L50 78 L56 82 Z" fill="#7fd1c0" />
          <ToothEmblem x={58} y={86} size={9} />
        </>
      )}
      {role === 'patient' && <Bib color="#a8dadc" />}
      {role === 'whitening' && <Bib color="#b7e4c7" />}
      {role === 'labTech' && (
        <g>
          <path d="M42 70.5 L38 76 M58 70.5 L62 76" stroke="#2b3f5c" strokeWidth="2" />
          <path d="M35 76 L65 76 L68 104 L32 104 Z" fill="#3d5a80" />
          <rect x="44" y="86" width="12" height="9" rx="2" fill="#2b3f5c" />
          <path d="M45.5 88.5 L47 85 L50 87.5 L53 85 L54.5 88.5 Z" fill="#f4c84a" />
        </g>
      )}
      {role === 'radiographer' && (
        <g>
          <path d="M27 76 Q50 71 73 76 L75 104 L25 104 Z" fill="#5c636e" stroke="#3b4048" strokeWidth="1.5" />
          <rect x="38" y="66.5" width="24" height="7" rx="3.5" fill="#7a828c" stroke="#3b4048" />
          <rect x="62" y="82" width="6" height="8" rx="1" fill="#ffd23f" stroke="#3b4048" strokeWidth=".8" />
          <circle cx="65" cy="86" r="1.4" fill="#3b4048" />
        </g>
      )}
      {role === 'curingBot' && (
        <g>
          <rect x="38" y="80" width="24" height="16" rx="3" fill="#0b2533" stroke="#219ebc" />
          <ToothEmblem x={45} y={82} size={11} fill="#e8fbff" stroke="#60a5fa" />
          <circle cx="58.5" cy="83.5" r="1.3" fill="#60a5fa" />
        </g>
      )}
    </g>
  );
}

/** Sleeve over an arm; the right hand may hold a tool. Drawn inside the arm group, so it moves with the arm. */
export function OutfitArm({ role, side }: { role: DentalRole; side: 'L' | 'R' }) {
  const garment = GARMENT[role];
  const x = side === 'L' ? 12 : 76;
  return (
    <g data-part={`outfit-arm${side}`}>
      {garment && <rect x={x} y="74" width="12" height="15" rx="6" fill={garment} stroke="rgba(0,0,0,.12)" />}
      {side === 'R' && role === 'toothFairy' && (
        <g>
          <path d="M84 96 L95 76" stroke="#f4c84a" strokeWidth="2" strokeLinecap="round" />
          <path d="M95 68 L97 73.5 L102.5 74 L98 77.5 L99.5 83 L95 80 L90.5 83 L92 77.5 L87.5 74 L93 73.5 Z" fill="#ffe58a" stroke="#d4a72c" strokeWidth=".8" />
        </g>
      )}
      {side === 'R' && role === 'assistant' && (
        <g>
          <path d="M84 96 L93 80" stroke={STEEL} strokeWidth="2" strokeLinecap="round" />
          <circle cx="94.5" cy="77.5" r="3.5" fill="#dfe7ec" stroke={STEEL} strokeWidth="1.2" />
        </g>
      )}
    </g>
  );
}

/** y on a symmetric quadratic mouth curve M x0 y0 Q 50 yc x1 y0 at a given x. */
function curveY(x: number, x0: number, x1: number, y0: number, yc: number): number {
  const t = (x - x0) / (x1 - x0);
  return (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * yc + t * t * y0;
}

/** Braces that follow the pose's mouth line (the mouth itself still shows the pose). */
function Braces({ pose }: { pose: Pose }) {
  const [x0, x1, y0, yc] = pose === 'win' ? [42, 58, 63, 70] : pose === 'busted' || pose === 'fold' ? [43, 57, 66, 62] : [44, 56, 64, 66];
  const xs = [45.5, 48.5, 51.5, 54.5];
  const at = xs.map((x) => [x, curveY(x, x0, x1, y0, yc)] as const);
  return (
    <g data-part="braces">
      <path d={`M${x0 + 1} ${y0} Q50 ${yc} ${x1 - 1} ${y0}`} fill="none" stroke="#b8c2cc" strokeWidth="1" />
      {at.map(([x, y]) => (
        <rect key={x} x={x - 1.2} y={y - 1.2} width="2.4" height="2.4" rx=".5" fill="#d9e1e7" stroke="#6b7280" strokeWidth=".5" />
      ))}
    </g>
  );
}

/** Headwear and face items; replaces the everyday accessory. Drawn inside the head group. */
export function OutfitHead({ role, pose }: { role: DentalRole; pose: Pose }) {
  switch (role) {
    case 'dentist':
      return (
        <g data-part="head-mirror">
          <path d="M24 36 Q50 13 76 36" fill="none" stroke="#4b5563" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="22" r="8" fill="#dfe7ec" stroke={STEEL} strokeWidth="1.6" />
          <circle cx="50" cy="22" r="2" fill="#4b5563" />
          <path d="M45 19 Q47 16 50 16" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'hygienist':
    case 'surgeon': {
      const cap = role === 'hygienist' ? '#3fb8a4' : '#5aa874';
      return (
        <g data-part="scrub-cap">
          <path d="M28 30 Q28 13 50 13 Q72 13 72 30 Q50 25 28 30 Z" fill={cap} stroke="rgba(0,0,0,.2)" />
          <path d="M71 28 L78 33 M71 28 L76 36" stroke={cap} strokeWidth="2" strokeLinecap="round" />
          {role === 'hygienist' ? (
            <g fill="#ffffff" opacity=".8">
              <circle cx="40" cy="20" r="1.5" />
              <circle cx="50" cy="17" r="1.5" />
              <circle cx="60" cy="20" r="1.5" />
            </g>
          ) : (
            <g>
              <path d="M36 67 L64 67 L62 75 Q50 78 38 75 Z" fill="#9fd3ff" stroke="#6fa8d6" strokeWidth=".8" />
              <path d="M36 68 L27 54 M64 68 L73 54" stroke="#9fd3ff" strokeWidth="1.2" />
            </g>
          )}
        </g>
      );
    }
    case 'assistant':
      return (
        <g data-part="face-shield">
          <path d="M25 31 L75 31" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28 30 L72 30 L68 18 L32 18 Z" fill="rgba(200,230,255,.5)" stroke="#9fb7c9" strokeWidth="1.2" />
        </g>
      );
    case 'orthodontist':
      return (
        <g data-part="loupes">
          <g fill="none" stroke="#334155" strokeWidth="1.6">
            <circle cx="38" cy="43" r="8" />
            <circle cx="62" cy="43" r="8" />
            <path d="M46 43 L54 43" />
          </g>
          <rect x="33" y="26" width="9" height="7" rx="2" fill="#475569" />
          <rect x="58" y="26" width="9" height="7" rx="2" fill="#475569" />
          <path d="M37.5 33 L38 35 M62.5 33 L62 35" stroke="#334155" strokeWidth="1.4" />
        </g>
      );
    case 'toothFairy':
      return (
        <g data-part="tiara">
          <path d="M38 19 L41 10 L45 15 L50 7 L55 15 L59 10 L62 19 Z" fill="#f4c84a" stroke="#a8871f" strokeWidth="1" strokeLinejoin="round" />
          <ToothEmblem x={46.5} y={11} size={7} stroke="#a8871f" />
        </g>
      );
    case 'bracesPatient':
      return <Braces pose={pose} />;
    case 'labTech':
      return (
        <g data-part="lab-goggles">
          <rect x="24" y="22" width="52" height="5" rx="2" fill={INK} />
          <circle cx="40" cy="24" r="7" fill="rgba(160,220,255,.65)" stroke={INK} strokeWidth="2" />
          <circle cx="60" cy="24" r="7" fill="rgba(160,220,255,.65)" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'whitening':
      return (
        <g data-part="uv-glasses">
          <path d="M26 39 L74 39 L72 47 Q62 50 52 46 L48 46 Q38 50 28 47 Z" fill="rgba(255,140,40,.55)" stroke="#e8590c" strokeWidth="1.4" />
        </g>
      );
    case 'professor':
      return (
        <g data-part="mortarboard">
          <rect x="41" y="13" width="18" height="8" rx="1.5" fill={INK} />
          <path d="M33 14 L50 7 L67 14 L50 21 Z" fill={INK} stroke="#3a3b45" strokeWidth=".8" />
          <path d="M50 14 L64 16 L64 25" fill="none" stroke="#e9c46a" strokeWidth="1.4" />
          <circle cx="64" cy="26" r="1.8" fill="#e9c46a" />
        </g>
      );
    case 'toothache':
      return (
        <g data-part="bandage">
          <ellipse cx="71" cy="56" rx="7" ry="6" fill="#ff9aa2" opacity=".6" />
          <path d="M25 46 Q23 70 50 74 Q77 70 75 46 Q75 20 50 15 Q25 20 25 46 Z" fill="none" stroke="#f8f9fa" strokeWidth="5" />
          <path d="M50 14 L40 5 L41 16 Z M50 14 L60 5 L59 16 Z" fill="#f8f9fa" stroke="#cbd5e1" strokeWidth=".8" strokeLinejoin="round" />
        </g>
      );
    case 'nurse':
      return (
        <g data-part="nurse-cap">
          <path d="M38 22 L40 12 L60 12 L62 22 Q50 19 38 22 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <ToothEmblem x={46.5} y={12.5} size={7} />
        </g>
      );
    case 'curingBot':
      return (
        <g data-part="curing-light">
          <path d="M50 18 L50 8 L58 3" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M64 5 L76 15 L67 18 Z" fill="#60a5fa" opacity=".45" />
          <rect x="56" y="-1" width="10" height="7" rx="2" fill="#e2e8f0" stroke={INK} strokeWidth="1" transform="rotate(30 61 2.5)" />
          <circle cx="64.5" cy="5.5" r="1.8" fill="#3b82f6" />
        </g>
      );
    case 'patient':
    case 'radiographer':
      return null;
  }
}
