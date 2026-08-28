import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import Sparkline from '../components/Sparkline';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import DigitalPrice from '../components/DigitalPrice';
import ShareMenu from '../components/ShareMenu';
import { fetchFuelPrices, geocodeLocation, getUserLocation } from '../utils/api';
import { getPriceHistory } from '../utils/priceHistory';
import { getPriceContext } from '../utils/priceFreshness';
import { buildTrendsShareUrl } from '../utils/shareLinks';

const FUEL_TYPES = [
  { id: 'E10', label: 'E10' },
  { id: 'U91', label: 'Unleaded 91' },
  { id: 'Diesel', label: 'Diesel' },
  { id: 'U95', label: 'Premium 95' },
  { id: 'U98', label: 'Premium 98' },
  { id: 'LPG', label: 'LPG' },
];

export default function TrendsPage({ onStationDetail, onGoHome, initialSearch }) {
  const { theme } = useTheme();
  const [fuelType, setFuelType] = useState(initialSearch?.fuelType || 'U91');
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

  useEffect(() => {
    if (Number.isFinite(initialSearch?.lat) && Number.isFinite(initialSearch?.lng)) {
      runSearch(initialSearch.lat, initialSearch.lng, initialSearch.fuelType || fuelType, initialSearch.label || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pricedStations = stations.filter((s) => s.price != null);
  const avgPrice = pricedStations.length > 0
    ? pricedStations.reduce((sum, s) => sum + s.price, 0) / pricedStations.length
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: theme.heading }}>Fuel Price Trends</h1>
      <p className="text-sm mb-5" style={{ color: theme.textMuted }}>
        Search a suburb to see how prices at nearby stations have moved over time.
        Trend history builds up the more a station gets checked — a station you're
        searching for the first time won't have a graph yet.
      </p>

      {onGoHome && (
        <button
          type="button"
          onClick={onGoHome}
          className="w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-4 mb-5 cursor-pointer text-left"
          style={{ background: 'linear-gradient(135deg, #1A6FDB, #0D3A8C)', border: 'none' }}
        >
          <span>
            <span className="block text-sm font-bold text-white">Want the full picture, not just trends?</span>
            <span className="block text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Compare live fuel prices near you on the FueVolt homepage
            </span>
          </span>
          <span className="flex-shrink-0 text-sm font-bold" style={{ color: '#F59E0B' }}>Go now &rarr;</span>
        </button>
      )}

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
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium" style={{ color: theme.textMuted }}>
              {locationLabel ? `Near ${locationLabel}` : 'Nearby stations'}
            </p>
            {lastCoords && (
              <ShareMenu
                title="Fuel Price Trends"
                text={`Check out fuel price trends near ${locationLabel || 'this area'} on FueVolt`}
                url={buildTrendsShareUrl({ lat: lastCoords.lat, lng: lastCoords.lng, fuelType, label: locationLabel })}
                buttonClassName="cursor-pointer flex-shrink-0"
                buttonStyle={{ background: 'none', border: 'none', color: theme.textMuted }}
              />
            )}
          </div>
          {stations.map((station) => {
            const history = getPriceHistory(station.id, fuelType);
            const context = getPriceContext(station.price, avgPrice);
            return (
              <div
                key={station.id}
                className="rounded-2xl p-4"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold break-words" style={{ color: theme.heading }}>{station.name}</h2>
                    <p className="text-xs" style={{ color: theme.textMuted }}>{station.brand} &middot; {station.address}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg">
                      {station.price != null ? (
                        <DigitalPrice context={context} color={!context ? theme.heading : undefined}>
                          {(station.price * 100).toFixed(1)}
                        </DigitalPrice>
                      ) : (
                        <span style={{ color: theme.textMuted }}>N/A</span>
                      )}
                      <span className="text-xs font-semibold ml-0.5" style={{ color: theme.textMuted }}>&cent;/L</span>
                    </p>
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

      <div className="mt-10 rounded-2xl p-5" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
        <h2 className="text-lg font-bold mb-2" style={{ color: theme.heading }}>Understanding the fuel price cycle</h2>
        <p className="text-sm mb-3" style={{ color: theme.textMuted }}>
          Fuel prices in Australia's capital cities don't just drift up and down randomly — they follow a
          well-documented petrol price cycle, tracked by the ACCC in Sydney, Melbourne, Brisbane, Adelaide
          and Perth. Prices typically rise sharply over a day or two, then decline gradually over the next
          one to two weeks before spiking again.
        </p>
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Knowing where a city sits in its cycle is the best way to time a fill-up. Search a suburb above to
          see the actual fuel price history for stations near you, or read our full guide on{' '}
          <a
            href="/guides/how-fuel-price-cycles-work-australia"
            className="underline font-semibold"
            style={{ color: theme.gold }}
          >
            how fuel price cycles work in Australia
          </a>{' '}
          and the best day to buy fuel.
        </p>
      </div>
    </div>
  );
}
