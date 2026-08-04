import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import StationMap from '../components/StationMap';
import FuelStationCard from '../components/FuelStationCard';
import ShimmerCard from '../components/ShimmerCard';
import ErrorCard from '../components/ErrorCard';
import SavingsCalculator from '../components/SavingsCalculator';
import AdUnit from '../components/AdUnit';
import { fetchFuelPrices, geocodeLocation, getUserLocation, geocodeStationAddresses } from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { getDriveTimes, reverseGeocode } from '../utils/tomtom';
import { injectFuelStationSchema, POPULAR_SUBURBS } from '../utils/seo';
import { getPriceContext, getPriceFreshness } from '../utils/priceFreshness';
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
  onSwitchToEV,
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
  const { theme } = useTheme();
  const autoLocation = useAutoLocation();

  const doSearch = async (lat, lng, type, radius = 10, label = '') => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
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
        {cityContent?.intro && (
          <p className="text-xs mt-2 max-w-xl mx-auto" style={{ color: theme.textMuted }}>
            {cityContent.intro}
          </p>
        )}
      </div>

      {/* Fuel Type Selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        {orderedFuelTypes.map((ft) => (
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
                className="min-h-11 px-4 py-2.5 rounded-full text-sm font-semibold cursor-pointer"
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

      {/* Cheapest Station Highlight */}
      {stations.length > 0 && !loading && cheapest && (
        <div
          key={cheapest.id}
          className="rounded-2xl p-5 cursor-pointer"
          onClick={() => openStationDetail(cheapest)}
          style={{
            background: theme.mode === 'dark' ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.04)',
            border: `2px solid ${theme.mode === 'dark' ? 'rgba(46,204,113,0.4)' : 'rgba(39,174,96,0.3)'}`,
            boxShadow: theme.mode === 'dark' ? '0 0 16px rgba(46,204,113,0.1)' : '0 4px 12px rgba(39,174,96,0.08)',
            transition: 'all 0.25s ease',
            animation: 'cheapestFoundPulse 900ms ease-out',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.green }}>Cheapest Near You</p>
              <h3 className="text-base sm:text-lg font-bold" style={{ color: theme.text }}>{cheapest.name}</h3>
              <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{cheapest.brand} &bull; {cheapest.distance} km away</p>
            </div>
            <div className="text-right">
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: theme.gold }}>
                <CountUpPrice value={cheapest.price * 100} />
                <span className="text-sm ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
              </p>
              <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                <PriceContextBadge context={getPriceContext(cheapest.price, avgPrice)} theme={theme} />
                {cheapestFreshness?.isOutdated && <OutdatedBadge />}
              </div>
              {cheapestFreshness?.checkedLabel && (
                <p className="text-[11px] mt-1" style={{ color: theme.textMuted }}>{cheapestFreshness.checkedLabel}</p>
              )}
              <p className="text-[11px]" style={{ color: theme.textMuted }}>{cheapestFreshness?.label}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: theme.green }}>View Details &rarr;</p>
            </div>
          </div>
        </div>
      )}

      {/* Price Summary */}
      {stations.length > 0 && !loading && (
        <div className="grid grid-cols-3 gap-3">
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
            className="rounded-2xl p-4 text-center"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Most Expensive</p>
            <p className="text-2xl font-bold" style={{ color: '#E74C3C' }}>
              {expensive ? (expensive.price * 100).toFixed(1) : '\u2014'}
              <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sortedStations.map((station, i) => (
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
            FueVolt covers fuel stations across New South Wales, Victoria, Queensland, and Western Australia. This includes major cities like Sydney, Melbourne, Brisbane, Perth, Gold Coast, Newcastle, Canberra, Geelong, and Wollongong, as well as regional and rural areas throughout these states.
          </p>
        </div>
      )}

      <AdUnit />

      <style>{`
        @keyframes cheapestFoundPulse {
          0% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); transform: scale(1); }
          35% { box-shadow: 0 0 28px rgba(255, 215, 0, 0.6); transform: scale(1.015); }
          100% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function CountUpPrice({ value }) {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    const from = displayRef.current;
    const to = value;
    if (!Number.isFinite(to) || from === to) return undefined;

    const duration = 700;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (to - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return display.toFixed(1);
}

function PriceContextBadge({ context, theme }) {
  if (!context) return null;
  const styles = {
    below: { label: 'Below average', background: 'rgba(39,174,96,0.14)', color: theme.green },
    about: { label: 'About average', background: 'rgba(255,215,0,0.14)', color: theme.gold },
    above: { label: 'Above average', background: 'rgba(231,76,60,0.14)', color: '#E74C3C' },
  };
  const style = styles[context];

  return (
    <span className="px-2 py-1 rounded-full text-[11px] font-bold" style={{ background: style.background, color: style.color }}>
      {style.label}
    </span>
  );
}

function OutdatedBadge() {
  return (
    <span className="px-2 py-1 rounded-full text-[11px] font-bold" style={{ background: 'rgba(231,76,60,0.14)', color: '#E74C3C' }}>
      Data check is over 2 hours old
    </span>
  );
}
