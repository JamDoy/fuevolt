import { useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import StationMap from '../components/StationMap';
import ShimmerCard from '../components/ShimmerCard';
import LocationInput from '../components/LocationInput';
import { geocodeLocation } from '../utils/api';
import { calculateRoute, calculateEVRoute, searchAlongRoute } from '../utils/tomtom';

export default function TripPlannerPage() {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [mode, setMode] = useState('car');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [route, setRoute] = useState(null);
  const [evRoute, setEvRoute] = useState(null);
  const [fuelStops, setFuelStops] = useState([]);
  const [evStops, setEvStops] = useState([]);
  const [chargingPlan, setChargingPlan] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [batteryKWh, setBatteryKWh] = useState(60);
  const [currentCharge, setCurrentCharge] = useState(80);
  const [consumption, setConsumption] = useState(15);
  const [vehicleRange, setVehicleRange] = useState(400);

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

    try {
      const [startGeo, endGeo] = await Promise.all([
        geocodeLocation(startQuery),
        geocodeLocation(endQuery),
      ]);

      const midLat = (startGeo.latitude + endGeo.latitude) / 2;
      const midLng = (startGeo.longitude + endGeo.longitude) / 2;
      setMapCenter([midLat, midLng]);

      const routeData = await calculateRoute(
        startGeo.latitude, startGeo.longitude,
        endGeo.latitude, endGeo.longitude
      );
      setRoute(routeData);

      if (mode === 'ev') {
        const currentChargeKWh = batteryKWh * currentCharge / 100;
        const ev = await calculateEVRoute(
          startGeo.latitude, startGeo.longitude,
          endGeo.latitude, endGeo.longitude,
          { batteryCapacityKWh: batteryKWh, currentChargeKWh, consumptionKWhPer100km: consumption }
        );
        if (ev) setEvRoute(ev);

        // Search for EV chargers along the route
        if (routeData.points && routeData.points.length > 1) {
          const chargers = await searchAlongRoute(routeData.points, '7309', 25);
          setEvStops(chargers);

          // Build charging plan based on vehicle range
          const distKm = parseFloat(routeData.distanceKm);
          const rangeKm = vehicleRange * (currentCharge / 100);
          if (distKm > rangeKm) {
            const plan = buildChargingPlan(routeData.points, chargers, rangeKm, vehicleRange, distKm);
            setChargingPlan(plan);
          }
        }
      } else {
        // Search for fuel stations along the route
        if (routeData.points && routeData.points.length > 1) {
          const stations = await searchAlongRoute(routeData.points, '7311', 25);
          setFuelStops(stations);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  }, [startQuery, endQuery, mode, batteryKWh, currentCharge, consumption, vehicleRange]);

  const routePoints = route?.points || evRoute?.points || null;

  // Convert stops to map-compatible format
  const mapStops = (mode === 'ev' ? evStops : fuelStops).map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    latitude: s.latitude,
    longitude: s.longitude,
    price: 0,
    distance: s.distance,
  }));

  // Charging plan markers
  const chargingMarkers = chargingPlan.map((stop) => ({
    id: `charge-${stop.index}`,
    name: stop.name,
    address: stop.address,
    latitude: stop.latitude,
    longitude: stop.longitude,
    price: 0,
    distance: stop.distanceAlongRoute,
  }));

  const allMapStops = [...mapStops, ...chargingMarkers.filter((cm) => !mapStops.some((ms) => ms.id === cm.id))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.gold }}>
          Trip Planner
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          Plan your route with fuel stations and EV chargers along the way
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center gap-2">
        {[
          { id: 'car', label: 'Fuel Vehicle', color: theme.gold },
          { id: 'ev', label: 'Electric Vehicle', color: theme.green },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
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
            {m.id === 'car' ? '\u26FD' : '\u26A1'} {m.label}
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

        {/* EV specific inputs */}
        {mode === 'ev' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-semibold mb-1" style={{ color: theme.textSecondary }}>Battery (kWh)</label>
              <input
                type="number"
                value={batteryKWh}
                onChange={(e) => setBatteryKWh(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold mb-1" style={{ color: theme.textSecondary }}>Current Charge %</label>
              <input
                type="number"
                value={currentCharge}
                onChange={(e) => setCurrentCharge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold mb-1" style={{ color: theme.textSecondary }}>kWh/100km</label>
              <input
                type="number"
                value={consumption}
                onChange={(e) => setConsumption(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold mb-1" style={{ color: theme.textSecondary }}>Range (km)</label>
              <input
                type="number"
                value={vehicleRange}
                onChange={(e) => setVehicleRange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Fuel vehicle range input */}
        {mode === 'car' && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold whitespace-nowrap" style={{ color: theme.textSecondary }}>Tank Range (km)</label>
            <input
              type="number"
              value={vehicleRange}
              onChange={(e) => setVehicleRange(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg text-sm"
              style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText, outline: 'none' }}
            />
            <span className="text-[10px]" style={{ color: theme.textMuted }}>Used to suggest fuel stops on long trips</span>
          </div>
        )}

        <button
          onClick={handlePlanTrip}
          disabled={loading}
          className="w-full px-6 py-3 rounded-xl text-sm font-bold cursor-pointer"
          style={{
            background: mode === 'ev'
              ? `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`
              : `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`,
            color: mode === 'ev' ? '#fff' : '#0D2B5E',
            border: 'none',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.25s ease',
          }}
        >
          {loading ? 'Calculating Route...' : 'Plan My Trip'}
        </button>
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

      {/* Route Summary */}
      {route && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Distance</p>
            <p className="text-2xl font-bold" style={{ color: theme.gold }}>{route.distanceKm}<span className="text-xs ml-1">km</span></p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Travel Time</p>
            <p className="text-2xl font-bold" style={{ color: theme.green }}>
              {route.travelTimeMin >= 60
                ? `${Math.floor(route.travelTimeMin / 60)}h ${route.travelTimeMin % 60}m`
                : `${route.travelTimeMin}m`}
            </p>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Traffic Delay</p>
            <p className="text-2xl font-bold" style={{ color: route.trafficDelayMin > 0 ? '#E74C3C' : theme.green }}>
              {route.trafficDelayMin > 0 ? `+${route.trafficDelayMin}m` : 'None'}
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

      {/* EV Route Summary */}
      {evRoute && !loading && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: isDark ? 'rgba(46,204,113,0.06)' : 'rgba(39,174,96,0.04)',
            border: `1px solid ${isDark ? 'rgba(46,204,113,0.2)' : 'rgba(39,174,96,0.15)'}`,
          }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: theme.green }}>EV Battery Forecast</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>Battery at Start</p>
              <p className="text-xl font-bold" style={{ color: theme.green }}>{evRoute.batteryAtStart}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>Battery at Dest</p>
              <p className="text-xl font-bold" style={{ color: evRoute.batteryAtDest < 20 ? '#E74C3C' : theme.green }}>
                {evRoute.batteryAtDest}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>Energy Used</p>
              <p className="text-xl font-bold" style={{ color: theme.gold }}>{evRoute.energyUsedKWh} kWh</p>
            </div>
            <div className="text-center">
              <p className="text-[10px]" style={{ color: theme.textSecondary }}>Charging Stops</p>
              <p className="text-xl font-bold" style={{ color: evRoute.chargingStopsNeeded > 0 ? '#E74C3C' : theme.green }}>
                {evRoute.chargingStopsNeeded}
              </p>
            </div>
          </div>

          {/* Battery bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: theme.textSecondary }}>
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
      {chargingPlan.length > 0 && !loading && (
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

      {/* Map */}
      {(route || evRoute) && !loading && (
        <StationMap
          stations={allMapStops}
          center={mapCenter}
          selectedStation={null}
          onStationSelect={() => {}}
          type="fuel"
          routePoints={routePoints}
          showTraffic={true}
        />
      )}

      {/* Fuel stops along route */}
      {fuelStops.length > 0 && mode === 'car' && !loading && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: theme.gold }}>Fuel Stations Along Route</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fuelStops.map((stop) => (
              <div
                key={stop.id}
                className="rounded-xl p-3"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <p className="text-sm font-semibold" style={{ color: theme.gold }}>{stop.name}</p>
                {stop.brand && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: theme.brandBadgeBg, color: theme.gold }}>
                    {stop.brand}
                  </span>
                )}
                <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{stop.address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EV chargers along route */}
      {evStops.length > 0 && mode === 'ev' && !loading && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: theme.green }}>EV Chargers Along Route</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {evStops.map((stop) => (
              <div
                key={stop.id}
                className="rounded-xl p-3"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <p className="text-sm font-semibold" style={{ color: theme.green }}>{stop.name}</p>
                <p className="text-xs mt-1" style={{ color: theme.textSecondary }}>{stop.address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!route && !evRoute && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">{mode === 'ev' ? '\u26A1' : '\u26FD'}</div>
          <h3 className="text-lg font-semibold mb-1" style={{ color: theme.text }}>
            Plan your trip
          </h3>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            Enter start and end locations to find the best route with {mode === 'ev' ? 'charging stations' : 'fuel stops'} along the way
          </p>
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

function haversine(p1, p2) {
  const R = 6371;
  const dLat = (p2[0] - p1[0]) * Math.PI / 180;
  const dLng = (p2[1] - p1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
