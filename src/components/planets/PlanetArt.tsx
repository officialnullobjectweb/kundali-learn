// Realistic lightweight planet SVGs v2 (~3-5KB each, still ~100x smaller than webp).
// Realism recipe per planet:
//  - offset radial sphere shading + strong limb darkening + soft diffuse light
//    (NO plastic white blob — replaced with faint glow + thin crescent rim)
//  - TWO turbulence layers: large-scale mottling + fine grain
//  - feDisplacementMap on gas bands so edges ripple like real jets
//  - per-planet geology: maria/rays/chevrons/ovals/Cassini/canyons/sunspots.
import { useId } from 'react';

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

export const PLANET_NAMES: PlanetName[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

type Palette = { hi: string; mid: string; lo: string; edge: string; atmo: string; glow: string };

const PAL: Record<PlanetName, Palette> = {
  Sun:     { hi: '#fffef0', mid: '#ffd23f', lo: '#f56e0c', edge: '#8a1e00', atmo: '#ffcf5e', glow: '#ff9d2e' },
  Moon:    { hi: '#efefec', mid: '#b9bab6', lo: '#6f7276', edge: '#232529', atmo: '#c9ccd1', glow: '#6f747a' },
  Mars:    { hi: '#ffdfb4', mid: '#d2691e', lo: '#7e2a0c', edge: '#280a02', atmo: '#e8935a', glow: '#8a2c10' },
  Mercury: { hi: '#e4f2dc', mid: '#6fae72', lo: '#245c33', edge: '#0a2412', atmo: '#a8e0b4', glow: '#1f7a42' },
  Jupiter: { hi: '#fdf6e3', mid: '#d9a05f', lo: '#7c421c', edge: '#2c1404', atmo: '#e8bd80', glow: '#8a4c22' },
  Venus:   { hi: '#fffef4', mid: '#eed088', lo: '#a67c26', edge: '#3a2808', atmo: '#f7e3a1', glow: '#b3852f' },
  Saturn:  { hi: '#fff9de', mid: '#e2c37c', lo: '#8f6c2e', edge: '#332508', atmo: '#efda9e', glow: '#9a7738' },
  Rahu:    { hi: '#9a86c8', mid: '#332a55', lo: '#0e0a1c', edge: '#000000', atmo: '#7a68b0', glow: '#241c48' },
  Ketu:    { hi: '#eec890', mid: '#8a5024', lo: '#2c1406', edge: '#070300', atmo: '#c98d4e', glow: '#4a2408' },
};

// Crater renderer: ejecta halo + dark bowl + sunlit wall crescent + shadow + peak.
function Craters({ list, floor = '#000', wall = '#fff' }: {
  list: Array<[number, number, number, number, number?]>; floor?: string; wall?: string;
}) {
  return (
    <g>
      {list.map(([cx, cy, r, o, peak], i) => (
        <g key={i} opacity={o}>
          <circle cx={cx} cy={cy} r={r * 1.7} fill={wall} opacity=".14" />
          <circle cx={cx} cy={cy} r={r} fill={floor} opacity=".6" />
          <circle cx={cx} cy={cy} r={r * 0.72} fill={floor} opacity=".55" />
          <path d={`M${cx - r * 0.75} ${cy - r * 0.45} A${r * 0.9} ${r * 0.9} 0 0 1 ${cx + r * 0.55} ${cy - r * 0.72}`}
            fill="none" stroke={wall} strokeWidth={Math.max(1, r * 0.22)} opacity=".7" strokeLinecap="round" />
          <path d={`M${cx - r * 0.7} ${cy + r * 0.55} A${r} ${r} 0 0 0 ${cx + r * 0.7} ${cy + r * 0.5}`}
            fill="none" stroke="#000" strokeWidth={Math.max(1, r * 0.25)} opacity=".5" strokeLinecap="round" />
          {peak ? <circle cx={cx} cy={cy} r={r * 0.22} fill={wall} opacity=".8" /> : null}
        </g>
      ))}
    </g>
  );
}

// [cx, cy, r, opacity, centralPeak?]
const MOON_CRATERS: Array<[number, number, number, number, number?]> = [
  [66, 74, 12, .8, 1], [104, 60, 8, .7], [128, 70, 10, .75, 1], [142, 100, 13, .8, 1],
  [118, 108, 7, .65], [96, 96, 9, .7, 1], [76, 104, 6, .6], [58, 122, 9, .65],
  [88, 130, 11, .7, 1], [116, 136, 8, .65], [138, 128, 6, .6], [150, 84, 5, .55],
  [84, 52, 5, .55], [108, 122, 4.5, .55], [70, 140, 5, .5], [130, 148, 6, .55],
  [100, 80, 4, .5], [60, 92, 4, .5], [146, 116, 4, .5], [92, 148, 4, .5],
];
const MERCURY_CRATERS: Array<[number, number, number, number, number?]> = [
  [72, 70, 11, .75, 1], [108, 58, 7, .65], [132, 82, 12, .8, 1], [118, 110, 9, .7, 1],
  [88, 100, 8, .7], [62, 104, 10, .7, 1], [80, 130, 9, .65], [110, 138, 7, .6],
  [140, 118, 6, .6], [148, 96, 5, .55], [96, 78, 5, .55], [68, 122, 5, .55],
  [124, 128, 4, .5], [100, 118, 3.6, .5], [86, 84, 3.6, .5],
];
const MARS_CRATERS: Array<[number, number, number, number, number?]> = [
  [70, 96, 7, .5], [128, 102, 9, .5, 1], [108, 128, 6, .45], [88, 118, 5, .45], [140, 88, 5, .4],
];
// Fixed speckle star-dust for rocky bodies.
const SPECKLE: Array<[number, number, number]> = [
  [52, 70, 1], [64, 62, .8], [78, 56, .9], [92, 50, .7], [112, 48, .8], [126, 52, .7],
  [142, 62, .9], [152, 78, .8], [156, 98, .9], [152, 118, .8], [142, 136, .9], [126, 148, .8],
  [108, 154, .7], [90, 152, .8], [72, 146, .7], [58, 134, .8], [48, 118, .7], [44, 100, .8],
  [46, 84, .7], [96, 68, .7], [120, 92, .7], [104, 116, .7], [84, 116, .7], [134, 104, .7],
];

export function PlanetArt({ name, size = 160 }: { name: PlanetName; size?: number }) {
  // ponytail: useId keeps def ids stable across SSR + hydration (no remount).
  const id = `${name}-${size}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const p = PAL[name];
  const rocky = name === 'Moon' || name === 'Mercury' || name === 'Mars';
  // Sun runs brighter: heavy black grain would turn it muddy brown.
  const mottleOp = name === 'Sun' ? 0.2 : rocky ? 0.5 : 0.34;
  const fineOp = name === 'Sun' ? 0.16 : rocky ? 0.4 : 0.28;

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={`${name} planet illustration`}>
      <defs>
        <radialGradient id={`s${id}`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor={p.hi} />
          <stop offset="38%" stopColor={p.mid} />
          <stop offset="72%" stopColor={p.lo} />
          <stop offset="100%" stopColor={p.edge} />
        </radialGradient>
        <radialGradient id={`h${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor={p.glow} stopOpacity="0" />
          <stop offset="89%" stopColor={p.glow} stopOpacity=".38" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="46%" stopColor="#000" stopOpacity="0" />
          <stop offset="80%" stopColor="#000" stopOpacity=".38" />
          <stop offset="100%" stopColor="#000" stopOpacity=".8" />
        </linearGradient>
        <radialGradient id={`v${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity=".5" />
        </radialGradient>
        <filter id={`m${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={rocky ? '0.045 0.06' : name === 'Sun' ? '0.08' : '0.012 0.05'} numOctaves="4" seed="11" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.7 0.7 0.7 0 0" result="a" />
          <feComposite in="a" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`f${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency={rocky ? '0.5' : '0.55'} numOctaves="3" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.55 0.55 0.55 0 0" result="a" />
          <feComposite in="a" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`w${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.012 0.11" numOctaves="3" seed="8" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`w2${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.015 0.08" numOctaves="2" seed="5" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`b6${id}`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={`b25${id}`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.5" /></filter>
        <filter id={`b12${id}`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.2" /></filter>
        <clipPath id={`c${id}`}><circle cx="100" cy="100" r="78" /></clipPath>
      </defs>

      <circle cx="100" cy="100" r="96" fill={`url(#h${id})`} />

      {/* ---- Sun corona + prominences (behind disc) ---- */}
      {name === 'Sun' && (
        <g>
          <g fill={p.glow} opacity=".35" filter={`url(#b6${id})`}>
            <path d="M100 0 L112 34 L88 34 Z" />
            <path d="M100 200 L112 166 L88 166 Z" />
            <path d="M0 100 L34 88 L34 112 Z" />
            <path d="M200 100 L166 88 L166 112 Z" />
            <path d="M29 29 L54 54 L46 62 Z" />
            <path d="M171 171 L146 146 L154 138 Z" />
            <path d="M171 29 L146 54 L154 62 Z" />
            <path d="M29 171 L54 146 L46 138 Z" />
          </g>
          <g fill="none" stroke="#ff5a00" strokeWidth="4" strokeLinecap="round" opacity=".85">
            <path d="M32 84 Q18 70 30 52 Q38 66 32 84" />
            <path d="M168 130 Q184 144 172 162 Q164 148 168 130" />
            <path d="M60 26 Q70 10 88 16 Q74 20 60 26" />
          </g>
          <g fill="#ffd23f" opacity=".9">
            <path d="M34 82 Q24 70 32 56 Q38 68 34 82" />
            <path d="M166 132 Q178 144 170 158 Q164 146 166 132" />
          </g>
        </g>
      )}

      {/* ---- Saturn rings, back half ---- */}
      {name === 'Saturn' && (
        <g>
          <ellipse cx="100" cy="110" rx="97" ry="27" fill="none" stroke="#6b5326" strokeWidth="17" opacity=".5" />
          <ellipse cx="100" cy="110" rx="97" ry="27" fill="none" stroke="#c9a960" strokeWidth="11" opacity=".75" />
          <ellipse cx="100" cy="110" rx="97" ry="27" fill="none" stroke="#3d2d0e" strokeWidth="2.2" opacity=".9" />
          <ellipse cx="100" cy="110" rx="88" ry="24" fill="none" stroke="#f4e3ac" strokeWidth="5" opacity=".9" />
          <ellipse cx="100" cy="110" rx="79" ry="21" fill="none" stroke="#54401a" strokeWidth="3" opacity=".7" />
        </g>
      )}

      {/* ---- sphere base ---- */}
      <circle cx="100" cy="100" r="78" fill={`url(#s${id})`} />

      <g clipPath={`url(#c${id})`}>
        {/* large mottling + fine grain */}
        <rect x="18" y="18" width="164" height="164" filter={`url(#m${id})`} opacity={mottleOp} />
        <rect x="18" y="18" width="164" height="164" filter={`url(#f${id})`} opacity={fineOp} />

        {/* ================= MOON ================= */}
        {name === 'Moon' && (
          <g>
            <g fill="#4a4e54" opacity=".5" filter={`url(#b25${id})`}>
              <ellipse cx="72" cy="88" rx="30" ry="24" />
              <ellipse cx="120" cy="70" rx="22" ry="18" />
              <ellipse cx="132" cy="118" rx="26" ry="22" />
              <ellipse cx="84" cy="132" rx="20" ry="15" />
              <ellipse cx="148" cy="92" rx="12" ry="14" />
            </g>
            <g stroke="#fff" strokeLinecap="round" opacity=".16">
              <path d="M110 130 L40 170" strokeWidth="2" />
              <path d="M110 130 L170 180" strokeWidth="2.4" />
              <path d="M110 130 L150 60" strokeWidth="1.8" />
              <path d="M110 130 L60 50" strokeWidth="1.6" />
              <path d="M110 130 L180 110" strokeWidth="1.5" />
              <path d="M110 130 L30 110" strokeWidth="1.5" />
            </g>
            <Craters list={MOON_CRATERS} />
            <g fill="#fff" opacity=".3">
              {SPECKLE.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r * 0.55} />)}
            </g>
          </g>
        )}

        {/* ================= MERCURY ================= */}
        {name === 'Mercury' && (
          <g>
            <g fill="#3d3423" opacity=".45" filter={`url(#b25${id})`}>
              <ellipse cx="90" cy="90" rx="34" ry="22" />
              <ellipse cx="126" cy="120" rx="24" ry="18" />
              <ellipse cx="70" cy="120" rx="18" ry="14" />
            </g>
            <g stroke="#d8f0dc" strokeLinecap="round" opacity=".22">
              <path d="M132 82 L176 50" strokeWidth="2" />
              <path d="M132 82 L180 96" strokeWidth="1.8" />
              <path d="M132 82 L160 140" strokeWidth="1.6" />
              <path d="M132 82 L90 40" strokeWidth="1.5" />
            </g>
            <g fill="none" stroke="#0e2a14" strokeWidth="2" opacity=".5" strokeLinecap="round">
              <path d="M48 96 Q90 88 150 96" />
              <path d="M56 124 Q100 118 146 122" />
            </g>
            <Craters list={MERCURY_CRATERS} floor="#0e2a14" wall="#d8f0dc" />
          </g>
        )}

        {/* ================= MARS ================= */}
        {name === 'Mars' && (
          <g>
            <g fill="#3c0e03" opacity=".68" filter={`url(#b12${id})`}>
              <path d="M40 96 Q80 78 118 92 Q100 108 60 110 Z" />
              <path d="M112 84 Q150 76 162 94 Q140 104 116 98 Z" />
              <path d="M58 118 Q96 110 140 116 Q120 134 76 132 Z" />
              <ellipse cx="130" cy="130" rx="16" ry="8" opacity=".7" />
            </g>
            <ellipse cx="76" cy="134" rx="26" ry="10" fill="#e8a05e" opacity=".22" />
            <ellipse cx="126" cy="66" rx="20" ry="8" fill="#e8a05e" opacity=".2" />
            <path d="M52 108 L148 116 L142 122 L58 114 Z" fill="#2c0c02" opacity=".65" />
            <path d="M70 109 L132 115" stroke="#000" strokeWidth="1.4" opacity=".5" />
            <ellipse cx="118" cy="52" rx="14" ry="6" fill="#e8c890" opacity=".32" />
            <g>
              <path d="M66 30 Q100 22 134 30 Q130 44 100 46 Q70 44 66 30 Z" fill="#f7f2e8" opacity=".95" />
              <path d="M78 40 Q100 36 122 40" stroke="#5a4a3a" strokeWidth="2" fill="none" opacity=".5" />
            </g>
            <Craters list={MARS_CRATERS} floor="#3c0e03" wall="#ffd9b0" />
          </g>
        )}

        {/* ================= JUPITER ================= */}
        {name === 'Jupiter' && (
          <g filter={`url(#w${id})`}>
            <rect x="18" y="34" width="164" height="12" fill="#e8c48f" opacity=".9" />
            <rect x="18" y="48" width="164" height="15" fill="#f7e8cd" opacity=".95" />
            <rect x="18" y="65" width="164" height="14" fill="#a86428" opacity=".9" />
            <rect x="18" y="81" width="164" height="13" fill="#f3ddb8" opacity=".95" />
            <rect x="18" y="94" width="164" height="12" fill="#e0b070" opacity=".9" />
            <rect x="18" y="106" width="164" height="14" fill="#7c421c" opacity=".88" />
            <rect x="18" y="120" width="164" height="13" fill="#d8a56d" opacity=".92" />
            <rect x="18" y="133" width="164" height="14" fill="#5f3410" opacity=".85" />
            <rect x="18" y="147" width="164" height="14" fill="#a86428" opacity=".8" />
            <g opacity=".8">
              <path d="M40 81 Q70 86 110 82 T170 84" stroke="#fff" strokeWidth="2.4" fill="none" />
              <path d="M36 106 Q80 111 130 106 T172 108" stroke="#4a2408" strokeWidth="2.2" fill="none" />
              <path d="M50 120 Q90 124 140 121" stroke="#f7e8cd" strokeWidth="2" fill="none" />
            </g>
            <g opacity=".7">
              <path d="M96 94 Q92 104 96 114" stroke="#5a7a9a" strokeWidth="3" fill="none" />
              <path d="M112 94 Q108 104 112 114" stroke="#5a7a9a" strokeWidth="2.4" fill="none" />
              <path d="M60 65 Q56 73 60 81" stroke="#6e3413" strokeWidth="3" fill="none" />
            </g>
            <ellipse cx="52" cy="140" rx="9" ry="5" fill="#f7f2e8" opacity=".85" />
            <ellipse cx="74" cy="144" rx="7" ry="4" fill="#f7f2e8" opacity=".8" />
            <ellipse cx="56" cy="56" rx="10" ry="3.4" fill="#4a2408" opacity=".7" />
          </g>
        )}

        {/* ================= VENUS ================= */}
        {name === 'Venus' && (
          <g>
            <g filter={`url(#w${id})`} opacity=".8">
              <ellipse cx="100" cy="72" rx="95" ry="16" fill="#fff6da" />
              <ellipse cx="100" cy="100" rx="95" ry="18" fill="#eec96f" opacity=".8" />
              <ellipse cx="100" cy="128" rx="95" ry="16" fill="#fff0c0" opacity=".9" />
            </g>
            <g fill="none" stroke="#fffdf0" strokeLinecap="round" opacity=".38" filter={`url(#b25${id})`}>
              <path d="M100 52 Q88 78 58 98 Q78 92 100 88" strokeWidth="4" />
              <path d="M100 52 Q112 78 142 98 Q122 92 100 88" strokeWidth="4" />
              <path d="M40 118 Q80 110 140 118 T168 116" strokeWidth="3" opacity=".8" />
              <path d="M48 136 Q90 130 138 136" strokeWidth="2.4" opacity=".7" />
            </g>
          </g>
        )}

        {/* ================= SATURN bands ================= */}
        {name === 'Saturn' && (
          <g filter={`url(#w2${id})`} opacity=".9">
            <rect x="18" y="52" width="164" height="14" fill="#f7ecd0" />
            <rect x="18" y="68" width="164" height="13" fill="#c8a45e" opacity=".9" />
            <rect x="18" y="83" width="164" height="15" fill="#f3e2b0" />
            <rect x="18" y="100" width="164" height="12" fill="#a8842e" opacity=".8" />
            <rect x="18" y="114" width="164" height="14" fill="#d9bd7f" />
            <rect x="18" y="130" width="164" height="14" fill="#6e5626" opacity=".85" />
            <ellipse cx="100" cy="118" rx="90" ry="7" fill="#3d2d0e" opacity=".35" />
          </g>
        )}

        {/* ================= SUN ================= */}
        {name === 'Sun' && (
          <g>
            <g fill="#ffedb0" opacity=".35">
              <ellipse cx="80" cy="70" rx="16" ry="6" />
              <ellipse cx="120" cy="116" rx="18" ry="7" />
              <ellipse cx="90" cy="140" rx="12" ry="5" />
            </g>
            <g>
              <ellipse cx="72" cy="104" rx="10" ry="8" fill="#7a2a00" opacity=".9" />
              <ellipse cx="72" cy="104" rx="5.5" ry="4.4" fill="#1a0800" />
              <ellipse cx="128" cy="88" rx="7" ry="6" fill="#7a2a00" opacity=".9" />
              <ellipse cx="128" cy="88" rx="3.6" ry="3" fill="#1a0800" />
              <ellipse cx="110" cy="128" rx="5" ry="4" fill="#7a2a00" opacity=".85" />
              <ellipse cx="110" cy="128" rx="2.6" ry="2" fill="#1a0800" />
            </g>
            <g stroke="#fffbd6" strokeWidth="2" opacity=".5" strokeLinecap="round">
              <path d="M40 60 Q60 52 84 56" />
              <path d="M120 140 Q142 136 158 128" />
            </g>
          </g>
        )}

        {/* ================= RAHU / KETU: eclipse smoke + inner fire ================= */}
        {(name === 'Rahu' || name === 'Ketu') && (
          <g>
            <circle cx="100" cy="100" r="78"
              fill={name === 'Rahu' ? '#1c1436' : '#3a1c08'} opacity=".55" />
            <g fill="none" strokeLinecap="round" opacity=".6" filter={`url(#w2${id})`}>
              <path d="M36 76 Q76 56 128 74 T172 70" stroke={name === 'Rahu' ? '#9a86c8' : '#f0b264'} strokeWidth="6" />
              <path d="M32 110 Q84 94 136 108 T174 104" stroke={name === 'Rahu' ? '#5a4d95' : '#c07a2e'} strokeWidth="8" />
              <path d="M58 138 Q100 128 142 136" stroke={name === 'Rahu' ? '#2c2450' : '#6e3410'} strokeWidth="5.5" />
              <path d="M48 92 Q100 82 152 90" stroke={name === 'Rahu' ? '#7a68b8' : '#d99648'} strokeWidth="3" opacity=".85" />
              <path d="M44 124 Q96 114 156 122" stroke={name === 'Rahu' ? '#3d3370' : '#8a4a1a'} strokeWidth="4" opacity=".8" />
              {/* Rahu rises: twin smoke columns from the crown (the head ascending) */}
              {name === 'Rahu' && (
                <g opacity=".7">
                  <path d="M84 52 Q78 34 88 20" stroke="#9a86c8" strokeWidth="4" />
                  <path d="M114 50 Q120 32 112 18" stroke="#6d5da0" strokeWidth="3.4" />
                </g>
              )}
            </g>
            {/* hot core glow welling up from below */}
            <ellipse cx="100" cy="132" rx="46" ry="26"
              fill={name === 'Rahu' ? '#6d5da0' : '#ff9d2e'} opacity=".35" filter={`url(#b6${id})`} />
            {name === 'Rahu' && (
              <g fill="#d8ccff">
                <circle cx="66" cy="98" r="1.6" opacity=".9" />
                <circle cx="120" cy="88" r="1.3" opacity=".8" />
                <circle cx="140" cy="122" r="1.5" opacity=".85" />
                <circle cx="88" cy="126" r="1.2" opacity=".75" />
                <circle cx="104" cy="108" r="1.1" opacity=".7" />
                <circle cx="152" cy="100" r="1" opacity=".7" />
              </g>
            )}
            {name === 'Ketu' && (
              <g fill="#ffd9a0">
                <circle cx="70" cy="96" r="1.8" opacity=".9" />
                <circle cx="104" cy="84" r="1.3" opacity=".8" />
                <circle cx="132" cy="106" r="1.5" opacity=".85" />
                <circle cx="92" cy="120" r="1.2" opacity=".75" />
                <circle cx="118" cy="124" r="1.4" opacity=".85" />
                <circle cx="84" cy="110" r="1" opacity=".7" />
              </g>
            )}
          </g>
        )}

        {/* Jupiter Red Spot ABOVE bands (not displaced away) */}
        {name === 'Jupiter' && (
          <g>
            <ellipse cx="128" cy="126" rx="23" ry="9" fill="#f7e8cd" opacity=".7" />
            <ellipse cx="130" cy="126" rx="19" ry="10.5" fill="#a83a12" />
            <ellipse cx="130" cy="126" rx="19" ry="10.5" fill="none" stroke="#5f1d05" strokeWidth="2" opacity=".8" />
            <ellipse cx="130" cy="126" rx="11.5" ry="6" fill="#e06a35" />
            <ellipse cx="130" cy="126" rx="6" ry="3.2" fill="#f0a070" />
            <path d="M104 122 Q92 124 82 122" stroke="#a83a12" strokeWidth="3" fill="none" opacity=".7" strokeLinecap="round" />
          </g>
        )}

        {/* rocky speckle */}
        {rocky && (
          <g fill="#fff" opacity=".22">
            {SPECKLE.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r * 0.55} />)}
          </g>
        )}

        {/* terminator + inner vignette */}
        <circle cx="100" cy="100" r="78" fill={`url(#t${id})`} />
        <circle cx="100" cy="100" r="78" fill={`url(#v${id})`} />
      </g>

      {/* ---- Saturn rings, front half + globe shadow on rings ---- */}
      {name === 'Saturn' && (
        <g>
          <path d="M4 112 A97 27 0 0 0 196 112 L180 118 A80 22 0 0 1 20 118 Z" fill="#e9d29a" opacity=".92" />
          <path d="M4 112 A97 27 0 0 0 196 112 L192 113.5 A93 25.5 0 0 1 8 113.5 Z" fill="#f7ecd0" opacity=".8" />
          <path d="M60 116 A80 22 0 0 0 140 116 L136 119 A76 20 0 0 1 64 119 Z" fill="#3d2d0e" opacity=".45" />
        </g>
      )}

      {/* ---- Rahu/Ketu eclipse corona + rim + Ketu tail (past the limb) ---- */}
      {(name === 'Rahu' || name === 'Ketu') && (
        <g fill="none">
          {name === 'Rahu' && (
            <g>
              <circle cx="100" cy="100" r="84" stroke="#8f7fb8"
                strokeWidth="11" strokeDasharray="2.5 8" opacity=".5" filter={`url(#b12${id})`} />
              <circle cx="100" cy="100" r="93" stroke="#6d5da0"
                strokeWidth="17" strokeDasharray="2 13" opacity=".3" filter={`url(#b6${id})`} />
            </g>
          )}
          {name === 'Ketu' && (
            <circle cx="100" cy="100" r="86" stroke="#e8a95e"
              strokeWidth="7" opacity=".35" filter={`url(#b6${id})`} />
          )}
          <path d="M40 74 A66 66 0 0 1 88 36" stroke={name === 'Rahu' ? '#cfc2f5' : '#ffe0b0'}
            strokeWidth="2.6" opacity=".85" strokeLinecap="round" filter={`url(#b12${id})`} />
          {name === 'Rahu' && (
            <g stroke="#e8e2ff" strokeLinecap="round">
              <path d="M150 52 h12 M156 46 v12" strokeWidth="1.6" opacity=".9" />
              <path d="M48 140 h9 M52.5 135.5 v9" strokeWidth="1.4" opacity=".8" />
              <circle cx="132" cy="140" r="1.4" fill="#e8e2ff" stroke="none" opacity=".85" />
            </g>
          )}
          {name === 'Ketu' && (
            <g strokeLinecap="round">
              {/* forked serpent tail flowing down-right: two prongs + ember trail */}
              <path d="M142 118 Q168 134 188 162" stroke="#f0b264" strokeWidth="7" opacity=".6" filter={`url(#b12${id})`} />
              <path d="M150 132 Q170 150 182 178" stroke="#c07a2e" strokeWidth="4.5" opacity=".6" filter={`url(#b12${id})`} />
              <path d="M134 104 Q154 116 172 140" stroke="#8a4a1a" strokeWidth="3" opacity=".55" filter={`url(#b12${id})`} />
              <g fill="#ffd9a0" stroke="none">
                <circle cx="188" cy="162" r="2" opacity=".9" />
                <circle cx="182" cy="178" r="1.5" opacity=".75" />
                <circle cx="172" cy="140" r="1.6" opacity=".85" />
                <circle cx="190" cy="168" r="1.2" opacity=".7" />
                <circle cx="178" cy="152" r="1.1" opacity=".65" />
              </g>
            </g>
          )}
        </g>
      )}

      {/* ---- soft diffuse light (replaces plastic blob) ---- */}
      {name === 'Sun'
        ? <ellipse cx="100" cy="96" rx="52" ry="46" fill="#fffef0" opacity=".28" filter={`url(#b6${id})`} />
        : <ellipse cx="76" cy="62" rx="38" ry="24" fill="#fff" opacity=".1" filter={`url(#b6${id})`} />}
      <path d="M44 78 A62 62 0 0 1 86 42" fill="none" stroke="#fff" strokeWidth="3.4"
        opacity={name === 'Sun' ? 0 : .28} strokeLinecap="round" filter={`url(#b12${id})`} />
      <circle cx="100" cy="100" r="78" fill="none" stroke={p.atmo} strokeWidth="1.6" opacity=".6" />
    </svg>
  );
}
