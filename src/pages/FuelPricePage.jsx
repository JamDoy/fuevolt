import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import StationMap from '../components/StationMap';
import FuelStationCard from '../components/FuelStationCard';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import SavingsCalculator from '../components/SavingsCalculator';
import AdUnit from '../components/AdUnit';
import FuelReminderCard from '../components/FuelReminderCard';
import HeroResultCard, { HeroResultCardSkeleton } from '../components/HeroResultCard';
import { fetchFuelPrices, geocodeLocation, getUserLocation, geocodeStationAddresses } from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { getDriveTimes, reverseGeocode } from '../utils/tomtom';
import { injectFuelStationSchema, POPULAR_SUBURBS } from '../utils/seo';
import { getPriceFreshness } from '../utils/priceFreshness';
import { FUEL_CITY_CONTENT } from '../data/cityContent';

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

  const cityContent = initialSuburb?.slug ? FUEL_CITY_CONTENT[initialSuburb.slug] : null;

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

  const openStationDetail = (station) => {
    onStationDetail?.({ ...station, resultAveragePrice: avgPrice });
  };

  const retryWithWiderRadius = () => {
    if (!searchCoords) return;
    setSearchRadius(30);
    doSearch(searchCoords.lat, searchCoords.lng, fuelType, 30, locationName || searchLabel);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Hero */}
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.gold }}>
          &#x26FD; {initialSuburb ? `Fuel Prices in ${initialSuburb.name}` : 'Compare Fuel Prices'}
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          Find the cheapest fuel near you across Australia
        </p>
      </div>

      {/* Fuel Type Selector */}
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

      {/* Cheapest Result Hero Card — full-page blur takeover, shrinks to a compact bar on dismiss */}
      {stations.length > 0 && !loading && cheapest && (
        <HeroResultCard
          key={`${cheapest.id}-${resultsVersion}`}
          cheapest={cheapest}
          avgPrice={avgPrice}
          freshness={cheapestFreshness}
          onDetail={() => openStationDetail(cheapest)}
        />
      )}
      {loading && hasSearched && <HeroResultCardSkeleton theme={theme} />}

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        onUseLocation={handleUseLocation}
        loading={loading}
        placeholder="Search suburb, city or postcode..."
        inputId="fuel-location-search"
      />

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
            <p className="text-sm font-medium" style={{ color: theme.text }}>
              Showing results near <span style={{ color: theme.gold }}>{locationName}</span>
            </p>
          )}
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto overflow-x-auto pb-1">
            {[
              { id: 'price', label: 'Cheapest' },
              { id: 'distance', label: 'Nearest' },
              { id: 'driveTime', label: 'Drive Time' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                className="min-h-9 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
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

      {/* Price Summary */}
      {stations.length > 0 && !loading && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div
            className="rounded-2xl p-2 sm:p-4 text-center min-w-0"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Average</p>
            <p className="text-lg sm:text-2xl font-bold whitespace-nowrap" style={{ color: theme.gold }}>
              {(avgPrice * 100).toFixed(1)}
              <span className="text-[11px] ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
            </p>
          </div>
          <div
            className="rounded-2xl p-2 sm:p-4 text-center min-w-0"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>You Could Save</p>
            <p className="text-lg sm:text-2xl font-bold whitespace-nowrap" style={{ color: theme.green }}>
              {savings}
              <span className="text-[11px] ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
            </p>
          </div>
          <div
            className="rounded-2xl p-2 sm:p-4 text-center min-w-0"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Most Expensive</p>
            <p className="text-lg sm:text-2xl font-bold whitespace-nowrap" style={{ color: '#E74C3C' }}>
              {expensive ? (expensive.price * 100).toFixed(1) : '\u2014'}
              <span className="text-[11px] ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
            </p>
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
      {cityContent ? (
        <div
          className="rounded-2xl p-6 mt-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, backdropFilter: 'blur(12px)' }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: theme.gold }}>Fuel Prices in {initialSuburb.name}</h2>
          {cityContent.intro && (
            <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>{cityContent.intro}</p>
          )}
          {cityContent.suburbs && (
            <>
              <h3 className="text-sm font-semibold mb-2" style={{ color: theme.text }}>Suburbs &amp; Areas Covered</h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>{cityContent.suburbs}</p>
            </>
          )}
          {cityContent.trends && (
            <>
              <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: theme.text }}>Price Trends in {initialSuburb.name}</h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>{cityContent.trends}</p>
            </>
          )}
          {cityContent.tips && (
            <>
              <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: theme.text }}>Tips to Save on Fuel in {initialSuburb.name}</h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: theme.textSecondary }}>{cityContent.tips}</p>
            </>
          )}
          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
            FueVolt compares E10, Unleaded 91, Premium 95, Premium 98, Diesel and LPG in {initialSuburb.name} — see our <a href="/guides/fuel-types-explained" style={{ color: theme.gold }}>guide to fuel types</a> for which grade suits your car.
          </p>
        </div>
      ) : (
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
      )}

      <AdUnit />

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

function ExpandHandle({ expanded, hiddenCount, onClick, theme }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="w-full flex flex-col items-center gap-1.5 cursor-pointer"
      style={{
        background: 'none',
        border: 'none',
        padding: '12px 0 8px',
        minHeight: '44px',
      }}
    >
      <span style={{ width: '40px', height: '4px', borderRadius: '9999px', background: theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#D1D5DB' }} />
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.green}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 300ms ease' }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
      <span className="text-sm sm:text-[13px] font-semibold" style={{ color: theme.green, letterSpacing: '0.01em' }}>
        {expanded ? 'Show less' : `Show ${hiddenCount} more station${hiddenCount === 1 ? '' : 's'}`}
      </span>
    </button>
  );
}

