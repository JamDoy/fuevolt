import { useState, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import FilterChips from '../components/FilterChips';
import StationMap from '../components/StationMap';
import EVStationCard from '../components/EVStationCard';
import EVDetailPanel from '../components/EVDetailPanel';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import { fetchEVStations, geocodeLocation, getUserLocation } from '../utils/api';

const CONNECTOR_FILTERS = ['Type 2', 'CCS', 'CHAdeMO', 'Tesla', 'Type 1'];
const STATUS_FILTERS = ['Available', 'Offline'];

export default function EVChargingPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [detailStation, setDetailStation] = useState(null);
  const [connectorFilters, setConnectorFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);

  const doSearch = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEVStations({ latitude: lat, longitude: lng });
      setStations(data);
      setMapCenter([lat, lng]);
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
      await doSearch(geo.latitude, geo.longitude);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [doSearch]);

  const handleUseLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getUserLocation();
      await doSearch(pos.latitude, pos.longitude);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [doSearch]);

  const toggleConnector = (f) =>
    setConnectorFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const toggleStatus = (f) =>
    setStatusFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const filtered = stations.filter((s) => {
    if (connectorFilters.length > 0) {
      const connTypes = s.Connections?.map((c) => c.ConnectionType?.Title || '') || [];
      if (!connectorFilters.some((f) => connTypes.some((t) => t.includes(f)))) {
        return false;
      }
    }
    if (statusFilters.length > 0) {
      const st = s.StatusType?.Title || '';
      if (statusFilters.includes('Available') && !['Operational', 'Available'].includes(st)) {
        if (!statusFilters.includes('Offline')) return false;
      }
      if (statusFilters.includes('Offline') && !['Not Operational', 'Offline', 'Temporarily Unavailable'].includes(st)) {
        if (!statusFilters.includes('Available')) return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Hero Section */}
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#FFD700' }}>
          ⚡ Find EV Charging Stations
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Search thousands of EV charging points across Australia
        </p>
      </div>

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        loading={loading}
        placeholder="Search suburb, city or postcode..."
      />

      {/* Filters */}
      {stations.length > 0 && (
        <div className="space-y-2">
          <FilterChips
            label="Connector:"
            filters={CONNECTOR_FILTERS}
            activeFilters={connectorFilters}
            onToggle={toggleConnector}
          />
          <FilterChips
            label="Status:"
            filters={STATUS_FILTERS}
            activeFilters={statusFilters}
            onToggle={toggleStatus}
          />
        </div>
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
      />

      {/* Results Count */}
      {!loading && stations.length > 0 && (
        <p className="text-xs text-gray-400">
          Showing {filtered.length} of {stations.length} stations
        </p>
      )}

      {/* Error */}
      {error && (
        <ErrorCard
          message={error}
          onRetry={() => {
            if (mapCenter) doSearch(mapCenter[0], mapCenter[1]);
          }}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
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

      {/* Empty state */}
      {!loading && !error && stations.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔌</div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Find EV chargers near you
          </h3>
          <p className="text-sm text-gray-400">
            Search for a location or use your current position to get started
          </p>
        </div>
      )}

      {/* Detail Panel */}
      <EVDetailPanel
        station={detailStation}
        onClose={() => setDetailStation(null)}
      />
    </div>
  );
}
