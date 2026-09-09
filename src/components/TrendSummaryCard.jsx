import AreaTrendChart from './AreaTrendChart';

// Where the latest reading sits within the visible series' own range — a
// simple, honest stand-in for "where is this in the petrol price cycle"
// that needs no external cycle-phase data, just the same history already
// being charted.
function computeCyclePosition(series, theme) {
  if (series.length < 2) return null;
  const prices = series.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const latest = prices[prices.length - 1];
  const range = max - min;
  const changeCents = (latest - prices[0]) * 100;
  if (range < 0.005) return { label: 'holding steady', color: theme.textMuted, changeCents };
  const positionRatio = (latest - min) / range;
  if (positionRatio >= 0.8) return { label: 'near the top of the cycle', color: '#EF4444', changeCents };
  if (positionRatio <= 0.2) return { label: 'near the bottom of the cycle', color: '#22C55E', changeCents };
  return { label: 'mid-cycle', color: theme.gold, changeCents };
}

// Shared "current price + trend chart" card — used both for a searched
// suburb's area average and the Australia-wide default view on the Trends
// page. Same visual, different underlying series.
export default function TrendSummaryCard({ title, currentPrice, series, theme, accentColor }) {
  const cyclePosition = computeCyclePosition(series, theme);

  return (
    <div className="rounded-2xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>
            {title}
          </p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: theme.heading }}>
            {currentPrice > 0 ? `${(currentPrice * 100).toFixed(1)}¢` : '—'}
            <span className="text-xs font-semibold ml-1" style={{ color: theme.textMuted }}>/L</span>
          </p>
        </div>
        {cyclePosition && (
          <div className="text-right flex-shrink-0">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: cyclePosition.color + '22', color: cyclePosition.color }}
            >
              {cyclePosition.label}
            </span>
            <p className="text-[11px] mt-1" style={{ color: theme.textMuted }}>
              {cyclePosition.changeCents > 0.1
                ? `+${cyclePosition.changeCents.toFixed(1)}¢`
                : cyclePosition.changeCents < -0.1
                  ? `${cyclePosition.changeCents.toFixed(1)}¢`
                  : 'no change'}
              {' '}over {series.length} day{series.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
      <AreaTrendChart points={series} theme={theme} accentColor={accentColor} />
    </div>
  );
}
