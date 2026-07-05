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
  { id: 'Diesel', label: 'Diesel' },
  { id: 'U95', label: 'Premium 95' },
  { id: 'U98', label: 'Premium 98' },
  { id: 'LPG', label: 'LPG' },
];

const CITY_DESCRIPTIONS = {
  sydney: 'Sydney drivers face some of the highest fuel prices in Australia due to high demand and limited competition in some suburbs. Use FueVolt to compare prices across the Greater Sydney area including Parramatta, Penrith, and the Northern Beaches.',
  melbourne: 'Melbourne follows a regular weekly fuel price cycle — prices typically peak mid-week and drop on Tuesdays. FueVolt helps you find the cheapest petrol across Melbourne suburbs from Dandenong to Footscray.',
  brisbane: 'Brisbane and South East Queensland fuel prices are sourced from official government data, giving you accurate real-time pricing for every servo in the region.',
  perth: 'Perth fuel prices are updated daily — stations are required to lock in their next-day price by 2pm. Check FueVolt to see tomorrow\'s prices today and plan your fill-up.',
  adelaide: 'Adelaide fuel prices can vary significantly between suburbs. Coverage for South Australia is coming soon — in the meantime, nearby stations in border regions may appear in searches.',
  'gold-coast': 'Gold Coast fuel prices benefit from QLD government transparency. Compare prices from Coolangatta to Helensvale and find the cheapest fuel for your coastal commute.',
  canberra: 'Canberra fuel prices tend to be higher than surrounding NSW regional areas. ACT coverage is coming soon — nearby NSW stations with live pricing are already available.',
  newcastle: 'Newcastle and the Hunter Valley region have real-time government fuel pricing. Compare prices across Charlestown, Maitland, and Lake Macquarie.',
  wollongong: 'Wollongong and the Illawarra region have real-time fuel pricing. Find cheap petrol from Helensburgh to Kiama.',
  hobart: 'Hobart and Tasmanian fuel prices — coverage is coming soon. Check back for real-time pricing data across the Apple Isle.',
  darwin: 'Darwin fuel prices are among the highest in Australia due to remote supply chains. NT coverage is coming soon.',
  geelong: 'Geelong has real-time government fuel pricing. Compare prices across Geelong, Bellarine Peninsula, and the Surf Coast.',
  toowoomba: 'Toowoomba has real-time government fuel pricing. Find the cheapest fuel in the Darling Downs region.',
  cairns: 'Cairns and Far North Queensland have real-time fuel pricing from official government sources. Compare prices from Smithfield to Edmonton.',
  ballarat: 'Ballarat has real-time government fuel pricing. Compare petrol and diesel across the Ballarat region.',
  bendigo: 'Bendigo has real-time government fuel pricing. Find cheap fuel across Greater Bendigo and the Goldfields region.',
  launceston: 'Launceston fuel prices — Tasmanian coverage is coming soon. We\'re working on bringing real-time pricing to Northern Tasmania.',
  'sunshine-coast': 'Sunshine Coast has real-time fuel pricing from official government sources. Compare prices from Caloundra to Noosa.',
  parramatta: 'Parramatta and Western Sydney have real-time government fuel pricing. Find the cheapest petrol in one of Sydney\'s busiest commuter regions.',
};

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
        {initialSuburb?.slug && CITY_DESCRIPTIONS[initialSuburb.slug] && (
          <p className="text-xs mt-2 max-w-xl mx-auto" style={{ color: theme.textMuted }}>
            {CITY_DESCRIPTIONS[initialSuburb.slug]}
          </p>
        )}
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

      {/* Cheapest Station Highlight */}
      {stations.length > 0 && !loading && cheapest && (
        <div
          className="rounded-2xl p-5 cursor-pointer"
          onClick={() => onStationDetail && onStationDetail(cheapest)}
          style={{
            background: theme.mode === 'dark' ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.04)',
            border: `2px solid ${theme.mode === 'dark' ? 'rgba(46,204,113,0.4)' : 'rgba(39,174,96,0.3)'}`,
            boxShadow: theme.mode === 'dark' ? '0 0 16px rgba(46,204,113,0.1)' : '0 4px 12px rgba(39,174,96,0.08)',
            transition: 'all 0.25s ease',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: theme.green }}>Cheapest Near You</p>
              <h3 className="text-base sm:text-lg font-bold" style={{ color: theme.text }}>{cheapest.name}</h3>
              <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{cheapest.brand} &bull; {cheapest.distance} km away</p>
            </div>
            <div className="text-right">
              <p className="text-3xl sm:text-4xl font-bold" style={{ color: theme.green }}>
                {(cheapest.price * 100).toFixed(1)}
                <span className="text-sm ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
              </p>
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
        onStationDetail={onStationDetail}
        type="fuel"
        userLocation={autoLocation}
        onSearchArea={(lat, lng) => doSearch(lat, lng, fuelType)}
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
          FueVolt covers fuel stations across New South Wales, Victoria, Queensland, and Western Australia. This includes major cities like Sydney, Melbourne, Brisbane, Perth, Gold Coast, Newcastle, Canberra, Geelong, and Wollongong, as well as regional and rural areas throughout these states.
        </p>
      </div>
    </div>
  );
}
