import { useState } from 'react';
import { getHighLow } from '../utils/priceHistory';

const WIDTH = 300;
const HEIGHT = 80;
const PAD = 6;

function formatDDMMYY(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function buildPath(points) {
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.01;
  const n = points.length;
  const stepX = n > 1 ? (WIDTH - PAD * 2) / (n - 1) : 0;

  const coords = points.map((p, i) => {
    const x = PAD + i * stepX;
    const y = PAD + (1 - (p.price - min) / range) * (HEIGHT - PAD * 2);
    return [x, y];
  });

  let line = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const cx = (x0 + x1) / 2;
    line += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  const area = `${line} L ${coords[coords.length - 1][0]} ${HEIGHT - PAD} L ${coords[0][0]} ${HEIGHT - PAD} Z`;

  return { line, area, coords };
}

export default function Sparkline({ points, theme }) {
  const [showLowTip, setShowLowTip] = useState(false);

  if (!points || points.length < 2) {
    return (
      <div className="mt-4">
        <div
          className="rounded-xl flex items-center justify-center"
          style={{ height: `${HEIGHT}px`, border: `1px dashed ${theme.chipBorder}` }}
        >
          <p className="text-xs px-4 text-center" style={{ color: theme.textMuted }}>
            Price history coming soon for this station — check back after a few visits to see the trend build up.
          </p>
        </div>
      </div>
    );
  }

  const { line, area, coords } = buildPath(points);
  const { high, low } = getHighLow(points);
  const lastIdx = coords.length - 1;
  const lowIdx = points.findIndex((p) => p === low);
  const gradId = 'sparklineGrad';

  return (
    <div className="mt-4 relative">
      {/* A normal-flow row above the SVG, not absolutely positioned over it —
          the graph's own shape (a high point near either edge, for example)
          would otherwise put the curve or its end dot right behind this
          text no matter which corner it's pinned to. */}
      <div className="flex justify-end">
        <p className="text-xs font-semibold">
          <span style={{ color: '#EF4444' }}>&uarr; {(high.price * 100).toFixed(1)}&cent;</span>
          {'  '}
          <span style={{ color: '#22C55E' }}>&darr; {(low.price * 100).toFixed(1)}&cent;</span>
        </p>
      </div>

      <svg width="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" style={{ height: `${HEIGHT}px`, display: 'block' }} className="mt-2">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
            <stop offset="100%" stopColor="rgba(34,197,94,0)" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} stroke="none" />
        <path
          d={line}
          fill="none"
          stroke="#22C55E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'sparklineDraw 800ms ease-out forwards' }}
        />
        {lowIdx >= 0 && lowIdx !== lastIdx && (
          <circle
            cx={coords[lowIdx][0]}
            cy={coords[lowIdx][1]}
            r="5"
            fill="#F59E0B"
            stroke={theme.mode === 'dark' ? '#0D2B5E' : '#FFFFFF'}
            strokeWidth="1.5"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setShowLowTip(true)}
            onMouseLeave={() => setShowLowTip(false)}
            onClick={() => setShowLowTip((v) => !v)}
          >
            <title>{`${(low.price * 100).toFixed(1)}¢ — ${formatDDMMYY(low.date)}`}</title>
          </circle>
        )}
        <circle
          cx={coords[lastIdx][0]}
          cy={coords[lastIdx][1]}
          r="6"
          fill="#22C55E"
          stroke={theme.mode === 'dark' ? '#0D2B5E' : '#FFFFFF'}
          strokeWidth="2"
          style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'sparkDotPulse 2s ease-in-out infinite' }}
        />
      </svg>

      {showLowTip && (
        <div
          className="absolute px-2 py-1 rounded-md text-[11px] font-semibold pointer-events-none"
          style={{
            left: `${(coords[lowIdx][0] / WIDTH) * 100}%`,
            top: '-4px',
            transform: 'translate(-50%, -100%)',
            background: '#F59E0B',
            color: '#0D2B5E',
            whiteSpace: 'nowrap',
          }}
        >
          {(low.price * 100).toFixed(1)}&cent; &middot; {formatDDMMYY(low.date)}
        </div>
      )}

      <div className="flex justify-between mt-1">
        <span className="text-[11px]" style={{ color: theme.textMuted }}>
          {(points[0].price * 100).toFixed(1)}&cent; &middot; {formatDDMMYY(points[0].date)}
        </span>
        <span className="text-[11px]" style={{ color: theme.textMuted }}>
          {(points[lastIdx].price * 100).toFixed(1)}&cent; &middot; {formatDDMMYY(points[lastIdx].date)}
        </span>
      </div>
    </div>
  );
}
