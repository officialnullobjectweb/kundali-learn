// Photo-textured planets: real NASA-derived equirectangular maps
// (320px wide, ~1-12KB each, 48KB total) inside a vector SVG sphere —
// terminator shading + vignette + atmosphere rim + Saturn rings stay vector,
// so lighting looks premium at any size. Rahu/Ketu have no real surface
// (they are lunar nodes, not bodies) → use stylized PlanetArt for those.
import { useId } from 'react';
import { PlanetArt, type PlanetName } from './PlanetArt';

const TEX: Partial<Record<PlanetName, { src: string; atmo: string; glow: string }>> = {
  Sun:     { src: '/planets/tex/sunmap.jpg', atmo: '#ffcf5e', glow: '#ff9d2e' },
  Moon:    { src: '/planets/tex/moon.jpg', atmo: '#e8eaee', glow: '#aeb4bd' },
  Mars:    { src: '/planets/tex/marsmap1k.jpg', atmo: '#e8935a', glow: '#8a2c10' },
  Mercury: { src: '/planets/tex/mercurymap.jpg', atmo: '#a8e0b4', glow: '#1f7a42' },
  Jupiter: { src: '/planets/tex/jupitermap.jpg', atmo: '#e8bd80', glow: '#8a4c22' },
  Venus:   { src: '/planets/tex/venusmap.jpg', atmo: '#fdf3cf', glow: '#c99a3f' },
  Saturn:  { src: '/planets/tex/saturnmap.jpg', atmo: '#f4e3ac', glow: '#9a7738' },
};

// CSS filter per texture: lift + grade each map to its premium look.
const GRADE: Partial<Record<PlanetName, string>> = {
  Sun: 'brightness(1.08) saturate(1.55) contrast(1.1)',
  Moon: 'brightness(1.17) contrast(1.08)',
  // Budha green (Vedic convention): rotate the grey-brown map into green.
  Mercury: 'brightness(1.06) contrast(1.12) hue-rotate(58deg) saturate(1.2)',
  Venus: 'brightness(1.07) saturate(.8)',
  Saturn: 'brightness(1.05) contrast(1.22) saturate(1.14)',
};

