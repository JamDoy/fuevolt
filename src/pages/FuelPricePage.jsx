import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import StationMap from '../components/StationMap';
import FuelStationCard from '../components/FuelStationCard';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import SavingsCalculator from '../components/SavingsCalculator';
import FuelReminderCard from '../components/FuelReminderCard';
import HeroResultCard, { HeroResultCardSkeleton } from '../components/HeroResultCard';
import ExpandHandle from '../components/ExpandHandle';
import { fetchFuelPrices, geocodeLocation, getUserLocation, geocodeStationAddresses } from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { getDriveTimes, reverseGeocode } from '../utils/tomtom';
import { injectFuelStationSchema, POPULAR_SUBURBS } from '../utils/seo';
import { getPriceFreshness } from '../utils/priceFreshness';
import ShareMenu from '../components/ShareMenu';
import { buildFuelSearchShareUrl } from '../utils/shareLinks';

const FUEL_TYPES = [
  { id: 'E10', label: 'E10' },
  { id: 'U91', label: 'Unleaded 91' },
  { id: 'Diesel', label: 'Diesel' },
  { id: 'U95', label: 'Premium 95' },
  { id: 'U98', label: 'Premium 98' },
  { id: 'LPG', label: 'LPG' },
];

export default function FuelPricePage({
  initialFuelType = 'U91',
  preferredFuelType,
  initialSearch,
  onStationDetail,
  onSharedStationOpened,
  initialSuburb,
}) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [fuelType, setFuelType] = useState(initialFuelType);
  const [searchCoords, setSearchCoords] = useState(null);
  const [sortBy, setSortBy] = useState('price');
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
  const [resultsVersion, setResultsVersion] = useState(0);
  const { theme } = useTheme();
  const autoLocation = useAutoLocation();
  const extraCardsRef = useRef(null);

  const doSearch = async (lat, lng, type, radius = 10, label = '') => {
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
      const data = await fetchFuelPrices({
        latitude: lat,
        longitude: lng,
        fuelType: type,
        radius,
      });
      setStations(data);
      setMapCenter([lat, lng]);
      setSearchCoords({ lat, lng });
      setResultsVersion((v) => v + 1);
      geocodeStationAddresses(data, (updated) => setStations(updated));

      // Inject structured data for SEO
      injectFuelStationSchema(data, label || null);

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
  };

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setLocationName(query);
    setSearchLabel(query);
    try {
      const geo = await geocodeLocation(query);
      await doSearch(geo.latitude, geo.longitude, fuelType, searchRadius, query);
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
      await doSearch(pos.latitude, pos.longitude, fuelType, searchRadius, 'your location');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (initialSuburb?.lat && initialSuburb?.lng) {
        doSearch(initialSuburb.lat, initialSuburb.lng, fuelType, 10, initialSuburb.name);
      } else if (Number.isFinite(initialSearch?.lat) && Number.isFinite(initialSearch?.lng)) {
        doSearch(initialSearch.lat, initialSearch.lng, initialSearch.fuelType || fuelType, 10, initialSearch.label || '');
      } else if (initialSearch?.query) {
        handleSearch(initialSearch.query);
      } else if (initialSearch?.useLocation) {
        handleUseLocation();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A shared station link carries the station id it wants opened — once the
  // live re-search above resolves, jump straight to that station (with its
  // current price, not whatever it was when the link was shared).
  const openedSharedStationRef = useRef(false);
  useEffect(() => {
    if (openedSharedStationRef.current) return;
    if (!initialSearch?.stationId || stations.length === 0) return;
    const match = stations.find((s) => s.id === initialSearch.stationId);
    if (match) {
      openedSharedStationRef.current = true;
      // Drop ?station= from this results entry before pushing the detail
      // view on top of it — otherwise "Back to results" pops back to a URL
      // that immediately re-opens the same station again instead of showing
      // the plain results list.
      window.history.replaceState(window.history.state, '', '/fuel-prices');
      // Also clear it from the App-level initialSearch state — if this page
      // remounts later (e.g. navigating back here after the auto-open),
      // the mount effect above would otherwise see the same stationId and
      // immediately reopen the station again instead of showing results.
      onSharedStationOpened?.();
      onStationDetail(match);
    }
  }, [stations, initialSearch, onStationDetail]);

  useEffect(() => {
    if (!autoLocation || initialSuburb || mapCenter || initialSearch) return undefined;
    const timer = window.setTimeout(() => {
      doSearch(autoLocation.latitude, autoLocation.longitude, fuelType, searchRadius, 'your location');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFuelTypeChange = (type) => {
    setFuelType(type);
    if (searchCoords) {
      doSearch(searchCoords.lat, searchCoords.lng, type, searchRadius, locationName);
    }
  };

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

  const orderedFuelTypes = [...FUEL_TYPES].sort((a, b) => {
    if (a.id === preferredFuelType) return -1;
    if (b.id === preferredFuelType) return 1;
    return 0;
  });

  const pricedStations = stations.filter((s) => s.price != null);

  const sortedStations = [...stations].sort((a, b) => {
    if (sortBy === 'driveTime') {
      if (a.driveTime == null && b.driveTime == null) return (a.price || 999) - (b.price || 999);
      if (a.driveTime == null) return 1;
      if (b.driveTime == null) return -1;
      return a.driveTime - b.driveTime;
    }
    if (sortBy === 'distance') return parseFloat(a.distance || 999) - parseFloat(b.distance || 999);
    if (a.price == null && b.price == null) return 0;
    if (a.price == null) return 1;
    if (b.price == null) return -1;
    return a.price - b.price;
  });

  const VISIBLE_CARD_COUNT = 4;
  const primaryStations = sortedStations.slice(0, VISIBLE_CARD_COUNT);
  const extraStations = sortedStations.slice(VISIBLE_CARD_COUNT);

  const cheapest = pricedStations.length > 0
    ? pricedStations.reduce((min, s) => (s.price < min.price ? s : min), pricedStations[0])
    : null;
  const avgPrice = pricedStations.length > 0
    ? pricedStations.reduce((sum, s) => sum + s.price, 0) / pricedStations.length
    : 0;
  const expensive = pricedStations.length > 0
    ? pricedStations.reduce((max, s) => (s.price > max.price ? s : max), pricedStations[0])
    : null;
  const savings = cheapest && expensive
    ? ((expensive.price - cheapest.price) * 100).toFixed(1)
    : '0';
  const cheapestFreshness = cheapest
    ? getPriceFreshness(cheapest.lastUpdated, cheapest.priceDate, cheapest.dataCheckedAt)
    : null;
  const nearestCity = searchCoords
    ? POPULAR_SUBURBS.fuel.reduce((nearest, city) => {
        const distance = Math.hypot(city.lat - searchCoords.lat, city.lng - searchCoords.lng);
        return !nearest || distance < nearest.distance ? { ...city, distance } : nearest;
      }, null)
    : POPULAR_SUBURBS.fuel[0];

  const priceRankedStations = [...pricedStations].sort((a, b) => a.price - b.price);

  const openStationDetail = (station) => {
    const rankIndex = priceRankedStations.findIndex((s) => s.id === station.id);
    const nearby = priceRankedStations
      .filter((s) => s.id !== station.id && parseFloat(s.distance) <= 5)
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);

    onStationDetail?.({
      ...station,
      resultAveragePrice: avgPrice,
      resultRank: rankIndex >= 0 ? rankIndex + 1 : null,
      resultTotal: priceRankedStations.length,
      resultSuburb: locationName || searchLabel || initialSuburb?.name || '',
      resultFuelType: fuelType,
      resultAlternatives: nearby,
    });
  };

  const retryWithWiderRadius = () => {
    if (!searchCoords) return;
    setSearchRadius(30);
    doSearch(searchCoords.lat, searchCoords.lng, fuelType, 30, locationName || searchLabel);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Compact header — the result below is the actual focus of the page */}
      <div className="text-center mb-1">
        <h1 className="text-base font-semibold" style={{ color: theme.textSecondary }}>
          {initialSuburb ? `Fuel Prices in ${initialSuburb.name}` : 'Compare Fuel Prices'}
        </h1>
      </div>

      {/* Controls — search + fuel type together in one compact row */}
      <div className="space-y-2">
        <SearchBar
          onSearch={handleSearch}
          onUseLocation={handleUseLocation}
          loading={loading}
          placeholder="Search suburb, city or postcode..."
          inputId="fuel-location-search"
        />
        <div className="flex flex-wrap gap-2 justify-center">
          {orderedFuelTypes.map((ft) => (
            <button
              key={ft.id}
              onClick={() => handleFuelTypeChange(ft.id)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer min-h-9"
              style={{
                transition: 'all 0.25s ease',
                border: 'none',
                ...(fuelType === ft.id
                  ? {
                      background: theme.green,
                      color: '#FFFFFF',
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
      </div>

      {/* Cheapest Result Hero Card — the focal point of the page. Full-page blur
          takeover on first load, shrinks to a compact bar on dismiss. */}
      {stations.length > 0 && !loading && cheapest && (
        <HeroResultCard
          key={`${cheapest.id}-${resultsVersion}`}
          cheapest={cheapest}
          avgPrice={avgPrice}
          savings={savings}
          freshness={cheapestFreshness}
          onDetail={() => openStationDetail(cheapest)}
        />
      )}
      {loading && hasSearched && <HeroResultCardSkeleton theme={theme} />}

      {/* Screen-reader announcement of search state */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading
          ? `Searching for fuel prices near ${searchLabel || locationName || 'your area'}...`
          : hasSearched
            ? `${stations.length} station${stations.length === 1 ? '' : 's'} found${cheapest ? `. Cheapest is ${cheapest.name} at ${(cheapest.price * 100).toFixed(1)} cents per litre` : ''}.`
            : ''}
      </p>

      {/* Location + Sort Controls */}
      {stations.length > 0 && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {locationName && (
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-xs font-medium truncate min-w-0" style={{ color: theme.textSecondary }}>
                Near <span style={{ color: theme.gold }}>{locationName}</span>
              </p>
              {searchCoords && (
                <ShareMenu
                  title="Fuel Prices"
                  text={`Check out fuel prices near ${locationName} on FueVolt`}
                  url={buildFuelSearchShareUrl({ lat: searchCoords.lat, lng: searchCoords.lng, fuelType, label: locationName })}
                  buttonClassName="cursor-pointer flex-shrink-0"
                  buttonStyle={{ background: 'none', border: 'none', color: theme.textMuted }}
                />
              )}
            </div>
          )}
          <div className="flex gap-1.5 w-full sm:w-auto sm:ml-auto overflow-x-auto pb-1">
            {[
              { id: 'price', label: 'Cheapest' },
              { id: 'distance', label: 'Nearest' },
              { id: 'driveTime', label: 'Drive Time' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className="min-h-7 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer"
                style={{
                  background: sortBy === s.id ? '#0D2B5E' : theme.chipBg,
                  color: sortBy === s.id ? '#FFFFFF' : theme.chipText,
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

      {/* Map */}
      <StationMap
        stations={stations}
        center={mapCenter}
        selectedStation={selectedStation}
        onStationSelect={setSelectedStation}
        onStationDetail={openStationDetail}
        type="fuel"
        userLocation={autoLocation}
        onSearchArea={(lat, lng) => doSearch(lat, lng, fuelType, searchRadius, 'this map area')}
        cheapestStationId={cheapest?.id}
      />

      {/* Error */}
      {error && (
        <ErrorCard
          message={error}
          onRetry={() => {
            if (searchCoords) doSearch(searchCoords.lat, searchCoords.lng, fuelType, searchRadius, locationName || searchLabel);
          }}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm font-medium text-center" style={{ color: theme.textSecondary }}>
            Finding the cheapest fuel near {searchLabel || locationName || 'your area'}...
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Station Cards */}
      {!loading && sortedStations.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ position: 'relative' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {primaryStations.map((station, i) => (
                <FuelStationCard
                  key={station.id}
                  station={station}
                  rank={i}
                  isSelected={selectedStation?.id === station.id}
                  onClick={() => setSelectedStation(station)}
                  onDetail={() => openStationDetail(station)}
                  sortBy={sortBy}
                  averagePrice={avgPrice}
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
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3"
                style={{
                  maxHeight: cardsExpanded ? '6000px' : '0px',
                  opacity: cardsExpanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 400ms ease, opacity 300ms ease',
                }}
              >
                {extraStations.map((station, i) => (
                  <FuelStationCard
                    key={station.id}
                    station={station}
                    rank={VISIBLE_CARD_COUNT + i}
                    isSelected={selectedStation?.id === station.id}
                    onClick={() => setSelectedStation(station)}
                    onDetail={() => openStationDetail(station)}
                    sortBy={sortBy}
                    averagePrice={avgPrice}
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

      {/* Savings Calculator */}
      {!loading && stations.length > 0 && cheapest && (
        <SavingsCalculator
          cheapest={cheapest.price * 100}
          average={avgPrice * 100}
        />
      )}

      {/* Fuel fill-up reminder — only after results have actually loaded */}
      {!loading && stations.length > 0 && <FuelReminderCard />}

      {/* Empty state */}
      {!loading && !error && stations.length === 0 && !hasSearched && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>Find cheap fuel near you</h3>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Select a fuel type and search your location to compare prices
          </p>
        </div>
      )}

      {!loading && !error && stations.length === 0 && hasSearched && (
        <div className="rounded-2xl p-6 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
          <h3 className="text-lg font-semibold" style={{ color: theme.text }}>No live prices found nearby</h3>
          <p className="text-sm mt-2" style={{ color: theme.textSecondary }}>
            Try one of these options to keep searching.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {searchCoords && searchRadius < 30 && (
              <button type="button" onClick={retryWithWiderRadius} className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: theme.chipBg, color: theme.text, border: `1px solid ${theme.chipBorder}` }}>
                Try a wider radius
              </button>
            )}
            <button type="button" onClick={() => document.getElementById('fuel-location-search')?.focus()} className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: theme.chipBg, color: theme.text, border: `1px solid ${theme.chipBorder}` }}>
              Try a different suburb
            </button>
            {nearestCity && (
              <a href={`/fuel-prices/${nearestCity.slug}`} className="min-h-11 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center no-underline" style={{ background: `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`, color: '#0D2B5E' }}>
                Browse {nearestCity.name}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Informational content for SEO and AdSense */}
      <div
        className="rounded-2xl p-6 mt-4"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, backdropFilter: 'blur(12px)' }}
      >
        <h2 className="text-base font-bold mb-3" style={{ color: theme.gold }}>How FueVolt Fuel Price Comparison Works</h2>
          <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
            FueVolt compares real-time fuel prices from official Australian government sources. Prices are updated throughout the day as fuel stations report changes, giving you the most accurate data available.
          </p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
            Search by suburb, postcode, or use your current location to find the cheapest E10, Unleaded 91, Premium 95, Premium 98, Diesel, and LPG near you. Results can be sorted by price (lowest first) or by drive time, so you can find the best value considering both fuel cost and travel distance.
          </p>
          <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: theme.text }}>Understanding Fuel Price Cycles</h3>
          <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
            Fuel prices in Australian capital cities follow predictable cycles, typically rising sharply over one to two days and then gradually falling over several weeks. The best time to fill up is at the bottom of the cycle when prices are lowest. FueVolt helps you spot these patterns by showing current prices from hundreds of stations in your area, making it easy to identify when prices are at their cheapest.
          </p>
          <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: theme.text }}>Coverage Across Australia</h3>
          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            FueVolt covers fuel stations across New South Wales, Victoria, Queensland, Western Australia and Tasmania. This includes major cities like Sydney, Melbourne, Brisbane, Perth, Gold Coast, Newcastle, Canberra, Geelong, Wollongong and Hobart, as well as regional and rural areas throughout these states.
        </p>
      </div>

      <style>{`
        @keyframes heroCardEntry {
          0% { opacity: 0; transform: scale(0.94); filter: blur(4px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        @keyframes heroGlowPulse {
          0% {
            box-shadow:
              0 0 0 1px rgba(34,197,94,0),
              0 0 0px rgba(34,197,94,0),
              0 20px 60px rgba(0,0,0,0.5);
          }
          60% {
            box-shadow:
              0 0 0 1px rgba(34,197,94,0.4),
              0 0 60px rgba(34,197,94,0.4),
              0 0 100px rgba(34,197,94,0.2),
              0 0 120px rgba(245,158,11,0.15),
              0 20px 60px rgba(0,0,0,0.5);
          }
          100% {
            box-shadow:
              0 0 0 1px rgba(34,197,94,0.2),
              0 0 24px rgba(34,197,94,0.25),
              0 0 48px rgba(34,197,94,0.12),
              0 0 80px rgba(245,158,11,0.08),
              0 20px 60px rgba(0,0,0,0.5);
          }
        }
        @keyframes heroCompactIn {
          0% { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .hero-view-details:hover { text-decoration: underline; }
        .hero-search-again:hover { color: rgba(255,255,255,0.6) !important; }
      `}</style>
    </div>
  );
}


