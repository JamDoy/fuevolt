import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';
import { TOMTOM_TILE_URL, TOMTOM_TRAFFIC_FLOW_URL, TOMTOM_TRAFFIC_INCIDENTS_URL } from '../utils/tomtom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const goldIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#FFD700"/>
    <circle cx="14" cy="14" r="6" fill="#0D2B5E"/>
  </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
});

const greenIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#2ECC71"/>
    <circle cx="14" cy="14" r="6" fill="#FFFFFF"/>
  </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
});

const dcIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#FFD700"/>
    <text x="14" y="18" text-anchor="middle" fill="#0D2B5E" font-size="9" font-weight="bold">DC</text>
  </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40],
});

// EV availability icons
const evAvailableIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#2ECC71"/><circle cx="14" cy="14" r="6" fill="#fff"/></svg>`,
  iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40],
});
const evOccupiedIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#E74C3C"/><circle cx="14" cy="14" r="6" fill="#fff"/></svg>`,
  iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40],
});
const evOfflineIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#95A5A6"/><circle cx="14" cy="14" r="6" fill="#fff"/></svg>`,
  iconSize: [28, 40], iconAnchor: [14, 40], popupAnchor: [0, -40],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function StationMap({
  stations,
  center,
  selectedStation,
  onStationSelect,
  onStationDetail,
  type = 'ev',
  routePoints = null,
  showTraffic = false,
  evAvailability = {},
}) {
  const { theme } = useTheme();
  const [trafficOn, setTrafficOn] = useState(showTraffic);
  const defaultCenter = [-33.8688, 151.2093];
  const mapCenter = center || defaultCenter;

  const getIcon = (station) => {
    if (type === 'fuel') return goldIcon;

    // EV availability-based icons
    const avail = evAvailability[station.ID];
    if (avail) {
      if (avail.available > 0) return evAvailableIcon;
      if (avail.outOfService > 0 && avail.occupied === 0) return evOfflineIcon;
      return evOccupiedIcon;
    }

    if (selectedStation && selectedStation.ID === station.ID) return greenIcon;
    const hasDC = station.Connections?.some(
      (c) => c.CurrentType?.Title?.includes('DC') || (c.PowerKW && c.PowerKW >= 50)
    );
    return hasDC ? dcIcon : goldIcon;
  };

  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ border: `1px solid ${theme.mapBorder}` }}>
      {/* Traffic Toggle */}
      <button
        onClick={() => setTrafficOn((t) => !t)}
        className="absolute top-3 right-3 z-[1000] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
        style={{
          background: trafficOn ? 'rgba(46,204,113,0.9)' : 'rgba(13,43,94,0.85)',
          color: '#fff',
          border: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        {trafficOn ? 'Traffic ON' : 'Traffic OFF'}
      </button>

      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* TomTom Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.tomtom.com">TomTom</a>'
          url={TOMTOM_TILE_URL}
          tileSize={512}
          zoomOffset={-1}
        />

        {/* Traffic Flow Overlay */}
        {trafficOn && (
          <TileLayer
            url={TOMTOM_TRAFFIC_FLOW_URL}
            tileSize={512}
            zoomOffset={-1}
            opacity={0.7}
          />
        )}

        {/* Traffic Incidents Overlay */}
        {trafficOn && (
          <TileLayer
            url={TOMTOM_TRAFFIC_INCIDENTS_URL}
            tileSize={512}
            zoomOffset={-1}
            opacity={0.8}
          />
        )}

        <MapUpdater center={mapCenter} />

        {/* Route line */}
        {routePoints && routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#2ECC71', weight: 4, opacity: 0.8 }}
          />
        )}

        {stations.map((station) => {
          const lat = type === 'ev'
            ? station.AddressInfo?.Latitude
            : station.latitude;
          const lng = type === 'ev'
            ? station.AddressInfo?.Longitude
            : station.longitude;

          if (!lat || !lng) return null;

          const avail = type === 'ev' ? evAvailability[station.ID] : null;

          return (
            <Marker
              key={type === 'ev' ? station.ID : station.id}
              position={[lat, lng]}
              icon={getIcon(station)}
              eventHandlers={{
                click: () => onStationSelect(station),
              }}
            >
              <Popup>
                <div style={{ color: '#1a1a1a' }}>
                  <strong style={{ color: '#0D2B5E' }}>
                    {type === 'ev' ? station.AddressInfo?.Title : station.name}
                  </strong>
                  <br />
                  <span style={{ fontSize: '12px' }}>
                    {type === 'ev'
                      ? station.AddressInfo?.AddressLine1
                      : station.address}
                  </span>
                  {type === 'ev' && avail && (
                    <>
                      <br />
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: avail.available > 0 ? '#2ECC71' : '#E74C3C' }}>
                        {avail.available > 0 ? `${avail.available} Available` : 'All In Use'}
                        {avail.outOfService > 0 && ` | ${avail.outOfService} Offline`}
                      </span>
                    </>
                  )}
                  {type === 'fuel' && (
                    <>
                      <br />
                      <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        {(station.price * 100).toFixed(1)}&cent;/L
                      </span>
                      {station.driveTime && (
                        <>
                          <br />
                          <span style={{ fontSize: '11px', color: '#666' }}>
                            {station.driveTime} min drive
                          </span>
                        </>
                      )}
                      {onStationDetail && (
                        <>
                          <br />
                          <button
                            onClick={() => onStationDetail(station)}
                            style={{
                              marginTop: '6px',
                              padding: '4px 10px',
                              background: 'linear-gradient(135deg, #C8971F, #FFD700)',
                              color: '#0D2B5E',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            View Details
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
