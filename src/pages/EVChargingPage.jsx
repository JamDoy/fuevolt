import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import StationMap from '../components/StationMap';
import EVStationCard from '../components/EVStationCard';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import EVCostEstimator from '../components/EVCostEstimator';
import ExpandHandle from '../components/ExpandHandle';
import { fetchEVStations, geocodeLocation, getUserLocation } from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { reverseGeocode, getDriveTimes } from '../utils/tomtom';
import { injectEVStationSchema, POPULAR_SUBURBS } from '../utils/seo';
import ShareMenu from '../components/ShareMenu';
import { buildEVSearchShareUrl } from '../utils/shareLinks';
import AdvancedSearchPanel from '../components/AdvancedSearchPanel';
import { buildAdvancedSearchSummary } from '../utils/advancedSearch';

const EV_SORT_OPTIONS = [
  { id: 'distance', label: 'Nearest' },
  { id: 'driveTime', label: 'Drive Time' },
];

const CONNECTOR_FILTERS = [
  { id: 'Type 2', label: 'Type 2', color: '#3B82F6', icon: 'plug' },
  { id: 'CCS', label: 'CCS', color: '#22C55E', icon: 'plug' },
  { id: 'CHAdeMO', label: 'CHAdeMO', color: '#A855F7', icon: 'plug' },
  { id: 'Tesla', label: 'Tesla', color: '#CC0000', icon: 'plug' },
  { id: 'Type 1', label: 'Type 1', color: '#F59E0B', activeText: '#422006', icon: 'plug' },
];
const SPEED_FILTERS = [
  { id: 'slow', label: '≤7kW (Slow)', max: 7, color: '#3B82F6', icon: 'bolt' },
  { id: 'fast', label: '7-50kW (Fast)', min: 7, max: 50, color: '#22C55E', icon: 'bolt' },
  { id: 'ultra', label: '50kW+ (Ultra-Rapid)', min: 50, color: '#F59E0B', activeText: '#422006', icon: 'bolt' },
];

