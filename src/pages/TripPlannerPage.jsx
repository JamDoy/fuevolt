import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import StationMap from '../components/StationMap';
import ShimmerCard from '../components/ShimmerCard';
import LocationInput from '../components/LocationInput';
import { geocodeLocation, fetchFuelPricesAlongRoute } from '../utils/api';
import useAutoLocation from '../hooks/useAutoLocation';
import { calculateRoute, calculateRouteWithStops, calculateEVRoute, searchAlongRoute, getTrafficIncidentsAlongRoute } from '../utils/tomtom';
import ShareMenu from '../components/ShareMenu';
import { buildTripShareUrl } from '../utils/shareLinks';
import FuelTypeSelector, { FUEL_TYPES } from '../components/FuelTypeSelector';

// A purely illustrative Sydney → Canberra route (real town coordinates, no
// live API call) shown in the empty state before a real trip is planned, so
// first-time visitors see what the finished map looks like.
const EXAMPLE_ROUTE_POINTS = [
  [-33.8688, 151.2093], // Sydney
  [-34.0710, 150.8142], // Campbelltown
  [-34.4504, 150.4477], // Mittagong
  [-34.7549, 149.7178], // Goulburn
  [-35.2809, 149.1300], // Canberra
];
const EXAMPLE_START = { latitude: -33.8688, longitude: 151.2093 };
const EXAMPLE_END = { latitude: -35.2809, longitude: 149.1300 };

