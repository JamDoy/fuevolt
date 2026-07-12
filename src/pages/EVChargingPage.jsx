import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import StationMap from '../components/StationMap';
import EVStationCard from '../components/EVStationCard';
import EVDetailPanel from '../components/EVDetailPanel';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import EVCostEstimator from '../components/EVCostEstimator';
import { fetchEVStations, geocodeLocation, getUserLocation } from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { reverseGeocode } from '../utils/tomtom';
import { injectEVStationSchema, POPULAR_SUBURBS } from '../utils/seo';

const CONNECTOR_FILTERS = ['Type 2', 'CCS', 'CHAdeMO', 'Tesla', 'Type 1'];
const SPEED_FILTERS = [
  { id: 'slow', label: '≤7kW (Slow)', max: 7 },
  { id: 'fast', label: '7-50kW (Fast)', min: 7, max: 50 },
  { id: 'ultra', label: '50kW+ (Ultra-Rapid)', min: 50 },
];

export default function EVChargingPage({ initialSuburb, initialSearch }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [detailStation, setDetailStation] = useState(null);
  const [connectorFilters, setConnectorFilters] = useState([]);
  const [speedFilters, setSpeedFilters] = useState([]);
  const [locationName, setLocationName] = useState(initialSuburb?.name || '');
  const [searchLabel, setSearchLabel] = useState(initialSuburb?.name || '');
  const [searchRadius, setSearchRadius] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const autoLocation = useAutoLocation();

  const doSearch = async (lat, lng, radius = 10, label = '') => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    if (label) setSearchLabel(label);
    try {
      const data = await fetchEVStations({ latitude: lat, longitude: lng, distance: radius });
      setStations(data);
      setMapCenter([lat, lng]);

      // Inject structured data for SEO
      injectEVStationSchema(data, label || null);

      // Reverse geocode to show suburb name
      reverseGeocode(lat, lng).then((loc) => {
        if (loc?.suburb) setLocationName(loc.suburb);
      }).catch(() => {});

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setLocationName(query);
    setSearchLabel(query);
    try {
      const geo = await geocodeLocation(query);
      await doSearch(geo.latitude, geo.longitude, searchRadius, query);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUseLocation = async () => {
    setLoading(true);
    setError(null);
    setLocationName('your location');
    setSearchLabel('your location');
    try {
      const pos = await getUserLocation();
      await doSearch(pos.latitude, pos.longitude, searchRadius, 'your location');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialSuburb?.lat && initialSuburb?.lng) {
        doSearch(initialSuburb.lat, initialSuburb.lng, 10, initialSuburb.name);
      } else if (initialSearch?.query) {
        handleSearch(initialSearch.query);
      } else if (initialSearch?.useLocation) {
        handleUseLocation();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!autoLocation || initialSuburb || mapCenter || initialSearch) return undefined;
    const timer = window.setTimeout(() => {
      doSearch(autoLocation.latitude, autoLocation.longitude, 10, 'your location');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleConnector = (f) =>
    setConnectorFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const toggleSpeed = (id) =>
    setSpeedFilters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const getMaxPower = (station) => {
    if (!station.Connections) return 0;
    return Math.max(...station.Connections.map((c) => c.PowerKW || 0));
  };

  const filtered = stations.filter((s) => {
    if (connectorFilters.length > 0) {
      const connTypes = s.Connections?.map((c) => c.ConnectionType?.Title || '') || [];
      if (!connectorFilters.some((f) => connTypes.some((t) => t.includes(f)))) {
        return false;
      }
    }
    if (speedFilters.length > 0) {
      const maxPower = getMaxPower(s);
      const matchesAny = speedFilters.some((id) => {
        const sf = SPEED_FILTERS.find((x) => x.id === id);
        if (!sf) return false;
        if (sf.min && sf.max) return maxPower > sf.min && maxPower <= sf.max;
        if (sf.max) return maxPower <= sf.max;
        if (sf.min) return maxPower >= sf.min;
        return true;
      });
      if (!matchesAny) return false;
    }
    return true;
  });

  // Stats
  const totalPoints = filtered.reduce((sum, s) => sum + (s.NumberOfPoints || 1), 0);
  const ultraRapidCount = filtered.filter((s) => getMaxPower(s) >= 50).length;
  const nearestCity = mapCenter
    ? POPULAR_SUBURBS.ev.reduce((nearest, city) => {
        const distance = Math.hypot(city.lat - mapCenter[0], city.lng - mapCenter[1]);
        return !nearest || distance < nearest.distance ? { ...city, distance } : nearest;
      }, null)
    : POPULAR_SUBURBS.ev[0];

  const clearFilters = () => {
    setConnectorFilters([]);
    setSpeedFilters([]);
  };

  const retryWithWiderRadius = () => {
    if (!mapCenter) return;
    setSearchRadius(30);
    doSearch(mapCenter[0], mapCenter[1], 30, locationName || searchLabel);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Hero Section — Green EV Identity */}
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.green }}>
          &#x26A1; EV Charging Stations
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          Search thousands of EV charging points across Australia
        </p>
      </div>

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        loading={loading}
        placeholder="Search suburb, city or postcode..."
        inputId="ev-location-search"
        accentColor={theme.green}
      />

      {/* Filters */}
      {stations.length > 0 && (
        <div className="space-y-2">
          <FilterChips
            label="Connector:"
            filters={CONNECTOR_FILTERS}
            activeFilters={connectorFilters}
            onToggle={toggleConnector}
            accentColor={theme.green}
          />
          <FilterChips
            label="Speed:"
            filters={SPEED_FILTERS.map((s) => s.label)}
            activeFilters={speedFilters.map((id) => SPEED_FILTERS.find((s) => s.id === id)?.label)}
            onToggle={(label) => {
              const sf = SPEED_FILTERS.find((s) => s.label === label);
              if (sf) toggleSpeed(sf.id);
            }}
            accentColor={theme.green}
          />
        </div>
      )}

      {/* EV Stats Summary */}
      {!loading && stations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: theme.cardBg,
              border: `1px solid ${isDark ? 'rgba(46,204,113,0.3)' : 'rgba(39,174,96,0.2)'}`,
              boxShadow: isDark ? '0 0 12px rgba(46,204,113,0.08) inset' : '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Stations</p>
            <p className="text-2xl font-bold" style={{ color: theme.green }}>{filtered.length}</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Charge Points</p>
            <p className="text-2xl font-bold" style={{ color: theme.text }}>{totalPoints}</p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Ultra-Rapid</p>
            <p className="text-2xl font-bold" style={{ color: theme.gold }}>{ultraRapidCount}</p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>50kW+</p>
          </div>

        </div>
      )}

      {/* Location Name */}
      {locationName && !loading && stations.length > 0 && (
        <p className="text-sm font-medium" style={{ color: theme.text }}>
          Showing chargers near <span style={{ color: theme.green }}>{locationName}</span>
        </p>
      )}

      {/* Map */}
      <StationMap
        stations={filtered}
        center={mapCenter}
        selectedStation={selectedStation}
        onStationSelect={(s) => {
          setSelectedStation(s);
          setDetailStation(s);
        }}
        type="ev"
        userLocation={autoLocation}
        onSearchArea={(lat, lng) => doSearch(lat, lng, searchRadius, 'this map area')}
      />

      {/* Results Count */}
      {!loading && stations.length > 0 && (
        <p className="text-xs" style={{ color: theme.textSecondary }}>
          Showing {filtered.length} of {stations.length} stations
          {connectorFilters.length > 0 || speedFilters.length > 0 ? ' (filtered)' : ''}
        </p>
      )}

      {/* Error */}
      {error && (
        <ErrorCard
          message={error}
          onRetry={() => {
            if (mapCenter) doSearch(mapCenter[0], mapCenter[1], searchRadius, locationName || searchLabel);
          }}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm font-medium text-center" style={{ color: theme.textSecondary }}>
            Finding EV chargers near {searchLabel || locationName || 'your area'}...
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Station Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((station) => (
            <EVStationCard
              key={station.ID}
              station={station}
              isSelected={selectedStation?.ID === station.ID}
              onClick={() => {
                setSelectedStation(station);
                setDetailStation(station);
              }}

            />
          ))}
        </div>
      )}

      {/* EV Cost Estimator */}
      {!loading && filtered.length > 0 && (
        <EVCostEstimator />
      )}

      {/* Empty state */}
      {!loading && !error && stations.length === 0 && !hasSearched && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-1" style={{ color: theme.green }}>Find EV chargers near you</h3>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Search for a location or use your current position to find nearby charging stations
          </p>
        </div>
      )}

      {!loading && !error && stations.length === 0 && hasSearched && (
        <div className="rounded-2xl p-6 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
          <h3 className="text-lg font-semibold" style={{ color: theme.text }}>No charging stations found nearby</h3>
          <p className="text-sm mt-2" style={{ color: theme.textSecondary }}>Try widening the search or choosing another suburb.</p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {searchRadius < 30 && mapCenter && (
              <button type="button" onClick={retryWithWiderRadius} className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: theme.chipBg, color: theme.text, border: `1px solid ${theme.chipBorder}` }}>
                Try a wider radius
              </button>
            )}
            <button type="button" onClick={() => document.getElementById('ev-location-search')?.focus()} className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: theme.chipBg, color: theme.text, border: `1px solid ${theme.chipBorder}` }}>
              Try a different suburb
            </button>
            {nearestCity && (
              <a href={`/ev-charging/${nearestCity.slug}`} className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center no-underline" style={{ background: `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`, color: '#FFFFFF' }}>
                Browse {nearestCity.name}
              </a>
            )}
          </div>
        </div>
      )}

      {!loading && !error && stations.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl p-6 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
          <h3 className="text-lg font-semibold" style={{ color: theme.text }}>No chargers match those filters</h3>
          <p className="text-sm mt-2" style={{ color: theme.textSecondary }}>Clear the connector or speed filters to see nearby options.</p>
          <button type="button" onClick={clearFilters} className="min-h-11 px-5 py-2 mt-4 rounded-xl text-sm font-bold cursor-pointer" style={{ background: `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`, color: '#FFFFFF', border: 'none' }}>
            Clear filters
          </button>
        </div>
      )}

      {/* Detail Panel */}
      <EVDetailPanel
        station={detailStation}
        onClose={() => setDetailStation(null)}
      />

      {/* Informational content for SEO and AdSense */}
      <div
        className="rounded-2xl p-6 mt-4"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, backdropFilter: 'blur(12px)' }}
      >
        <h2 className="text-base font-bold mb-3" style={{ color: theme.green }}>About EV Charging in Australia</h2>
        <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          Australia's electric vehicle charging network is growing rapidly, with thousands of public charging stations now available across the country. FueVolt helps you find and compare EV chargers using data from Open Charge Map, the world's largest open database of charging locations.
        </p>
        <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: theme.text }}>Connector Types Explained</h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          <strong>Type 2 (Mennekes)</strong> is the standard AC charging connector used by most EVs in Australia. It supports charging speeds from 7kW to 22kW and is the most common plug type at public and home chargers. <strong>CCS2 (Combined Charging System)</strong> is the dominant DC fast charging standard in Australia, supporting speeds from 50kW to 350kW. Most new EVs sold in Australia use CCS2 for fast charging. <strong>CHAdeMO</strong> is an older DC fast charging standard used by some Japanese EVs like the Nissan Leaf and Mitsubishi Outlander PHEV. <strong>Tesla</strong> Superchargers use a proprietary connector but many newer Tesla vehicles also support CCS2.
        </p>
        <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: theme.text }}>Charging Speed Levels</h3>
        <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          <strong>Slow charging (up to 7kW)</strong> is typically used for overnight home charging and takes 8-12 hours for a full charge. <strong>Fast charging (7-50kW)</strong> is commonly found at shopping centres and workplaces, taking 1-4 hours. <strong>Ultra-rapid charging (50kW+)</strong> is available at highway rest stops and dedicated charging hubs — a 350kW charger can add 200km of range in just 10-15 minutes.
        </p>
        <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: theme.text }}>Charging Cost Estimates</h3>
        <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
          Public DC fast charging in Australia typically costs between $0.40 and $0.60 per kWh. Home charging on a standard electricity tariff costs around $0.25-$0.35 per kWh, making it significantly cheaper. An average EV travelling 300km per week costs roughly $15-$20 in electricity compared to $50-$70 in petrol for an equivalent fuel vehicle. Use our EV vs Fuel calculator to get a personalised savings estimate based on your driving habits.
        </p>
      </div>
    </div>
  );
}
