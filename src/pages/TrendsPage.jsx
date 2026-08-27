import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import Sparkline from '../components/Sparkline';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import { fetchFuelPrices, geocodeLocation, getUserLocation } from '../utils/api';
import { getPriceHistory } from '../utils/priceHistory';

const FUEL_TYPES = [
  { id: 'E10', label: 'E10' },
  { id: 'U91', label: 'Unleaded 91' },
  { id: 'Diesel', label: 'Diesel' },
  { id: 'U95', label: 'Premium 95' },
  { id: 'U98', label: 'Premium 98' },
  { id: 'LPG', label: 'LPG' },
];

export default function TrendsPage({ onStationDetail }) {
  const { theme } = useTheme();
  const [fuelType, setFuelType] = useState('U91');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');
  const [lastCoords, setLastCoords] = useState(null);

  const runSearch = async (lat, lng, type, label) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    if (label) setLocationLabel(label);
    setLastCoords({ lat, lng });
    try {
      const data = await fetchFuelPrices({ latitude: lat, longitude: lng, fuelType: type, radius: 10 });
      setStations(data || []);
    } catch {
      setError('Could not load stations for this location.');
      setStations([]);
    }
    setLoading(false);
  };

  const handleSearch = async (query) => {
    try {
      const loc = await geocodeLocation(query);
      if (!loc) {
        setError('Could not find that location.');
        setHasSearched(true);
        return;
      }
      await runSearch(loc.latitude, loc.longitude, fuelType, loc.displayName || query);
    } catch {
      setError('Could not find that location.');
      setHasSearched(true);
    }
  };

  const handleUseLocation = async () => {
    try {
      const loc = await getUserLocation();
      await runSearch(loc.latitude, loc.longitude, fuelType, 'Your location');
    } catch (err) {
      setError(err.message || 'Could not get your location.');
      setHasSearched(true);
    }
  };

  const handleFuelTypeChange = (id) => {
    setFuelType(id);
    if (hasSearched && lastCoords) {
      runSearch(lastCoords.lat, lastCoords.lng, id, locationLabel);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: theme.heading }}>Fuel Price Trends</h1>
      <p className="text-sm mb-5" style={{ color: theme.textMuted }}>
        Search a suburb to see how prices at nearby stations have moved over time.
        Trend history builds up the more a station gets checked — a station you're
        searching for the first time won't have a graph yet.
      </p>

      <SearchBar
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        loading={loading}
        placeholder="Search suburb, city or postcode..."
        inputId="trends-search"
      />

      <div className="flex flex-wrap gap-2 mt-4">
        {FUEL_TYPES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleFuelTypeChange(f.id)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              transition: 'all 0.25s ease',
              background: fuelType === f.id ? 'linear-gradient(135deg, #B45309, #F59E0B)' : theme.chipBg,
              color: fuelType === f.id ? '#0D2B5E' : theme.chipText,
              border: `1px solid ${fuelType === f.id ? 'transparent' : theme.chipBorder}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-6 flex flex-col gap-3">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
      )}

      {!loading && error && <ErrorCard message={error} />}

      {!loading && !error && hasSearched && stations.length === 0 && (
        <p className="mt-6 text-sm" style={{ color: theme.textMuted }}>
          No stations found near {locationLabel || 'that location'}.
        </p>
      )}

      {!loading && !error && stations.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {stations.map((station) => {
            const history = getPriceHistory(station.id, fuelType);
            return (
              <div
                key={station.id}
                className="rounded-2xl p-4"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: theme.heading }}>{station.name}</h2>
                    <p className="text-xs" style={{ color: theme.textMuted }}>{station.brand} &middot; {station.address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-extrabold" style={{ color: theme.heading }}>{station.priceDisplay}</p>
                    {onStationDetail && (
                      <button
                        type="button"
                        onClick={() => onStationDetail(station)}
                        className="text-xs font-semibold cursor-pointer"
                        style={{ background: 'none', border: 'none', color: theme.gold, padding: 0 }}
                      >
                        View station &rarr;
                      </button>
                    )}
                  </div>
                </div>
                <Sparkline points={history} theme={theme} />
              </div>
            );
          })}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="mt-10 text-center">
          <p className="text-sm" style={{ color: theme.textMuted }}>
            Search a location above to see fuel price trends for nearby stations.
          </p>
        </div>
      )}
    </div>
  );
}
