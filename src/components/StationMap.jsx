import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';

// Fix Leaflet default icon issue
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

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function StationMap({
  stations,
  center,
  selectedStation,
  onStationSelect,
  type = 'ev',
}) {
  const { theme } = useTheme();
  const defaultCenter = [-33.8688, 151.2093]; // Sydney
  const mapCenter = center || defaultCenter;

  const getIcon = (station) => {
    if (type === 'fuel') return goldIcon;

    if (selectedStation && selectedStation.ID === station.ID) return greenIcon;

    // Check if it's a DC fast charger
    const hasDC = station.Connections?.some(
      (c) => c.CurrentType?.Title?.includes('DC') || (c.PowerKW && c.PowerKW >= 50)
    );
    return hasDC ? dcIcon : goldIcon;
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.mapBorder}` }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={mapCenter} />
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
                        {(station.price * 100).toFixed(1)}¢/L
                      </span>
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
