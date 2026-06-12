import { useState, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import StationMap from '../components/StationMap';
import FuelStationCard from '../components/FuelStationCard';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import { fetchFuelPrices, geocodeLocation, getUserLocation } from '../utils/api';

const FUEL_TYPES = [
  { id: 'E10', label: 'E10' },
  { id: 'U91', label: 'Unleaded 91' },
  { id: 'U95', label: 'Premium 95' },
  { id: 'U98', label: 'Premium 98' },
  { id: 'Diesel', label: 'Diesel' },
  { id: 'LPG', label: 'LPG' },
];

export default function FuelPricePage({ initialFuelType = 'U91' }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [fuelType, setFuelType] = useState(initialFuelType);
  const [searchCoords, setSearchCoords] = useState(null);

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

  const cheapest = stations.length > 0 ? stations[0] : null;
  const avgPrice = stations.length > 0
    ? stations.reduce((sum, s) => sum + s.price, 0) / stations.length
    : 0;
  const expensive = stations.length > 0 ? stations[stations.length - 1] : null;
  const savings = cheapest && expensive
    ? ((expensive.price - cheapest.price) * 100).toFixed(1)
    : '0';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Hero */}
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#FFD700' }}>
          ⛽ Compare Fuel Prices
        </h1>
        <p className="text-sm text-gray-400 mt-1">
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
                    background: 'linear-gradient(135deg, #2ECC71, #27AE60)',
                    color: '#FFFFFF',
                    boxShadow: '0 0 12px rgba(46, 204, 113, 0.3)',
                  }
                : {
                    background: 'rgba(255,255,255,0.08)',
                    color: '#9CA3AF',
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

      {/* Price Summary */}
      {stations.length > 0 && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: '#0D2B5E',
              border: '1px solid rgba(46,204,113,0.3)',
              boxShadow: '0 0 12px rgba(46,204,113,0.08) inset',
            }}
          >
            <p className="text-xs text-gray-400 mb-1">Cheapest</p>
            <p className="text-2xl font-bold" style={{ color: '#2ECC71' }}>
              {cheapest ? (cheapest.price * 100).toFixed(1) : '—'}
              <span className="text-xs text-gray-400 ml-0.5">¢/L</span>
            </p>
            {cheapest && (
              <p className="text-[10px] text-gray-500 mt-1 truncate">{cheapest.name}</p>
            )}
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: '#0D2B5E',
              border: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            <p className="text-xs text-gray-400 mb-1">Average</p>
            <p className="text-2xl font-bold" style={{ color: '#FFD700' }}>
              {(avgPrice * 100).toFixed(1)}
              <span className="text-xs text-gray-400 ml-0.5">¢/L</span>
            </p>
          </div>
          <div
            className="rounded-2xl p-4 text-center"
            style={{
              background: '#0D2B5E',
              border: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            <p className="text-xs text-gray-400 mb-1">You Could Save</p>
            <p className="text-2xl font-bold" style={{ color: '#2ECC71' }}>
              {savings}
              <span className="text-xs text-gray-400 ml-0.5">¢/L</span>
            </p>
          </div>
          <div
            className="rounded-2xl p-4 text-center col-span-2 sm:col-span-1"
            style={{
              background: '#0D2B5E',
              border: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            <p className="text-xs text-gray-400 mb-1">Stations Found</p>
            <p className="text-2xl font-bold text-white">{stations.length}</p>
          </div>
        </div>
      )}

      {/* Map */}
      <StationMap
        stations={stations}
        center={mapCenter}
        selectedStation={selectedStation}
        onStationSelect={setSelectedStation}
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
      {!loading && stations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stations.map((station, i) => (
            <FuelStationCard
              key={station.id}
              station={station}
              rank={i}
              isSelected={selectedStation?.id === station.id}
              onClick={() => setSelectedStation(station)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && stations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">⛽</div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Find cheap fuel near you
          </h3>
          <p className="text-sm text-gray-400">
            Select a fuel type and search your location to compare prices
          </p>
        </div>
      )}
    </div>
  );
}
