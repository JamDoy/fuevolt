import { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getBrandStyle, formatOpeningHours } from '../utils/brandLogos';
import { isFavourite, addFavourite, removeFavourite } from '../utils/favourites';
import { saveGeofence, removeGeofence, getSavedGeofences } from '../utils/tomtom';

export default function FuelStationCard({ station, isSelected, onClick, onDetail, rank, sortBy }) {
  const { theme } = useTheme();
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [fav, setFav] = useState(false);
  const [hasGeofence, setHasGeofence] = useState(false);
  const brandStyle = getBrandStyle(station.brand);
  const hours = formatOpeningHours(station.openingHours);

  useEffect(() => {
    setFav(isFavourite(station.id));
    setHasGeofence(getSavedGeofences().some((f) => f.id === station.id));
  }, [station.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleFav = (e) => {
    e.stopPropagation();
    if (fav) {
      removeFavourite(station.id);
      setFav(false);
    } else {
      addFavourite(station);
      setFav(true);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer"
      style={{
        background: theme.cardBg,
        border: isSelected ? `1px solid ${theme.cardBorderActive}` : `1px solid ${theme.cardBorder}`,
        boxShadow: isSelected ? theme.cardGlow : theme.cardGlowDefault,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-3">
          {rank != null && (
            <span
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: rank === 0
                  ? `linear-gradient(135deg, ${theme.green}, ${theme.greenDark})`
                  : rank < 3
                    ? `${theme.mode === 'dark' ? 'rgba(46,204,113,0.15)' : 'rgba(39,174,96,0.1)'}`
                    : theme.chipBg,
                color: rank < 3 ? theme.green : theme.textSecondary,
              }}
            >
              {rank + 1}
            </span>
          )}
          {/* Brand logo */}
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black"
            style={{ background: brandStyle.bg, color: brandStyle.text }}
          >
            {brandStyle.short}
          </span>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: theme.gold }}>
              {station.name}
            </h3>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1"
              style={{
                background: theme.brandBadgeBg,
                color: theme.gold,
                border: `1px solid ${theme.brandBadgeBorder}`,
              }}
            >
              {station.brand}
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div>
            <span className="text-lg font-bold" style={{ color: theme.green }}>
              {(station.price * 100).toFixed(1)}
            </span>
            <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasGeofence) {
                  removeGeofence(station.id);
                  setHasGeofence(false);
                } else {
                  saveGeofence({ id: station.id, name: station.name, latitude: station.latitude, longitude: station.longitude, type: 'fuel' });
                  setHasGeofence(true);
                }
              }}
              className="text-sm leading-none"
              title={hasGeofence ? 'Remove alert' : 'Alert when nearby'}
              style={{ color: hasGeofence ? theme.gold : theme.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {hasGeofence ? '\uD83D\uDD14' : '\uD83D\uDD15'}
            </button>
            <button
              onClick={toggleFav}
              className="text-lg leading-none"
              title={fav ? 'Remove from favourites' : 'Add to favourites'}
              style={{ color: fav ? '#FFD700' : theme.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {fav ? '\u2605' : '\u2606'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>{station.address}</p>

      {/* Opening hours */}
      {hours && (
        <p className="text-[10px] mb-2" style={{ color: hours.isOpen === true ? theme.green : hours.isOpen === false ? '#ef4444' : theme.textMuted }}>
          🕐 {hours.isOpen === true ? 'Open now' : hours.isOpen === false ? 'Closed' : ''} {hours.display}
        </p>
      )}

      <div className="flex items-center justify-between text-xs" style={{ color: theme.textMuted }}>
        <div className="flex items-center gap-2">
          <span>{station.distance} km away</span>
          {station.driveTime != null && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: sortBy === 'driveTime'
                  ? `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`
                  : theme.chipBg,
                color: sortBy === 'driveTime' ? '#0D2B5E' : theme.textSecondary,
              }}
            >
              {station.driveTime} min drive
              {station.trafficDelay > 0 && ` (+${station.trafficDelay} traffic)`}
            </span>
          )}
        </div>
        <span>
          Updated {new Date(station.lastUpdated).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${theme.divider}` }}>
        {station.source && (
          <span className="text-[10px]" style={{ color: theme.textMuted }}>{station.source}</span>
        )}
        {onDetail && (
          <button
            onClick={(e) => { e.stopPropagation(); onDetail(); }}
            className="px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`,
              color: '#0D2B5E',
              border: 'none',
              transition: 'all 0.25s ease',
            }}
          >
            View Details &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
