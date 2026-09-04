// Fuel-drop mark with a lightning bolt — the FueVolt brand icon. The source
// image is cropped tight to the droplet (no padding), unlike the old SVG
// which had breathing room baked into its viewBox — scaling down a bit here
// keeps it visually the same size as before at every call site's `size`.
const VISUAL_SCALE = 0.62;

export function FueVoltIcon({ size = 40, className }) {
  const renderedSize = size * VISUAL_SCALE;
  return (
    <img
      src="/logo-icon.png"
      alt=""
      width={renderedSize}
      style={{ width: renderedSize, height: 'auto', transform: 'translateY(-12%)' }}
      className={className}
      aria-hidden="true"
    />
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
