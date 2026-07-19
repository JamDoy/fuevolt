import { useEffect, useState } from 'react';
import { fetchFuelPrices } from '../utils/api';

const BRISBANE = { latitude: -27.4698, longitude: 153.0251 };

const GUIDE_FUEL_TYPES = {
  'fuel-types-explained': ['E10', 'U91', 'U95', 'U98', 'Diesel', 'LPG'],
  'understanding-octane-ratings': ['U91', 'U95', 'U98'],
  'petrol-vs-diesel-vs-electric-comparison': ['U91', 'Diesel'],
};

function formatCheckedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function LiveFueVoltData({ slug, theme }) {
  const [state, setState] = useState({ loading: true, stats: [], checkedAt: null });

  useEffect(() => {
    let cancelled = false;
    const fuelTypes = GUIDE_FUEL_TYPES[slug] || ['U91'];

    Promise.allSettled(
      fuelTypes.map((fuelType) => fetchFuelPrices({
        ...BRISBANE,
        fuelType,
        radius: 10,
      }))
    ).then((responses) => {
      if (cancelled) return;

      const stats = responses.flatMap((response, index) => {
        if (response.status !== 'fulfilled') return [];
        const stations = response.value.filter(
          (station) => Number.isFinite(station.price) && station.price > 0
        );
        if (stations.length === 0) return [];
        const average = (
          stations.reduce((sum, station) => sum + station.price, 0) / stations.length
        ) * 100;
        return [{ fuelType: fuelTypes[index], average, stationCount: stations.length }];
      });
      const checkedAt = responses
        .filter((response) => response.status === 'fulfilled')
        .flatMap((response) => response.value)
        .find((station) => station.dataCheckedAt)?.dataCheckedAt || null;

      setState({ loading: false, stats, checkedAt });
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <aside
      className="rounded-xl p-4 mb-6"
      style={{ background: theme.cardBg, border: `1px solid ${theme.accent}55` }}
      aria-labelledby="live-fuevolt-data"
    >
      <h2 id="live-fuevolt-data" className="text-sm font-bold mb-2" style={{ color: theme.heading }}>
        Live FueVolt Data
      </h2>
      {state.loading ? (
        <p className="text-xs" style={{ color: theme.textSecondary }}>
          Loading a current Brisbane-area fuel-price snapshot…
        </p>
      ) : state.stats.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {state.stats.map((stat) => (
              <div key={stat.fuelType} className="rounded-lg px-3 py-2" style={{ background: theme.bg }}>
                <p className="text-[10px] font-semibold" style={{ color: theme.textMuted }}>{stat.fuelType}</p>
                <p className="text-sm font-bold" style={{ color: theme.accent }}>
                  {(stat.average * 100).toFixed(1)}¢/L average
                </p>
                <p className="text-[10px]" style={{ color: theme.textMuted }}>
                  {stat.stationCount} nearby station{stat.stationCount === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-3" style={{ color: theme.textMuted }}>
            Brisbane-area government price reports{formatCheckedAt(state.checkedAt) ? ` checked ${formatCheckedAt(state.checkedAt)}` : ''}. Prices can change at any time.
          </p>
        </>
      ) : (
        <p className="text-xs" style={{ color: theme.textSecondary }}>
          The live snapshot is unavailable right now. Use FueVolt’s fuel search to check current prices near you.
        </p>
      )}
      <a href="/fuel-prices/brisbane" className="inline-block text-xs mt-3 font-semibold" style={{ color: theme.accent }}>
        View live Brisbane fuel prices
      </a>
    </aside>
  );
}