export default function TripPlannerPage({ initialTrip }) {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [startQuery, setStartQuery] = useState(initialTrip?.start || '');
  const [endQuery, setEndQuery] = useState(initialTrip?.end || '');
  const [mode, setMode] = useState(initialTrip?.mode || 'car');
  const [initialTripPending, setInitialTripPending] = useState(!!initialTrip);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(null);
  const [evRoute, setEvRoute] = useState(null);
  const [fuelStops, setFuelStops] = useState([]);
  const [evStops, setEvStops] = useState([]);
  const [chargingPlan, setChargingPlan] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [batteryKWh, setBatteryKWh] = useState('60');
  const [currentCharge, setCurrentCharge] = useState('80');
  const [consumption, setConsumption] = useState('15');
  const [vehicleRange, setVehicleRange] = useState('400');
  const [fuelType, setFuelType] = useState('U91');
  const [trafficIncidents, setTrafficIncidents] = useState([]);
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [selectedStopIds, setSelectedStopIds] = useState(() => new Set());
  const [customRoute, setCustomRoute] = useState(null);
  const [customRouteStops, setCustomRouteStops] = useState([]);
  const [updatingRoute, setUpdatingRoute] = useState(false);
  const [routeUpdateError, setRouteUpdateError] = useState(null);
  const autoLocation = useAutoLocation();

  // Default map to user's location if permission already granted
  useEffect(() => {
    if (autoLocation && !mapCenter) {
      setMapCenter([autoLocation.latitude, autoLocation.longitude]);
    }
  }, [autoLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlanTrip = useCallback(async () => {
    if (!startQuery.trim() || !endQuery.trim()) {
      setError('Please enter both start and end locations');
      return;
    }
    setLoading(true);
    setError(null);
    setRoute(null);
    setEvRoute(null);
    setFuelStops([]);
    setEvStops([]);
    setChargingPlan([]);
    setTrafficIncidents([]);
    setSelectedStopIds(new Set());
    setCustomRoute(null);
    setCustomRouteStops([]);
    setRouteUpdateError(null);

    try {
      const [startGeo, endGeo] = await Promise.all([
        geocodeLocation(startQuery),
        geocodeLocation(endQuery),
      ]);

      setStartCoords({ latitude: startGeo.latitude, longitude: startGeo.longitude });
      setEndCoords({ latitude: endGeo.latitude, longitude: endGeo.longitude });

      const midLat = (startGeo.latitude + endGeo.latitude) / 2;
      const midLng = (startGeo.longitude + endGeo.longitude) / 2;
      setMapCenter([midLat, midLng]);

      const routeData = await calculateRoute(
        startGeo.latitude, startGeo.longitude,
        endGeo.latitude, endGeo.longitude
      );
      setRoute(routeData);

      if (routeData.points && routeData.points.length > 1) {
        getTrafficIncidentsAlongRoute(routeData.points).then(setTrafficIncidents).catch(() => {});
      }

      if (mode === 'ev') {
        const numBattery = Number(batteryKWh) || 60;
        const numCharge = Number(currentCharge) || 80;
        const numConsump = Number(consumption) || 15;
        const currentChargeKWh = numBattery * numCharge / 100;
        const ev = await calculateEVRoute(
          startGeo.latitude, startGeo.longitude,
          endGeo.latitude, endGeo.longitude,
          { batteryCapacityKWh: numBattery, currentChargeKWh, consumptionKWhPer100km: numConsump }
        );
        if (ev) setEvRoute(ev);

        // Search for EV chargers along the route
        if (routeData.points && routeData.points.length > 1) {
          const chargers = await searchAlongRoute(routeData.points, '7309', 1);
          setEvStops(chargers);

          // Build charging plan based on vehicle range
          const distKm = parseFloat(routeData.distanceKm);
          const numRange = Number(vehicleRange) || 400;
          const rangeKm = numRange * (numCharge / 100);
          if (distKm > rangeKm) {
            const plan = buildChargingPlan(routeData.points, chargers, rangeKm, numRange, distKm);
            setChargingPlan(plan);
          }
        }
      } else {
        // Search for fuel stations along the route — real government prices
        // where available, same feeds the main Fuel Prices page uses, not
        // just bare locations from TomTom's place database. Returns every
        // station within 1km of the actual route path.
        if (routeData.points && routeData.points.length > 1) {
          const stations = await fetchFuelPricesAlongRoute(routeData.points, fuelType, 1);
          setFuelStops(stations);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  }, [startQuery, endQuery, mode, batteryKWh, currentCharge, consumption, vehicleRange, fuelType]);

  // A shared trip link seeds start/end/mode above (via useState initializers)
  // then triggers the same calculation a manual "Plan Trip" click would —
  // recalculated live rather than replaying a stale saved route.
  useEffect(() => {
    if (!initialTripPending) return;
    setInitialTripPending(false);
    handlePlanTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routePoints = route?.points || evRoute?.points || null;

  // Only surface an incident when it's a genuine major delay or disruption
  // — a closure, accident, dangerous conditions or flooding, or any
  // incident adding 10+ minutes — rather than every minor slowdown TomTom
  // reports along the route.
  const MAJOR_INCIDENT_CATEGORIES = new Set([1, 3, 8, 11]); // Accident, Dangerous Conditions, Road Closed, Flooding
  const majorTrafficIncidents = trafficIncidents.filter(
    (inc) => inc.delay >= 10 || MAJOR_INCIDENT_CATEGORIES.has(inc.category)
  );

  // Convert stops to map-compatible format. EV chargers have no price
  // concept; fuel stops now carry real government pricing where available.
  const mapStops = (mode === 'ev' ? evStops : fuelStops).map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    price: mode === 'ev' ? null : (s.price ?? null),
    distance: s.distance,
  }));

  // Charging plan markers
  const chargingMarkers = chargingPlan.map((stop) => ({
    id: `charge-${stop.index}`,
    name: stop.name,
    address: stop.address,
    latitude: stop.latitude,
    longitude: stop.longitude,
    price: null,
    distance: stop.distanceAlongRoute,
  }));

  const allMapStops = [...mapStops, ...chargingMarkers.filter((cm) => !mapStops.some((ms) => ms.id === cm.id))];

  // Stops available to pick a detour from in the current mode — fuel
  // stations or EV chargers along the route.
  const activeStops = mode === 'ev' ? evStops : fuelStops;
  const fuelTypeLabel = FUEL_TYPES.find((f) => f.id === fuelType)?.label || fuelType;

  // Stop detour selection — the driver taps stations/chargers on the map
  // (or their list card) to mark them as stops, then "Update Route"
  // recalculates the route through just those stops.
  const toggleStopSelection = useCallback((station) => {
    if (!station?.id) return;
    setSelectedStopIds((prev) => {
      const next = new Set(prev);
      if (next.has(station.id)) next.delete(station.id);
      else next.add(station.id);
      return next;
    });
  }, []);

  // Selected stations, ordered by where they actually fall along the route
  // (nearest route point index) rather than click order, so the recalculated
  // route visits them in a sensible sequence.
  const orderedSelectedStops = activeStops
    .filter((s) => selectedStopIds.has(s.id))
    .map((s) => {
      let nearestIdx = 0;
      if (routePoints?.length) {
        let best = Infinity;
        routePoints.forEach((p, i) => {
          const d = haversine(p, [s.latitude, s.longitude]);
          if (d < best) { best = d; nearestIdx = i; }
        });
      }
      return { ...s, _routeIdx: nearestIdx };
    })
    .sort((a, b) => a._routeIdx - b._routeIdx);

  const handleUpdateRoute = useCallback(async () => {
    if (!startCoords || !endCoords || orderedSelectedStops.length === 0) return;
    setUpdatingRoute(true);
    setRouteUpdateError(null);
    try {
      const data = await calculateRouteWithStops(
        startCoords.latitude, startCoords.longitude,
        orderedSelectedStops, endCoords.latitude, endCoords.longitude
      );
      setCustomRoute(data);
      setCustomRouteStops(orderedSelectedStops);
    } catch (err) {
      setRouteUpdateError(err.message || 'Failed to update route with selected stops');
    } finally {
      setUpdatingRoute(false);
    }
  }, [startCoords, endCoords, orderedSelectedStops]);

  const handleClearStops = useCallback(() => {
    setSelectedStopIds(new Set());
    setCustomRoute(null);
    setCustomRouteStops([]);
    setRouteUpdateError(null);
  }, []);

  // Switching between Fuel Vehicle and Electric Vehicle clears any stop
  // selection — a selected fuel station's id has no meaning against the EV
  // charger list (and vice versa), so carrying it over left the "Update
  // Route" button stuck showing a stale, unmatched selection.
  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setSelectedStopIds(new Set());
    setCustomRoute(null);
    setCustomRouteStops([]);
    setRouteUpdateError(null);
  }, []);

  // The route actually shown/used once a detour route has been applied.
  const displayRoute = customRoute || route;
  const displayRoutePoints = customRoute?.points || routePoints;
  const displayStations = customRoute ? customRouteStops : allMapStops;
  const stopsNeedUpdate = selectedStopIds.size > 0
    && (!customRoute || customRouteStops.length !== selectedStopIds.size
      || !customRouteStops.every((s) => selectedStopIds.has(s.id)));
  // Whether the top button should act as "Update Route" instead of "Plan My Trip"
  const hasStopSelection = selectedStopIds.size > 0 || !!customRoute;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="text-center mb-1">
        <h1 className="text-base font-semibold" style={{ color: theme.textSecondary }}>
          Trip Planner
        </h1>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        {[
          { id: 'car', label: 'Fuel Vehicle', color: theme.gold },
          { id: 'ev', label: 'Electric Vehicle', color: theme.green },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className="px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              background: mode === m.id
                ? `linear-gradient(135deg, ${m.color}, ${m.id === 'car' ? theme.goldDark : theme.greenDark})`
                : theme.chipBg,
              color: mode === m.id ? (m.id === 'car' ? '#0D2B5E' : '#fff') : theme.chipText,
              border: 'none',
              transition: 'all 0.25s ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Route inputs */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LocationInput
            label="Start"
            value={startQuery}
            onChange={setStartQuery}
            placeholder="e.g. Sydney CBD"
          />
          <LocationInput
            label="End"
            value={endQuery}
            onChange={setEndQuery}
            placeholder="e.g. Melbourne"
          />
        </div>

        {/* Fuel type — which fuel to search for the cheapest stations along the route */}
        {mode === 'car' && (
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: theme.textSecondary }}>Fuel Type</label>
            <FuelTypeSelector value={fuelType} onChange={setFuelType} />
          </div>
        )}

        {/* EV specific inputs */}
        {mode === 'ev' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: theme.textSecondary }}>Battery (kWh)</label>
              <input
                type="number"
                value={batteryKWh}
                onChange={(e) => setBatteryKWh(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: theme.textSecondary }}>Current Charge %</label>
              <input
                type="number"
                value={currentCharge}
                onChange={(e) => setCurrentCharge(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: theme.textSecondary }}>kWh/100km</label>
              <input
                type="number"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: theme.textSecondary }}>Range (km)</label>
              <input
                type="number"
                value={vehicleRange}
                onChange={(e) => setVehicleRange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={hasStopSelection ? handleUpdateRoute : handlePlanTrip}
            disabled={hasStopSelection ? (!stopsNeedUpdate || updatingRoute) : loading}
            className="flex-1 px-5 py-2 rounded-xl text-sm font-bold cursor-pointer"
            style={{
              background: hasStopSelection
                ? (stopsNeedUpdate ? `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})` : theme.chipBg)
                : (mode === 'ev' ? `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})` : `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`),
              color: hasStopSelection
                ? (stopsNeedUpdate ? '#0D2B5E' : theme.chipText)
                : (mode === 'ev' ? '#fff' : '#0D2B5E'),
              border: 'none',
              opacity: (hasStopSelection ? updatingRoute : loading) ? 0.6 : 1,
              transition: 'all 0.25s ease',
            }}
          >
            {hasStopSelection
              ? (updatingRoute
                ? 'Updating Route...'
                : customRoute && !stopsNeedUpdate
                  ? `Route updated (${customRouteStops.length} stop${customRouteStops.length > 1 ? 's' : ''})`
                  : `Update Route (${selectedStopIds.size} stop${selectedStopIds.size !== 1 ? 's' : ''} selected)`)
              : (loading ? 'Calculating Route...' : 'Plan My Trip')}
          </button>
          {hasStopSelection && (
            <button
              onClick={handleClearStops}
              className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer flex-shrink-0"
              style={{ background: 'none', border: `1px solid ${theme.chipBorder}`, color: theme.textMuted }}
            >
              Clear stops
            </button>
          )}
        </div>

        {routeUpdateError && (
          <div
            className="rounded-xl p-3 text-xs"
            style={{ background: isDark ? 'rgba(255,100,100,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${theme.errorBorder}`, color: '#ef4444' }}
          >
            {routeUpdateError}
          </div>
        )}
      </div>

      {error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: isDark ? 'rgba(255,100,100,0.08)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${theme.errorBorder}`,
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <ShimmerCard key={i} />)}
        </div>
      )}

      {/* Map — sits directly under the trip-input card so the route is the
          first thing shown once a trip is planned */}
      {(route || evRoute) && !loading && (
        <>
          {activeStops.length > 0 && (
            <p className="text-[11px] text-center -mt-3 -mb-1" style={{ color: theme.textMuted }}>
              Tap a {mode === 'ev' ? 'charging station' : 'fuel station'} on the map to select it as a stop, then update your route.
            </p>
          )}
          <StationMap
            stations={displayStations}
            center={mapCenter}
            selectedStation={null}
            onStationSelect={toggleStopSelection}
            selectedIds={selectedStopIds}
            selectable={true}
            type="fuel"
            iconType={mode === 'ev' ? 'ev' : 'fuel'}
            fuelTypeLabel={mode === 'car' ? fuelTypeLabel : null}
            userLocation={startCoords}
            endLocation={endCoords}
            routePoints={displayRoutePoints}
            showTraffic={true}
          />
        </>
      )}

      {/* TinyAdz banner */}
      {(route || evRoute) && !loading && (
        <div ta-ad-container="" className="w-full" />
      )}

      {/* Route Summary */}
      {route && !loading && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium truncate min-w-0" style={{ color: theme.textSecondary }}>
            {startQuery} &rarr; {endQuery}
          </p>
          <ShareMenu
            title="Trip Planner"
            text={`Check out this route from ${startQuery} to ${endQuery} on FueVolt`}
            url={buildTripShareUrl({ start: startQuery, end: endQuery, mode })}
            buttonClassName="cursor-pointer flex-shrink-0"
            buttonStyle={{ background: 'none', border: 'none', color: theme.textMuted }}
          />
        </div>
      )}

      {/* Route Summary */}
      {route && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Distance</p>
            <p className="text-2xl font-bold" style={{ color: theme.gold }}>{displayRoute.distanceKm}<span className="text-xs ml-1">km</span></p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Est. Travel Time</p>
            <p className="text-2xl font-bold" style={{ color: theme.green }}>
              {displayRoute.travelTimeMin >= 60
                ? `${Math.floor(displayRoute.travelTimeMin / 60)}h ${displayRoute.travelTimeMin % 60}m`
                : `${displayRoute.travelTimeMin}m`}
            </p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Traffic Delay</p>
            <p className="text-2xl font-bold" style={{ color: displayRoute.trafficDelayMin > 0 ? '#E74C3C' : theme.green }}>
              {displayRoute.trafficDelayMin > 0 ? `+${displayRoute.trafficDelayMin}m` : 'None'}
            </p>
          </div>
          <div className="rounded-2xl p-4 text-center col-span-2 sm:col-span-1" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>{mode === 'ev' ? 'Chargers Found' : 'Fuel Stops'}</p>
            <p className="text-2xl font-bold" style={{ color: theme.text }}>
              {mode === 'ev' ? evStops.length : fuelStops.length}
            </p>
          </div>
        </div>
      )}

      {customRoute && !loading && (
        <div
          className="rounded-xl p-3 text-xs font-semibold text-center"
          style={{ background: 'rgba(41,121,255,0.1)', border: '1px solid rgba(41,121,255,0.3)', color: '#2979FF' }}
        >
          Route updated to include {customRouteStops.length} selected {mode === 'ev' ? 'charging' : 'fuel'} stop{customRouteStops.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Major traffic incidents only — closures, accidents, dangerous
          conditions, flooding, or a 10+ minute delay. Also gated on the
          route itself reporting a delay, so this can never contradict the
          "Traffic Delay: None" stat card above (e.g. an incident the route
          already routes around). */}
      {route && !loading && displayRoute.trafficDelayMin > 0 && majorTrafficIncidents.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: '#E74C3C' }}>
            &#9888; Major delay or disruption on this route
          </h2>
          <div className="space-y-2">
            {majorTrafficIncidents.map((inc) => (
              <div key={inc.id} className="flex items-start justify-between gap-3 text-sm" style={{ color: theme.textSecondary }}>
                <span>{inc.description}{inc.from ? ` — ${inc.from}${inc.to ? ` to ${inc.to}` : ''}` : ''}</span>
                {inc.delay > 0 && (
                  <span className="flex-shrink-0 font-semibold" style={{ color: '#E74C3C' }}>+{inc.delay}m</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {route && !loading && (
        <a
          href={buildGoogleMapsUrl(startQuery, endQuery, customRouteStops)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: theme.chipBg, color: theme.chipText, border: `1px solid ${theme.chipBorder}`, textDecoration: 'none' }}
        >
          {customRouteStops.length > 0 ? 'Open updated route in Google Maps' : 'Open direct route in Google Maps'} &rarr;
        </a>
      )}

      {/* EV Route Summary — only in Electric Vehicle mode, so a stale
          forecast from before switching modes doesn't linger on screen */}
      {evRoute && mode === 'ev' && !loading && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: isDark ? 'rgba(34, 197, 94,0.06)' : 'rgba(34,197,94,0.04)',
            border: `1px solid ${isDark ? 'rgba(34, 197, 94,0.2)' : 'rgba(34,197,94,0.15)'}`,
          }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: theme.green }}>EV Battery Forecast</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[11px]" style={{ color: theme.textSecondary }}>Battery at Start</p>
              <p className="text-xl font-bold" style={{ color: theme.green }}>{evRoute.batteryAtStart}%</p>
            </div>
            <div className="text-center">
              <p className="text-[11px]" style={{ color: theme.textSecondary }}>Battery at Dest</p>
              <p className="text-xl font-bold" style={{ color: evRoute.batteryAtDest < 20 ? '#E74C3C' : theme.green }}>
                {evRoute.batteryAtDest}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px]" style={{ color: theme.textSecondary }}>Energy Used</p>
              <p className="text-xl font-bold" style={{ color: theme.gold }}>{evRoute.energyUsedKWh} kWh</p>
            </div>
            <div className="text-center">
              <p className="text-[11px]" style={{ color: theme.textSecondary }}>Charging Stops</p>
              <p className="text-xl font-bold" style={{ color: evRoute.chargingStopsNeeded > 0 ? '#E74C3C' : theme.green }}>
                {evRoute.chargingStopsNeeded}
              </p>
            </div>
          </div>

          {/* Battery bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1" style={{ color: theme.textSecondary }}>
              <span>Start: {evRoute.batteryAtStart}%</span>
              <span>Arrival: {evRoute.batteryAtDest}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${evRoute.batteryAtDest}%`,
                  background: evRoute.batteryAtDest < 20
                    ? 'linear-gradient(90deg, #E74C3C, #C0392B)'
                    : `linear-gradient(90deg, ${theme.green}, ${theme.greenDark})`,
                  transition: 'width 1s ease',
                }}
              />
            </div>
          </div>

          {evRoute.chargingStopsNeeded > 0 && (
            <p className="text-xs mt-3" style={{ color: '#E74C3C' }}>
              You will need {evRoute.chargingStopsNeeded} charging stop{evRoute.chargingStopsNeeded > 1 ? 's' : ''} on this route.
            </p>
          )}
        </div>
      )}

      {/* Charging plan for EV */}
      {chargingPlan.length > 0 && mode === 'ev' && !loading && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: theme.green }}>
            Recommended Charging Stops
          </h3>
          <div className="space-y-2">
            {chargingPlan.map((stop, i) => (
              <div
                key={stop.index}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: theme.green, color: '#fff' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: theme.green }}>{stop.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>{stop.address}</p>
                  <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
                    ~{stop.distanceAlongRoute} km into trip &bull; Charge here before continuing
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Car rental — DiscoverCars affiliate */}
      {(route || evRoute) && !loading && (
        <div
          className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: theme.textMuted }}>
              Sponsored
            </p>
            <p className="text-sm font-semibold" style={{ color: theme.text }}>Need a rental car for this trip?</p>
            <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
              Compare rental car prices across major providers with DiscoverCars. FueVolt may earn a commission if you book through this link, at no extra cost to you.
            </p>
          </div>
          <a
            href="https://www.discovercars.com/?a_aid=FueVolt"
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="px-4 py-2 rounded-lg font-semibold text-sm flex-shrink-0"
            style={{ background: theme.gold, color: '#0D2B5E', textDecoration: 'none' }}
          >
            Compare Rentals
          </a>
          <a
            href="https://www.discovercars.com/?a_aid=FueVolt&a_bid=f29909e9"
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="w-full"
            style={{ maxWidth: '728px' }}
          >
            <img
              src="https://discover-car-hire.postaffiliatepro.com/accounts/default1/bunyh71e/f29909e9.jpg"
              alt="DiscoverCars.com"
              title="DiscoverCars.com"
              width="728"
              height="90"
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
            />
          </a>
          <img
            src="https://discover-car-hire.postaffiliatepro.com/scripts/iunyh71e?a_aid=FueVolt&a_bid=f29909e9"
            width="1"
            height="1"
            alt=""
            style={{ border: 0, position: 'absolute', width: '1px', height: '1px' }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Fuel stops along route */}
      {fuelStops.length > 0 && mode === 'car' && !loading && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: theme.gold }}>{fuelTypeLabel} Stations Along Route</h3>
            <p className="text-[11px]" style={{ color: theme.textMuted }}>Tap a station to select it as a stop</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fuelStops.map((stop) => {
              const isSelected = selectedStopIds.has(stop.id);
              return (
                <div
                  key={stop.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleStopSelection(stop)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleStopSelection(stop); }}
                  className="rounded-xl p-3 flex items-start justify-between gap-2 cursor-pointer"
                  style={{
                    background: isSelected ? 'rgba(41,121,255,0.1)' : theme.cardBg,
                    border: `1px solid ${isSelected ? '#2979FF' : theme.cardBorder}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="min-w-0 flex items-start gap-2">
                    <span
                      className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        background: isSelected ? '#2979FF' : 'transparent',
                        border: `1.5px solid ${isSelected ? '#2979FF' : theme.chipBorder}`,
                        color: '#FFFFFF',
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: theme.gold }}>{stop.name}</p>
                      {stop.brand && (
                        <p className="text-[11px]" style={{ color: theme.textMuted }}>{stop.brand}</p>
                      )}
                      <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{stop.address}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {stop.price != null ? (
                      <p className="text-sm font-bold" style={{ color: theme.green }}>
                        {(stop.price * 100).toFixed(1)}<span className="text-[10px]">&cent;/L</span>
                      </p>
                    ) : (
                      <p className="text-[10px]" style={{ color: theme.textMuted }}>No price data</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EV chargers along route */}
      {evStops.length > 0 && mode === 'ev' && !loading && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: theme.green }}>EV Chargers Along Route</h3>
            <p className="text-[11px]" style={{ color: theme.textMuted }}>Tap a charger to select it as a stop</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {evStops.map((stop) => {
              const isSelected = selectedStopIds.has(stop.id);
              return (
                <div
                  key={stop.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleStopSelection(stop)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleStopSelection(stop); }}
                  className="rounded-xl p-3 flex items-start gap-2 cursor-pointer"
                  style={{
                    background: isSelected ? 'rgba(41,121,255,0.1)' : theme.cardBg,
                    border: `1px solid ${isSelected ? '#2979FF' : theme.cardBorder}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: isSelected ? '#2979FF' : 'transparent',
                      border: `1.5px solid ${isSelected ? '#2979FF' : theme.chipBorder}`,
                      color: '#FFFFFF',
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: theme.green }}>{stop.name}</p>
                    <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{stop.address}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state \u2014 an illustrative example route so first-time visitors
          see what a planned trip looks like before entering their own */}
      {!route && !evRoute && !loading && !error && (
        <div className="space-y-4">
          <div className="relative">
            <StationMap
              stations={[]}
              center={[-34.5, 150.2]}
              onStationSelect={() => {}}
              type="fuel"
              userLocation={EXAMPLE_START}
              endLocation={EXAMPLE_END}
              routePoints={EXAMPLE_ROUTE_POINTS}
            />
            <span
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(13,43,94,0.85)', color: theme.gold, border: `1px solid ${theme.gold}`, zIndex: 1000 }}
            >
              Example trip
            </span>
          </div>
          <div className="text-center py-4">
            <div className="text-5xl mb-4">{mode === 'ev' ? '\u26A1' : '\u26FD'}</div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
              Plan your trip
            </h3>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              Enter start and end locations above to find the best route with {mode === 'ev' ? 'charging stations' : 'fuel stops'} along the way &mdash; like the example Sydney &rarr; Canberra trip shown above
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


function buildChargingPlan(routePoints, chargers, currentRangeKm, fullRangeKm, totalDistKm) {
  if (!chargers.length || !routePoints.length) return [];

  const plan = [];
  let remainingRange = currentRangeKm;
  let distanceCovered = 0;
  const pointDistances = computePointDistances(routePoints);
  const totalRouteDist = pointDistances[pointDistances.length - 1] || totalDistKm;

  // Find charging stops when range gets low (below 15%)
  const lowThreshold = fullRangeKm * 0.15;
  let stopIdx = 0;

  for (let i = 1; i < routePoints.length; i++) {
    const segDist = haversine(routePoints[i - 1], routePoints[i]);
    distanceCovered += segDist;
    remainingRange -= segDist;

    if (remainingRange < lowThreshold && stopIdx < 5) {
      // Find nearest charger to current position
      const [lat, lng] = routePoints[i];
      let nearest = null;
      let nearestDist = Infinity;
      for (const c of chargers) {
        const d = haversine([lat, lng], [c.latitude, c.longitude]);
        if (d < nearestDist && !plan.some((p) => p.id === c.id)) {
          nearestDist = d;
          nearest = c;
        }
      }
      if (nearest) {
        plan.push({
          ...nearest,
          index: stopIdx,
          distanceAlongRoute: Math.round(distanceCovered),
        });
        stopIdx++;
        remainingRange = fullRangeKm * 0.8; // assume charge to 80%
      }
    }
  }

  return plan;
}

function computePointDistances(points) {
  const distances = [0];
  for (let i = 1; i < points.length; i++) {
    distances.push(distances[i - 1] + haversine(points[i - 1], points[i]));
  }
  return distances;
}

// Builds a Google Maps directions URL — opens in the Maps app on mobile or
// maps.google.com on desktop, with the route (and any stops as waypoints)
// pre-filled and ready to navigate. No API key needed for this URL scheme.
function buildGoogleMapsUrl(origin, destination, waypoints = []) {
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map((w) => `${w.latitude},${w.longitude}`).join('|'));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function haversine(p1, p2) {
  const R = 6371;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLng = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
