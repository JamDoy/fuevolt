import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
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

// Fuel bowser pin — gradient teardrop with a white badge circle and a
// clean pump glyph, plus a soft drop shadow so it reads as a real icon
// rather than a flat blob.
const fuelIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));">
    <defs>
      <linearGradient id="fuelPinGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FDE68A"/>
        <stop offset="55%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#B45309"/>
      </linearGradient>
    </defs>
    <path d="M16 0C8.268 0 2 6.268 2 14c0 10.5 14 28 14 28s14-17.5 14-28C30 6.268 23.732 0 16 0z" fill="url(#fuelPinGrad)" stroke="#B45309" stroke-width="0.75"/>
    <circle cx="16" cy="14" r="8.5" fill="#FFFFFF"/>
    <g stroke="#0D2B5E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="11.5" y="10" width="6" height="9" rx="1.2"/>
      <line x1="11.5" y1="13.2" x2="17.5" y2="13.2"/>
      <path d="M17.5 12.2h1.6a1.4 1.4 0 0 1 1.4 1.4v3.4a1 1 0 0 0 1 1"/>
    </g>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Cheapest-station pin — larger, green, with a star badge and a pulsing
// radar ring (CSS animation defined globally in index.css) so it draws
// the eye immediately among a cluster of stations.
const cheapestFuelIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="position:relative;width:38px;height:50px;">
    <div class="cheapest-pin-pulse"></div>
    <svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative;filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));">
      <defs>
        <linearGradient id="cheapestPinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4ADE80"/>
          <stop offset="55%" stop-color="#22C55E"/>
          <stop offset="100%" stop-color="#14532D"/>
        </linearGradient>
      </defs>
      <path d="M19 0C9.82 0 2.38 7.44 2.38 16.62c0 12.47 16.62 33.28 16.62 33.28s16.62-20.81 16.62-33.28C35.62 7.44 28.18 0 19 0z" fill="url(#cheapestPinGrad)" stroke="#14532D" stroke-width="0.75"/>
      <circle cx="19" cy="16.6" r="10.1" fill="#FFFFFF"/>
      <g stroke="#14532D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <rect x="13.7" y="12" width="7.1" height="10.7" rx="1.4"/>
        <line x1="13.7" y1="15.8" x2="20.8" y2="15.8"/>
        <path d="M20.8 14.6h1.9a1.7 1.7 0 0 1 1.7 1.7v4a1.2 1.2 0 0 0 1.2 1.2"/>
      </g>
      <circle cx="30" cy="8" r="7" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.5"/>
      <path d="M30 4l1.15 2.33 2.57.37-1.86 1.81.44 2.56L30 9.85l-2.3 1.22.44-2.56-1.86-1.81 2.57-.37z" fill="#FFFFFF"/>
    </svg>
  </div>`,
  iconSize: [38, 50],
  iconAnchor: [19, 50],
  popupAnchor: [0, -50],
});

// Green lightning bolt icon for EV chargers
const evBoltIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C8.268 0 2 6.268 2 14c0 10.5 14 28 14 28s14-17.5 14-28C30 6.268 23.732 0 16 0z" fill="#22C55E" stroke="#1a9c54" stroke-width="1"/>
    <path d="M18 6l-6 10h4l-2 8 6-10h-4l2-8z" fill="#FFFFFF"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// User location marker — small car in the same blue gradient as the header
const userCarIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg, #1A6FDB 0%, #0D2B5E 100%);border:2px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-2a2 2 0 0 1 .4-1.2L5 8.5A2 2 0 0 1 6.6 8h10.8a2 2 0 0 1 1.6.8l1.6 3.1A2 2 0 0 1 21 13v2a2 2 0 0 1-2 2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
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
  altRoutePoints = null,
  userLocation = null,
  onSearchArea = null,
  cheapestStationId = null,
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
    if (type !== 'fuel') return evBoltIcon;
    if (cheapestStationId != null && station.id === cheapestStationId) return cheapestFuelIcon;
    return fuelIcon;
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
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userCarIcon}
              zIndexOffset={1000}
            >
              <Popup>Your location</Popup>
            </Marker>
          )}

          {/* Cheapest-fuel detour route — drawn under the direct route */}
          {altRoutePoints && altRoutePoints.length > 1 && (
            <Polyline
              positions={altRoutePoints}
              pathOptions={{ color: '#F59E0B', weight: 4, opacity: 0.75, dashArray: '8 6' }}
            />
          )}

          {/* Route line */}
          {routePoints && routePoints.length > 1 && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: '#22C55E', weight: 4, opacity: 0.8 }}
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

            const isCheapest = type === 'fuel' && cheapestStationId != null && station.id === cheapestStationId;

            return (
              <Marker
                key={type === 'ev' ? station.ID : station.id}
                position={[lat, lng]}
                icon={getIcon(station)}
                zIndexOffset={isCheapest ? 900 : 0}
                eventHandlers={{
                  click: () => onStationSelect(station),
                }}
              >
                <Popup>
                  <div style={{ color: '#1a1a1a' }}>
                    {isCheapest && (
                      <div style={{ color: '#14532D', fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                        &#9733; CHEAPEST NEARBY
                      </div>
                    )}
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
                                background: 'linear-gradient(135deg, #B45309, #F59E0B)',
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
