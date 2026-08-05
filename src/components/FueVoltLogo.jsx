// Fuel-drop mark with a lightning bolt — the FueVolt brand icon.
export function FueVoltIcon({ size = 40, className }) {
  const h = size * 1.3;
  const id = `fv${size}`;
  return (
    <svg width={size} height={h} viewBox="0 0 120 156" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}dg`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="45%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#14532D" />
        </radialGradient>

        <radialGradient id={`${id}rl`} cx="82%" cy="78%" r="38%">
          <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#86EFAC" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${id}bg`} x1="68" y1="28" x2="46" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        <linearGradient id={`${id}bs`} x1="60" y1="28" x2="52" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </linearGradient>

        <filter id={`${id}sh`} x="-20%" y="-10%" width="145%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#14532D" floodOpacity="0.4" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.12" />
        </filter>

        <clipPath id={`${id}cl`}>
          <path d="M 60,6 C 62,10 72,22 82,38 C 94,57 110,76 110,100 A 50,50 0 0 1 10,100 C 10,76 26,57 38,38 C 48,22 58,10 60,6 Z" />
        </clipPath>
      </defs>

      <path
        d="M 60,6 C 62,10 72,22 82,38 C 94,57 110,76 110,100 A 50,50 0 0 1 10,100 C 10,76 26,57 38,38 C 48,22 58,10 60,6 Z"
        fill="#15803D"
        filter={`url(#${id}sh)`}
      />

      <path
        d="M 60,6 C 62,10 72,22 82,38 C 94,57 110,76 110,100 A 50,50 0 0 1 10,100 C 10,76 26,57 38,38 C 48,22 58,10 60,6 Z"
        fill={`url(#${id}dg)`}
      />

      <path
        d="M 60,6 C 62,10 72,22 82,38 C 94,57 110,76 110,100 A 50,50 0 0 1 10,100 C 10,76 26,57 38,38 C 48,22 58,10 60,6 Z"
        fill={`url(#${id}rl)`}
      />

      <polygon
        points="70,32 46,86 62,86 48,132 78,74 62,74 70,32"
        fill="#052e16"
        fillOpacity="0.22"
        transform="translate(3,4)"
        clipPath={`url(#${id}cl)`}
      />

      <polygon points="68,28 44,82 60,82 46,128 76,70 60,70 68,28" fill={`url(#${id}bg)`} />

      <polygon points="68,28 60,70 46,128 44,82 68,28" fill={`url(#${id}bs)`} />

      <polygon
        points="68,28 44,82 60,82 46,128 76,70 60,70 68,28"
        fill="none"
        stroke="#FEF3C7"
        strokeWidth="0.6"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

// Icon + "FueVolt" wordmark, "Volt" in the amber gradient. darkBg controls
// whether "Fue" renders white (on navy) or navy (on light backgrounds).
export function FueVoltWordmark({ iconSize = 40, textSize = 24, darkBg = true, gap = 10 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <FueVoltIcon size={iconSize} />
      <span style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
        <span
          style={{
            fontWeight: 900,
            fontSize: textSize,
            letterSpacing: '-0.03em',
            color: darkBg ? '#FFFFFF' : '#0D2B5E',
          }}
        >
          Fue
        </span>
        <span
          style={{
            fontWeight: 900,
            fontSize: textSize,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #B45309 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Volt
        </span>
      </span>
    </div>
  );
}