export default function EVChargingPage({ initialSuburb, initialSearch, onStationDetail }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [connectorFilters, setConnectorFilters] = useState([]);
  const [speedFilters, setSpeedFilters] = useState([]);
  const [sortBy, setSortBy] = useState('distance');
  const [locationName, setLocationName] = useState(initialSuburb?.name || '');
  const [searchLabel, setSearchLabel] = useState(initialSuburb?.name || '');
  const [searchRadius, setSearchRadius] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const [cardsExpanded, setCardsExpanded] = useState(() => {
    try {
      return sessionStorage.getItem('fuevolt_cards_expanded') === 'true';
    } catch {
      return false;
    }
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [includeBrands, setIncludeBrands] = useState([]);
  const [excludeBrands, setExcludeBrands] = useState([]);
  const { theme } = useTheme();
  const autoLocation = useAutoLocation();
  const extraCardsRef = useRef(null);

  const doSearch = async (lat, lng, radius = 10, label = '') => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    setCardsExpanded(false);
    try {
      sessionStorage.removeItem('fuevolt_cards_expanded');
    } catch {
      // sessionStorage may be unavailable in restricted browser modes.
    }
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

      // Fetch drive times in background — same Matrix Routing pattern the
      // Fuel Prices page uses, just remapped to OCM's nested AddressInfo
      // coordinates instead of the flat lat/lng fuel stations use.
      getDriveTimes(lat, lng, data.map((s) => ({ latitude: s.AddressInfo?.Latitude, longitude: s.AddressInfo?.Longitude }))).then((times) => {
        if (!times) return;
        setStations((prev) =>
          prev.map((s, i) => ({
            ...s,
            driveTime: times[i]?.driveTimeMin || null,
            trafficDelay: times[i]?.trafficDelayMin || null,
          }))
        );
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
      } else if (Number.isFinite(initialSearch?.lat) && Number.isFinite(initialSearch?.lng)) {
        doSearch(initialSearch.lat, initialSearch.lng, 10, initialSearch.label || '');
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

  const toggleCardsExpanded = () => {
    setCardsExpanded((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('fuevolt_cards_expanded', String(next));
      } catch {
        // sessionStorage may be unavailable in restricted browser modes.
      }
      return next;
    });
  };

  useEffect(() => {
    if (cardsExpanded && extraCardsRef.current) {
      extraCardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [cardsExpanded]);

  const getMaxPower = (station) => {
    if (!station.Connections) return 0;
    return Math.max(...station.Connections.map((c) => c.PowerKW || 0));
  };

  // Open Charge Map leaves the operator field literally set to "(Unknown
  // Operator)" for stations with no listed network — relabel that to match
  // the Fuel page's "Independent" for stations with no listed brand.
  const getEVBrand = (station) => {
    const title = station.OperatorInfo?.Title;
    if (!title || /unknown operator/i.test(title)) return 'Independent';
    return title;
  };

  const availableBrands = [...new Set(stations.map((s) => getEVBrand(s)))].sort();

  const advancedSearchSummary = buildAdvancedSearchSummary({
    sortOptions: EV_SORT_OPTIONS,
    sortBy,
    radius: searchRadius,
    includeBrands,
    excludeBrands,
  });

  const filtered = stations.filter((s) => {
    const brand = getEVBrand(s);
    if (includeBrands.length > 0 && !includeBrands.includes(brand)) return false;
    if (excludeBrands.includes(brand)) return false;
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

  const sortedFiltered = [...filtered].sort((a, b) => {
    if (sortBy === 'driveTime') {
      if (a.driveTime == null && b.driveTime == null) return (a.AddressInfo?.Distance ?? 999) - (b.AddressInfo?.Distance ?? 999);
      if (a.driveTime == null) return 1;
      if (b.driveTime == null) return -1;
      return a.driveTime - b.driveTime;
    }
    return (a.AddressInfo?.Distance ?? 999) - (b.AddressInfo?.Distance ?? 999);
  });

  const VISIBLE_CARD_COUNT = 4;
  const primaryStations = sortedFiltered.slice(0, VISIBLE_CARD_COUNT);
  const extraStations = sortedFiltered.slice(VISIBLE_CARD_COUNT);

  const nearestCity = mapCenter
    ? POPULAR_SUBURBS.ev.reduce((nearest, city) => {
        const distance = Math.hypot(city.lat - mapCenter[0], city.lng - mapCenter[1]);
        return !nearest || distance < nearest.distance ? { ...city, distance } : nearest;
      }, null)
    : POPULAR_SUBURBS.ev[0];

  const clearFilters = () => {
    setConnectorFilters([]);
    setSpeedFilters([]);
    setIncludeBrands([]);
    setExcludeBrands([]);
  };

  const distanceRankedStations = [...filtered].sort(
    (a, b) => (a.AddressInfo?.Distance ?? Infinity) - (b.AddressInfo?.Distance ?? Infinity)
  );

  const openStationDetail = (station) => {
    const rankIndex = distanceRankedStations.findIndex((s) => s.ID === station.ID);
    const nearby = distanceRankedStations
      .filter((s) => s.ID !== station.ID && (s.AddressInfo?.Distance ?? Infinity) <= 5)
      .slice(0, 3);

    setSelectedStation(station);
    onStationDetail?.({
      ...station,
      resultRank: rankIndex >= 0 ? rankIndex + 1 : null,
      resultTotal: distanceRankedStations.length,
      resultSuburb: locationName || searchLabel || initialSuburb?.name || '',
      resultAlternatives: nearby,
    });
  };

  const retryWithWiderRadius = () => {
    if (!mapCenter) return;
    setSearchRadius(30);
    doSearch(mapCenter[0], mapCenter[1], 30, locationName || searchLabel);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Compact header — search and results are the focus of the page */}
      <div className="text-center mb-1">
        <h1 className="text-base font-semibold" style={{ color: theme.textSecondary }}>
          {initialSuburb ? `EV Charging Stations in ${initialSuburb.name}` : 'EV Charging Stations'}
        </h1>
      </div>

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        loading={loading}
        placeholder="Search suburb, city or postcode..."
        inputId="ev-location-search"
      />

      {/* Screen-reader announcement of search state */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading
          ? `Searching for EV chargers near ${locationName || 'your area'}...`
          : hasSearched
            ? `${stations.length} charging station${stations.length === 1 ? '' : 's'} found.`
            : ''}
      </p>

      {/* Advanced Search trigger + Location Name — the trigger stays visible
          even before a search so radius/sort/brand can be set up front. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowAdvancedSearch((v) => !v)}
            className="min-h-8 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1.5 flex-shrink-0 min-w-0"
            style={{ background: theme.chipBg, color: theme.text, border: `1px solid ${showAdvancedSearch ? theme.green : theme.chipBorder}` }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="9" cy="6" r="2" fill={theme.green} stroke="none" />
              <circle cx="15" cy="12" r="2" fill={theme.green} stroke="none" />
              <circle cx="7" cy="18" r="2" fill={theme.green} stroke="none" />
            </svg>
            <span className="flex-shrink-0">Advanced Search</span>
            <span className="truncate" style={{ color: theme.textMuted, fontWeight: 500 }}>
              · {advancedSearchSummary}
            </span>
            <svg
              width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transform: showAdvancedSearch ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {locationName && (
            <div className="flex items-center gap-2 min-w-0 flex-wrap sm:ml-auto">
              <p className="text-sm font-medium truncate min-w-0" style={{ color: theme.text }}>
                Showing chargers near <span style={{ color: theme.green }}>{locationName}</span>
              </p>
              {sortBy === 'distance' && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: theme.green + '22', color: theme.green }}
                >
                  Nearest to you
                </span>
              )}
              {mapCenter && (
                <ShareMenu
                  title="EV Charging Stations"
                  text={`Check out EV charging stations near ${locationName} on FueVolt`}
                  url={buildEVSearchShareUrl({ lat: mapCenter[0], lng: mapCenter[1], label: locationName })}
                  buttonClassName="cursor-pointer flex-shrink-0"
                  buttonStyle={{ background: 'none', border: 'none', color: theme.textMuted }}
                />
              )}
            </div>
          )}
      </div>

      {showAdvancedSearch && (
        <AdvancedSearchPanel
          accentColor={theme.green}
          accentTextColor="#FFFFFF"
          sortOptions={EV_SORT_OPTIONS}
          sortBy={sortBy}
          radius={searchRadius}
          brands={availableBrands}
          includeBrands={includeBrands}
          excludeBrands={excludeBrands}
          connectorOptions={CONNECTOR_FILTERS}
          connectorFilters={connectorFilters}
          speedOptions={SPEED_FILTERS}
          speedFilters={speedFilters}
          onApply={({ sortBy: newSort, radius: newRadius, includeBrands: newInclude, excludeBrands: newExclude, connectorFilters: newConnector, speedFilters: newSpeed }) => {
            setSortBy(newSort);
            setIncludeBrands(newInclude);
            setExcludeBrands(newExclude);
            setConnectorFilters(newConnector);
            setSpeedFilters(newSpeed);
            if (newRadius !== searchRadius) {
              setSearchRadius(newRadius);
              if (mapCenter) doSearch(mapCenter[0], mapCenter[1], newRadius, locationName || searchLabel);
            }
            setShowAdvancedSearch(false);
          }}
        />
      )}

      {/* Map */}
      <StationMap
        stations={filtered}
        center={mapCenter}
        selectedStation={selectedStation}
        onStationSelect={openStationDetail}
        type="ev"
        userLocation={autoLocation}
        onSearchArea={(lat, lng) => doSearch(lat, lng, searchRadius, 'this map area')}
      />

      {/* Results Count */}
      {!loading && stations.length > 0 && (
        <p className="text-xs" style={{ color: theme.textSecondary }}>
          Showing {filtered.length} of {stations.length} stations
          {connectorFilters.length > 0 || speedFilters.length > 0 || includeBrands.length > 0 || excludeBrands.length > 0 ? ' (filtered)' : ''}
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
        <div style={{ marginTop: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {primaryStations.map((station) => (
                <EVStationCard
                  key={station.ID}
                  station={station}
                  isSelected={selectedStation?.ID === station.ID}
                  onClick={() => openStationDetail(station)}
                  sortBy={sortBy}
                />
              ))}
            </div>
            {!cardsExpanded && extraStations.length > 0 && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '48px',
                  background: `linear-gradient(to bottom, rgba(${theme.mode === 'dark' ? '10,22,40' : '249,250,251'},0) 0%, rgba(${theme.mode === 'dark' ? '10,22,40' : '249,250,251'},0.85) 60%, rgba(${theme.mode === 'dark' ? '10,22,40' : '249,250,251'},1) 100%)`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>

          {extraStations.length > 0 && (
            <>
              <div
                ref={extraCardsRef}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3"
                style={{
                  maxHeight: cardsExpanded ? '6000px' : '0px',
                  opacity: cardsExpanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 400ms ease, opacity 300ms ease',
                }}
              >
                {extraStations.map((station) => (
                  <EVStationCard
                    key={station.ID}
                    station={station}
                    isSelected={selectedStation?.ID === station.ID}
                    onClick={() => openStationDetail(station)}
                    sortBy={sortBy}
                  />
                ))}
              </div>

              <ExpandHandle
                expanded={cardsExpanded}
                hiddenCount={extraStations.length}
                onClick={toggleCardsExpanded}
                theme={theme}
              />
            </>
          )}
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