// shift 0..1 pans the texture to centre a feature (e.g. Jupiter's Red Spot).
export function PlanetPhoto({ name, size = 160, shift = 0 }: {
  name: PlanetName; size?: number; shift?: number;
}) {
  // ponytail: useId keeps def ids stable across SSR + hydration (no remount).
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const t = TEX[name];
  if (!t) return <PlanetArt name={name} size={size} />;
  const id = `p${uid}`;
  // Texture is 2:1; render it 2x wide and pan so any longitude can be centred.
  const imgW = 400;
  const imgX = 100 - imgW / 2 - shift * 200;
  const moonLight = name === 'Moon';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={`${name} planet photo`}>
      <defs>
        <radialGradient id={`ph${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={t.glow} stopOpacity="0" />
          <stop offset="88%" stopColor={t.glow} stopOpacity={moonLight ? '.55' : '.38'} />
          <stop offset="100%" stopColor={t.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`pbm${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="75%" stopColor="#fff" stopOpacity="0" />
          <stop offset="90%" stopColor="#fff" stopOpacity=".22" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`pt${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="46%" stopColor="#000" stopOpacity="0" />
          <stop offset="80%" stopColor="#000" stopOpacity={moonLight ? '.2' : '.38'} />
          <stop offset="100%" stopColor="#000" stopOpacity={moonLight ? '.58' : '.8'} />
        </linearGradient>
        <radialGradient id={`pv${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity={moonLight ? '.32' : '.5'} />
        </radialGradient>
        <radialGradient id={`pw${id}`} cx="50%" cy="46%" r="62%">
          <stop offset="0%" stopColor="#fff3c0" stopOpacity=".65" />
          <stop offset="45%" stopColor="#ffc93c" stopOpacity=".4" />
          <stop offset="78%" stopColor="#ff7b0a" stopOpacity=".42" />
          <stop offset="100%" stopColor="#d63a00" stopOpacity=".78" />
        </radialGradient>
        <radialGradient id={`pcr${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity=".55" />
          <stop offset="45%" stopColor="#fff3c0" stopOpacity="0" />
          <stop offset="100%" stopColor="#fff3c0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`pvn${id}`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#fffdf0" stopOpacity=".9" />
          <stop offset="55%" stopColor="#f7e3a1" stopOpacity=".55" />
          <stop offset="100%" stopColor="#c99a3f" stopOpacity=".75" />
        </radialGradient>
        <linearGradient id={`psa${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5a00" stopOpacity=".3" />
          <stop offset="45%" stopColor="#d9a944" stopOpacity="0" />
          <stop offset="100%" stopColor="#5c3a08" stopOpacity=".38" />
        </linearGradient>
        <radialGradient id={`pmg${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor="#1f8b4c" stopOpacity="0" />
          <stop offset="88%" stopColor="#1f8b4c" stopOpacity=".3" />
          <stop offset="100%" stopColor="#0a4d26" stopOpacity=".55" />
        </radialGradient>
        <filter id={`pb${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`pb2${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id={`pg${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0.5 0.5 0 0" result="a" />
          <feComposite in="a" in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`pc${id}`}><circle cx="100" cy="100" r="78" /></clipPath>
      </defs>

      <circle cx="100" cy="100" r="96" fill={`url(#ph${id})`} />
      {moonLight && <circle cx="100" cy="100" r="90" fill={`url(#pbm${id})`} />}

      {/* ---- Sun: 8-ray corona + prominences (behind disc) ---- */}
      {name === 'Sun' && (
        <g>
          <g fill={t.glow} opacity=".5" filter={`url(#pb${id})`}>
            <path d="M100 0 L112 34 L88 34 Z" />
            <path d="M100 200 L112 166 L88 166 Z" />
            <path d="M0 100 L34 88 L34 112 Z" />
            <path d="M200 100 L166 88 L166 112 Z" />
            <path d="M29 29 L54 54 L46 62 Z" />
            <path d="M171 171 L146 146 L154 138 Z" />
            <path d="M171 29 L146 54 L154 62 Z" />
            <path d="M29 171 L54 146 L46 138 Z" />
            <path d="M52 8 L64 40 L56 42 Z" opacity=".7" />
            <path d="M148 8 L136 40 L144 42 Z" opacity=".7" />
            <path d="M52 192 L64 160 L56 158 Z" opacity=".7" />
            <path d="M148 192 L136 160 L144 158 Z" opacity=".7" />
          </g>
          <g fill="none" stroke="#ff5a00" strokeWidth="4" strokeLinecap="round" opacity=".9">
            <path d="M32 84 Q18 70 30 52 Q38 66 32 84" />
            <path d="M168 130 Q184 144 172 162 Q164 148 168 130" />
            <path d="M60 26 Q70 10 88 16 Q74 20 60 26" />
            <path d="M140 176 Q152 190 168 184 Q154 180 140 176" />
            <path d="M172 60 Q188 66 186 84 Q178 72 172 60" />
            <path d="M28 140 Q12 134 14 116 Q22 128 28 140" />
          </g>
          <g fill="#ffd23f" opacity=".95">
            <path d="M34 82 Q24 70 32 56 Q38 68 34 82" />
            <path d="M166 132 Q178 144 170 158 Q164 146 166 132" />
          </g>
        </g>
      )}

      {/* ---- Saturn rings, back half: C / B / Cassini / A / F ---- */}
      {name === 'Saturn' && (
        <g>
          <ellipse cx="100" cy="110" rx="100" ry="30" fill="none" stroke="#8f7c4e" strokeWidth="22" opacity=".42" />
          <ellipse cx="100" cy="110" rx="99" ry="29" fill="none" stroke="#faf0cd" strokeWidth="12" opacity=".92" />
          <ellipse cx="100" cy="110" rx="99" ry="29" fill="none" stroke="#c9a960" strokeWidth="5" opacity=".7" />
          <ellipse cx="100" cy="110" rx="98" ry="28.5" fill="none" stroke="#1a1204" strokeWidth="4" opacity=".95" />
          <ellipse cx="100" cy="110" rx="97" ry="28" fill="none" stroke="#d9bd7f" strokeWidth="6.5" opacity=".88" />
          <ellipse cx="100" cy="110" rx="103" ry="31.5" fill="none" stroke="#efda9e" strokeWidth="1.6" opacity=".6" />
        </g>
      )}

      <circle cx="100" cy="100" r="78" fill={name === 'Sun' ? '#ffd23f' : name === 'Venus' ? '#f2d384' : '#0b0d17'} />
      <g clipPath={`url(#pc${id})`}>
        {name === 'Venus'
          ? <g>
              <circle cx="100" cy="100" r="78" fill={`url(#pvn${id})`} />
              <image href={t.src} x={imgX} y={20} width={imgW} height="160" preserveAspectRatio="none" opacity=".5" style={GRADE[name] ? { filter: GRADE[name] } : undefined} />
              <g fill="none" stroke="#fffdf4" strokeLinecap="round" opacity=".5" filter={`url(#pb2${id})`}>
                <path d="M30 84 Q80 70 150 82" strokeWidth="7" />
                <path d="M28 108 Q90 96 170 106" strokeWidth="9" />
                <path d="M40 130 Q90 122 160 130" strokeWidth="6" />
              </g>
              <g fill="none" stroke="#b3852f" strokeLinecap="round" opacity=".35" filter={`url(#pb2${id})`}>
                <path d="M34 96 Q90 86 160 94" strokeWidth="4" />
                <path d="M36 120 Q90 112 162 120" strokeWidth="3.4" />
              </g>
              <g fill="none" stroke="#fffdf4" strokeLinecap="round" opacity=".4" filter={`url(#pb2${id})`}>
                <path d="M100 56 Q90 76 66 92" strokeWidth="4" />
                <path d="M100 56 Q110 76 134 92" strokeWidth="4" />
              </g>
              <ellipse cx="100" cy="40" rx="52" ry="14" fill="#fffef4" opacity=".5" filter={`url(#pb${id})`} />
              <ellipse cx="100" cy="162" rx="48" ry="12" fill="#fffef4" opacity=".4" filter={`url(#pb${id})`} />
            </g>
          : <image href={t.src} x={imgX} y={20} width={imgW} height="160" preserveAspectRatio="none" style={GRADE[name] ? { filter: GRADE[name] } : undefined} />}
        {/* Budha green wash over the grey-brown map (Vedic convention) */}
        {name === 'Mercury' && <circle cx="100" cy="100" r="78" fill="#1f8b4c" opacity=".14" />}
        {name === 'Mercury' && <circle cx="100" cy="100" r="78" fill={`url(#pmg${id})`} />}
        {/* Sun granulation cells over the texture */}
        {name === 'Sun' && <rect x="18" y="18" width="164" height="164" filter={`url(#pg${id})`} opacity=".45" />}
        {/* Sunspots: dark umbra + glowing penumbra, plus bright faculae */}
        {name === 'Sun' && (
          <g>
            <ellipse cx="70" cy="108" rx="11" ry="8.5" fill="#7a2a00" opacity=".9" />
            <ellipse cx="70" cy="108" rx="6" ry="4.6" fill="#140500" />
            <ellipse cx="130" cy="86" rx="8" ry="6.5" fill="#7a2a00" opacity=".9" />
            <ellipse cx="130" cy="86" rx="4.2" ry="3.2" fill="#140500" />
            <ellipse cx="108" cy="130" rx="5.5" ry="4.4" fill="#7a2a00" opacity=".85" />
            <ellipse cx="108" cy="130" rx="2.8" ry="2.2" fill="#140500" />
            <g stroke="#fff3c0" strokeWidth="2.2" opacity=".55" strokeLinecap="round">
              <path d="M42 66 Q62 58 86 62" />
              <path d="M118 142 Q140 138 158 130" />
              <path d="M50 122 Q66 118 82 120" />
            </g>
          </g>
        )}
        {/* Sun hot core */}
        {name === 'Sun' && <circle cx="100" cy="100" r="78" fill={`url(#pcr${id})`} />}
        {/* ring shadow cast on Saturn's northern hemisphere */}
        {name === 'Saturn' && <ellipse cx="100" cy="82" rx="76" ry="9" fill="#2a1e06" opacity=".5" filter={`url(#pb2${id})`} />}
        {/* Sun is a light source: no night-side terminator, warm tint instead */}
        {name !== 'Sun' && <circle cx="100" cy="100" r="78" fill={`url(#pt${id})`} />}
        {name === 'Sun'
          ? <circle cx="100" cy="100" r="78" fill={`url(#pw${id})`} />
          : name === 'Saturn'
            ? <g>
                <circle cx="100" cy="100" r="78" fill={`url(#pv${id})`} />
                <circle cx="100" cy="100" r="78" fill={`url(#psa${id})`} />
              </g>
            : <circle cx="100" cy="100" r="78" fill={`url(#pv${id})`} />}
      </g>

      {/* ---- Saturn rings, front half + globe shadow on rings ---- */}
      {name === 'Saturn' && (
        <g>
          <path d="M1 112 A100 30 0 0 0 199 112 L182 119.5 A80 23 0 0 1 18 119.5 Z" fill="#f2e2b2" opacity=".94" />
          <path d="M1 112 A100 30 0 0 0 199 112 L195 113.8 A94 28.2 0 0 1 5 113.8 Z" fill="#fbf2d2" opacity=".9" />
          <path d="M12 116 A88 26 0 0 0 188 116 L184 117.6 A84 25 0 0 1 16 117.6 Z" fill="#1a1204" opacity=".85" />
          <path d="M58 117.5 A80 23 0 0 0 142 117.5 L138 120.5 A76 21.5 0 0 1 62 120.5 Z" fill="#241a06" opacity=".55" />
        </g>
      )}

      {/* top-left sheen: strongest on the Moon so it glows bright */}
      {name !== 'Sun' && (
        <ellipse cx="76" cy="62" rx="38" ry="24" fill="#fff"
          opacity={moonLight ? '.24' : name === 'Mercury' ? '.14' : name === 'Saturn' ? '.17' : '.1'} filter={`url(#pb${id})`} />
      )}
      <circle cx="100" cy="100" r="78" fill="none" stroke={t.atmo}
        strokeWidth={name === 'Venus' ? 3 : 1.6} opacity={name === 'Venus' ? '.85' : '.6'} />
    </svg>
  );
}
