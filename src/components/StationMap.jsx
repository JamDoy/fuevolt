import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';
import TouchableMap from './TouchableMap';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Fuel bowser icon (fuel pump silhouette)
const fuelIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C8.268 0 2 6.268 2 14c0 10.5 14 28 14 28s14-17.5 14-28C30 6.268 23.732 0 16 0z" fill="#FFD700" stroke="#B8860B" stroke-width="1"/>
    <rect x="10" y="7" width="10" height="14" rx="2" fill="#0D2B5E"/>
    <rect x="12" y="9" width="6" height="5" rx="1" fill="#FFD700"/>
    <rect x="14" y="16" width="2" height="3" fill="#FFD700"/>
    <path d="M22 10h2v8h-2z" fill="#0D2B5E"/>
    <circle cx="23" cy="10" r="2" fill="#0D2B5E"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Green lightning bolt icon for EV chargers
const evBoltIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C8.268 0 2 6.268 2 14c0 10.5 14 28 14 28s14-17.5 14-28C30 6.268 23.732 0 16 0z" fill="#2ECC71" stroke="#1a9c54" stroke-width="1"/>
    <path d="M18 6l-6 10h4l-2 8 6-10h-4l2-8z" fill="#FFFFFF"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});


function MapUpdater({ center, routePoints }) {
  const map = useMap();
  useEffect(() => {
    if (routePoints && routePoints.length > 1) {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [center, routePoints, map]);
  return null;
}

function MapMoveDetector({ onMoved, originalCenter }) {
  const map = useMapEvents({
    moveend: () => {
      if (!originalCenter) return;
      const c = map.getCenter();
      const dist = map.distance(c, L.latLng(originalCenter[0], originalCenter[1]));
      onMoved(dist > 500);
    },
  });
  return null;
}

// Renders the "Search this area" button as a native Leaflet control so it is
// embedded within the map rather than floating over surrounding page content.
function SearchAreaControl({ visible, onClick, theme }) {
  const map = useMap();
  const [container] = useState(() => {
    const div = L.DomUtil.create('div', 'leaflet-control search-area-control');
    div.style.marginBottom = '18px';
    return div;
  });

  useEffect(() => {
    const CustomControl = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd: () => container,
    });
    const ctrl = new CustomControl();
    ctrl.addTo(map);
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    const parent = container.parentElement; // .leaflet-bottom.leaflet-left
    if (parent) {
      parent.style.left = '50%';
      parent.style.transform = 'translateX(-50%)';
    }
    return () => ctrl.remove();
  }, [map, container]);

  return createPortal(
    visible ? (
      <button
        onClick={onClick}
        style={{
          background: theme.mode === 'dark' ? 'rgba(13,43,94,0.95)' : 'rgba(255,255,255,0.95)',
          color: theme.gold,
          border: `1px solid ${theme.gold}`,
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}
      >
        &#x1F50D; Search this area
      </button>
    ) : null,
    container
  );
}

export default function StationMap({
  stations,
  center,
  onStationSelect,
  onStationDetail,
  type = 'ev',
  routePoints = null,
  userLocation = null,
  onSearchArea = null,
}) {
  const { theme } = useTheme();
  const defaultCenter = [-33.8688, 151.2093];
  const mapCenter = center || defaultCenter;
  const [showSearchBtn, setShowSearchBtn] = useState(false);
  const [mapRef, setMapRef] = useState(null);

  const handleMapMoved = useCallback((moved) => {
    setShowSearchBtn(moved && !!onSearchArea);
  }, [onSearchArea]);

  const handleSearchArea = useCallback(() => {
    if (!mapRef || !onSearchArea) return;
    const c = mapRef.getCenter();
    onSearchArea(c.lat, c.lng);
    setShowSearchBtn(false);
  }, [mapRef, onSearchArea]);

  const getIcon = (station) => {
    if (type === 'fuel') return fuelIcon;
    return evBoltIcon;
  };

  return (
    <TouchableMap
      className="rounded-2xl overflow-hidden relative"
      style={{ border: `1px solid ${theme.mapBorder}` }}
    >
      {(mapActive, interactionController) => (
        <>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '400px', width: '100%' }}
          scrollWheelZoom={false}
          dragging={false}
          ref={setMapRef}
        >
          {interactionController}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater center={mapCenter} routePoints={routePoints} />
          {mapActive && onSearchArea && (
            <MapMoveDetector onMoved={handleMapMoved} originalCenter={mapCenter} />
          )}
          {onSearchArea && (
            <SearchAreaControl visible={showSearchBtn} onClick={handleSearchArea} theme={theme} />
          )}

          {/* User location marker */}
          {userLocation && (
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={40}
              pathOptions={{ color: '#4285F4', fillColor: '#4285F4', fillOpacity: 0.7, weight: 2 }}
            />
          )}

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
                    {type === 'fuel' && (
                      <>
                        <br />
                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                          {station.price != null ? `${(station.price * 100).toFixed(1)}¢/L` : 'No price data'}
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
        </>
      )}
    </TouchableMap>
  );
}
