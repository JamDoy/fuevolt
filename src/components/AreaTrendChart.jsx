import { useState } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const MARGIN = { top: 16, right: 16, bottom: 26, left: 42 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const MAX_X_LABELS = 6;

function formatDDMM(isoDate) {
  const [, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

// Rounds a raw axis step up to a "nice" human-friendly increment (1, 2, 5,
// 10 × a power of ten) so the y-axis reads like "200¢ / 210¢ / 220¢" rather
// than an arbitrary fraction.
function niceStep(rawStep) {
  const pow = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / pow;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return niceNorm * pow;
}

function buildYTicks(minCents, maxCents, targetCount = 4) {
  const range = maxCents - minCents || 1;
  const step = niceStep(range / targetCount);
  const niceMin = Math.floor(minCents / step) * step;
  const niceMax = Math.ceil(maxCents / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step * 0.001; v += step) ticks.push(Math.round(v * 10) / 10);
  return ticks;
}

function buildPath(coords) {
  let line = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const cx = (x0 + x1) / 2;
    line += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return line;
}

// A bigger, dedicated area-wide chart (as opposed to Sparkline, which is a
// compact per-station glance) — gridlines and axis readings on both axes so
// it reads like a real chart rather than a decorative squiggle.
export default function AreaTrendChart({ points, theme, accentColor = '#F59E0B' }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const isDark = theme.mode === 'dark';

  if (!points || points.length < 2) {
    return (
      <div
        className="rounded-2xl flex items-center justify-center"
        style={{ height: `${HEIGHT}px`, border: `1px dashed ${theme.chipBorder}`, background: theme.cardBg }}
      >
        <p className="text-xs px-8 text-center leading-relaxed" style={{ color: theme.textMuted }}>
          Not enough local price history yet for this area — search here again over the coming days to build the trend.
        </p>
      </div>
    );
  }

  const cents = points.map((p) => p.price * 100);
  const yTicks = buildYTicks(Math.min(...cents), Math.max(...cents));
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  const yRange = yMax - yMin || 1;

  const n = points.length;
  const stepX = n > 1 ? PLOT_W / (n - 1) : 0;
  const coords = points.map((p, i) => [
    MARGIN.left + i * stepX,
    MARGIN.top + (1 - (p.price * 100 - yMin) / yRange) * PLOT_H,
  ]);

  const line = buildPath(coords);
  const area = `${line} L ${coords[n - 1][0]} ${MARGIN.top + PLOT_H} L ${coords[0][0]} ${MARGIN.top + PLOT_H} Z`;
  const labelEvery = Math.max(1, Math.ceil(n / MAX_X_LABELS));
  const gradId = 'areaTrendGrad';

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines + y-axis price labels */}
        {yTicks.map((tick) => {
          const y = MARGIN.top + (1 - (tick - yMin) / yRange) * PLOT_H;
          return (
            <g key={tick}>
              <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} stroke={theme.chipBorder} strokeWidth="1" strokeDasharray="3 3" />
              <text x={MARGIN.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={theme.textMuted}>
                {tick.toFixed(0)}¢
              </text>
            </g>
          );
        })}

        {/* Vertical gridlines + x-axis date labels */}
        {points.map((p, i) => {
          if (i % labelEvery !== 0 && i !== n - 1) return null;
          const x = coords[i][0];
          return (
            <g key={p.date}>
              <line x1={x} x2={x} y1={MARGIN.top} y2={MARGIN.top + PLOT_H} stroke={theme.chipBorder} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <text x={x} y={HEIGHT - 8} textAnchor="middle" fontSize="10" fill={theme.textMuted}>
                {formatDDMM(p.date)}
              </text>
            </g>
          );
        })}

        <path d={area} fill={`url(#${gradId})`} stroke="none" />
        <path
          d={line}
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'sparklineDraw 900ms ease-out forwards' }}
        />

        {coords.map(([x, y], i) => (
          <circle
            key={points[i].date}
            cx={x}
            cy={y}
            r={i === hoverIdx || i === n - 1 ? 5 : 3}
            fill={i === n - 1 ? accentColor : isDark ? '#0D2B5E' : '#FFFFFF'}
            stroke={accentColor}
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}
      </svg>

      {hoverIdx != null && (
        <div
          className="absolute px-2 py-1 rounded-md text-[11px] font-semibold pointer-events-none"
          style={{
            left: `${(coords[hoverIdx][0] / WIDTH) * 100}%`,
            top: `${(coords[hoverIdx][1] / HEIGHT) * 100}%`,
            transform: 'translate(-50%, -140%)',
            background: accentColor,
            color: '#0D2B5E',
            whiteSpace: 'nowrap',
          }}
        >
          {(points[hoverIdx].price * 100).toFixed(1)}¢ · {formatDDMM(points[hoverIdx].date)}
        </div>
      )}
    </div>
  );
}
