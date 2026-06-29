import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import StationMap from '../components/StationMap';
import FuelStationCard from '../components/FuelStationCard';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import SavingsCalculator from '../components/SavingsCalculator';
import { fetchFuelPrices, geocodeLocation, getUserLocation, geocodeStationAddresses } from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { getDriveTimes, reverseGeocode } from '../utils/tomtom';
import { injectFuelStationSchema } from '../utils/seo';

const FUEL_TYPES = [
  { id: 'E10', label: 'E10' },
  { id: 'U91', label: 'Unleaded 91' },
  { id: 'U95', label: 'Premium 95' },
  { id: 'U98', label: 'Premium 98' },
  { id: 'Diesel', label: 'Diesel' },
  { id: 'LPG', label: 'LPG' },
];

export default function FuelPricePage({ initialFuelType = 'U91', onStationDetail, onSwitchToEV, initialSuburb }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [fuelType, setFuelType] = useState(initialFuelType);
  const [searchCoords, setSearchCoords] = useState(null);
  const [sortBy, setSortBy] = useState('price');
  const [locationName, setLocationName] = useState('');
  const { theme } = useTheme();
  const autoLocation = useAutoLocation();

  // Auto-search if initialSuburb is set (from suburb-specific URL)
  useEffect(() => {
    if (initialSuburb?.lat && initialSuburb?.lng) {
      doSearch(initialSuburb.lat, initialSuburb.lng, fuelType);
      setLocationName(initialSuburb.name);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-search at user's location if permission already granted
  useEffect(() => {
    if (autoLocation && !initialSuburb && !mapCenter) {
      doSearch(autoLocation.latitude, autoLocation.longitude, fuelType);
    }
  }, [autoLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = useCallback(async (lat, lng, type) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFuelPrices({
        latitude: lat,
        longitude: lng,
        fuelType: type,
      });
      setStations(data);
      setMapCenter([lat, lng]);
      setSearchCoords({ lat, lng });
      geocodeStationAddresses(data, (updated) => setStations(updated));

      // Inject structured data for SEO
      injectFuelStationSchema(data, locationName || null);

      // Reverse geocode to show suburb name
      reverseGeocode(lat, lng).then((loc) => {
        if (loc?.suburb) setLocationName(loc.suburb);
      }).catch(() => {});

      // Fetch drive times in background
      getDriveTimes(lat, lng, data).then((times) => {
        if (!times) return;
        setStations((prev) =>
          prev.map((s, i) => ({
            ...s,
            driveTime: times[i]?.driveTimeMin || null,
            driveDistance: times[i]?.distanceKm || null,
            trafficDelay: times[i]?.trafficDelayMin || null,
          }))
        );
      }).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const geo = await geocodeLocation(query);
      await doSearch(geo.latitude, geo.longitude, fuelType);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [doSearch, fuelType]);

  const handleUseLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getUserLocation();
      await doSearch(pos.latitude, pos.longitude, fuelType);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [doSearch, fuelType]);

  const handleFuelTypeChange = (type) => {
    setFuelType(type);
    if (searchCoords) {
      doSearch(searchCoords.lat, searchCoords.lng, type);
    }
  };

  const sortedStations = [...stations].sort((a, b) => {
    if (sortBy === 'driveTime') {
      if (a.driveTime == null && b.driveTime == null) return a.price - b.price;
      if (a.driveTime == null) return 1;
      if (b.driveTime == null) return -1;
      return a.driveTime - b.driveTime;
    }
    if (sortBy === 'distance') return parseFloat(a.distance || 999) - parseFloat(b.distance || 999);
    return a.price - b.price;
  });

  const cheapest = stations.length > 0
    ? stations.reduce((min, s) => (s.price < min.price ? s : min), stations[0])
    : null;
  const avgPrice = stations.length > 0
    ? stations.reduce((sum, s) => sum + s.price, 0) / stations.length
    : 0;
  const expensive = stations.length > 0
    ? stations.reduce((max, s) => (s.price > max.price ? s : max), stations[0])
    : null;
  const savings = cheapest && expensive
    ? ((expensive.price - cheapest.price) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Hero */}
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.gold }}>
          &#x26FD; Compare Fuel Prices
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          Find the cheapest fuel near you across Australia
        </p>
      </div>

      {/* Fuel Type Selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FUEL_TYPES.map((ft) => (
          <button
            key={ft.id}
            onClick={() => handleFuelTypeChange(ft.id)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              transition: 'all 0.25s ease',
              border: 'none',
              ...(fuelType === ft.id
                ? {
                    background: `linear-gradient(135deg, ${theme.green}, ${theme.greenDark})`,
                    color: '#FFFFFF',
                    boxShadow: `0 0 12px ${theme.mode === 'dark' ? 'rgba(46, 204, 113, 0.3)' : 'rgba(39, 174, 96, 0.25)'}`,
                  }
                : {
                    background: theme.chipBg,
                    color: theme.chipText,
                  }),
            }}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        loading={loading}
        placeholder="Search suburb, city or postcode..."
      />

      {/* Location + Sort Controls */}
      {stations.length > 0 && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {locationName && (
            <p className="text-sm font-medium" style={{ color: theme.text }}>
              Showing results near <span style={{ color: theme.gold }}>{locationName}</span>
            </p>
          )}
          <div className="flex gap-1.5 ml-auto">
            {[
              { id: 'price', label: 'Price' },
              { id: 'driveTime', label: 'Drive Time' },
              { id: 'distance', label: 'Distance' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                style={{
                  background: sortBy === s.id
                    ? `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`
                    : theme.chipBg,
                  color: sortBy === s.id ? '#0D2B5E' : theme.chipText,
                  border: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Summary */}
      {stations.length > 0 && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.mode === 'dark' ? 'rgba(46,204,113,0.3)' : 'rgba(39,174,96,0.2)'}`,
              boxShadow: theme.mode === 'dark' ? '0 0 12px rgba(46,204,113,0.08) inset' : '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Cheapest</p>
            <p className="text-2xl font-bold" style={{ color: theme.green }}>
              {cheapest ? (cheapest.price * 100).toFixed(1) : '\u2014'}
              <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
            </p>
            {cheapest && (
              <p className="text-[10px] mt-1 truncate" style={{ color: theme.textMuted }}>{cheapest.name}</p>
            )}
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Average</p>
            <p className="text-2xl font-bold" style={{ color: theme.gold }}>
              {(avgPrice * 100).toFixed(1)}
              <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
            </p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>You Could Save</p>
            <p className="text-2xl font-bold" style={{ color: theme.green }}>
              {savings}
              <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
            </p>
          </div>
          <div
            className="rounded-2xl p-4 text-center col-span-2 sm:col-span-1"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Stations Found</p>
            <p className="text-2xl font-bold" style={{ color: theme.text }}>{stations.length}</p>
          </div>
        </div>
      )}

      {/* Map */}
      <StationMap
        stations={stations}
        center={mapCenter}
        selectedStation={selectedStation}
        onStationSelect={setSelectedStation}
        onStationDetail={onStationDetail}
        type="fuel"
      />

      {/* Error */}
      {error && (
        <ErrorCard
          message={error}
          onRetry={() => {
            if (searchCoords) doSearch(searchCoords.lat, searchCoords.lng, fuelType);
          }}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      )}

      {/* Station Cards */}
      {!loading && sortedStations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedStations.map((station, i) => (
            <FuelStationCard
              key={station.id}
              station={station}
              rank={i}
              isSelected={selectedStation?.id === station.id}
              onClick={() => setSelectedStation(station)}
              onDetail={() => onStationDetail && onStationDetail(station)}
              sortBy={sortBy}
            />
          ))}
        </div>
      )}

      {/* Savings Calculator */}
      {!loading && stations.length > 0 && cheapest && (
        <SavingsCalculator
          cheapest={cheapest.price * 100}
          average={avgPrice * 100}
        />
      )}

      {/* EV Cross-Promotion Banner */}
      {!loading && stations.length > 0 && (
        <div
          className="rounded-2xl p-5 cursor-pointer"
          onClick={onSwitchToEV}
          style={{
            background: theme.mode === 'dark' ? 'rgba(46,204,113,0.06)' : 'rgba(39,174,96,0.04)',
            border: `1px solid ${theme.mode === 'dark' ? 'rgba(46,204,113,0.2)' : 'rgba(39,174,96,0.15)'}`,
            transition: 'all 0.25s ease',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚡</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: theme.green }}>
                Switch to Electric?
              </p>
              <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                There are EV charging stations near this area. Save up to 60% on fuel costs by going electric.
              </p>
            </div>
            <span className="text-sm font-semibold" style={{ color: theme.green }}>
              Find Chargers →
            </span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && stations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">&#x26FD;</div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
            Find cheap fuel near you
          </h3>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Select a fuel type and search your location to compare prices
          </p>
        </div>
      )}
    </div>
  );
}
