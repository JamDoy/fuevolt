import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import StatusBadge from './StatusBadge';
import { isFavourite, addFavourite, removeFavourite } from '../utils/favourites';
import { saveGeofence, removeGeofence, getSavedGeofences } from '../utils/tomtom';

export default function EVStationCard({ station, isSelected, onClick, availability }) {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [fav, setFav] = useState(() => isFavourite(`ev-${station.ID}`));
  const [hasGeofence, setHasGeofence] = useState(() => getSavedGeofences().some((f) => f.id === `ev-${station.ID}`));
  const [visible, setVisible] = useState(false);
  const cardRef = useRef(null);

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
    const id = `ev-${station.ID}`;
    if (fav) {
      removeFavourite(id);
      setFav(false);
    } else {
      addFavourite({ id, name: station.AddressInfo?.Title, type: 'ev' });
      setFav(true);
    }
  };

  const maxPower = station.Connections
    ? Math.max(...station.Connections.map((c) => c.PowerKW || 0))
    : 0;

  const speedLabel = maxPower >= 50 ? 'Ultra-Rapid' : maxPower >= 7 ? 'Fast' : 'Slow';
  const speedColor = maxPower >= 50 ? theme.gold : maxPower >= 7 ? theme.green : theme.textMuted;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer"
      style={{
        background: theme.cardBg,
        border: isSelected
          ? `2px solid ${theme.green}`
          : `1px solid ${isDark ? 'rgba(46,204,113,0.15)' : theme.cardBorder}`,
        boxShadow: isSelected
          ? (isDark ? '0 0 20px rgba(46,204,113,0.15) inset' : '0 0 12px rgba(39,174,96,0.1) inset')
          : theme.cardGlowDefault,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* EV icon badge */}
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{
              background: isDark ? 'rgba(46,204,113,0.15)' : 'rgba(39,174,96,0.1)',
              color: theme.green,
              border: `1px solid ${isDark ? 'rgba(46,204,113,0.3)' : 'rgba(39,174,96,0.2)'}`,
            }}
          >
            ⚡
          </span>
          <h3 className="text-sm font-semibold truncate" style={{ color: theme.green }}>
            {station.AddressInfo?.Title || 'EV Station'}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const id = `ev-${station.ID}`;
              if (hasGeofence) {
                removeGeofence(id);
                setHasGeofence(false);
              } else {
                saveGeofence({
                  id,
                  name: station.AddressInfo?.Title || 'EV Station',
                  latitude: station.AddressInfo?.Latitude,
                  longitude: station.AddressInfo?.Longitude,
                  type: 'ev',
                });
                setHasGeofence(true);
              }
            }}
            className="text-sm leading-none cursor-pointer"
            title={hasGeofence ? 'Remove alert' : 'Alert when nearby'}
            style={{ color: hasGeofence ? theme.green : theme.textMuted, border: 'none', background: 'none' }}
          >
            {hasGeofence ? '\uD83D\uDD14' : '\uD83D\uDD15'}
          </button>
          <button
            onClick={toggleFav}
            className="text-lg leading-none cursor-pointer"
            title={fav ? 'Remove from favourites' : 'Add to favourites'}
            style={{ color: fav ? '#2ECC71' : theme.textMuted, border: 'none', background: 'none' }}
          >
            {fav ? '\u2605' : '\u2606'}
          </button>
          <StatusBadge status={station.StatusType?.Title || 'Unknown'} />
        </div>
      </div>

      <p className="text-xs mb-2" style={{ color: theme.textSecondary }}>
        {station.AddressInfo?.AddressLine1}
        {station.AddressInfo?.Town && `, ${station.AddressInfo.Town}`}
        {station.AddressInfo?.StateOrProvince && ` ${station.AddressInfo.StateOrProvince}`}
        {station.AddressInfo?.Postcode && ` ${station.AddressInfo.Postcode}`}
      </p>

      {station.OperatorInfo?.Title && (
        <p className="text-xs mb-2" style={{ color: theme.textMuted }}>
          🔌 {station.OperatorInfo.Title}
        </p>
      )}

      {/* Speed indicator + Availability */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            background: maxPower >= 50
              ? (isDark ? 'rgba(255,215,0,0.1)' : 'rgba(200,151,31,0.08)')
              : (isDark ? 'rgba(46,204,113,0.1)' : 'rgba(39,174,96,0.06)'),
            color: speedColor,
            border: `1px solid ${maxPower >= 50
              ? (isDark ? 'rgba(255,215,0,0.3)' : 'rgba(200,151,31,0.2)')
              : (isDark ? 'rgba(46,204,113,0.3)' : 'rgba(39,174,96,0.2)')}`,
          }}
        >
          {speedLabel} {'\u2022'} {maxPower}kW
        </span>
        {availability && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: availability.available > 0
                ? (isDark ? 'rgba(46,204,113,0.15)' : 'rgba(39,174,96,0.1)')
                : (isDark ? 'rgba(231,76,60,0.15)' : 'rgba(231,76,60,0.1)'),
              color: availability.available > 0 ? theme.green : '#E74C3C',
              border: `1px solid ${availability.available > 0
                ? (isDark ? 'rgba(46,204,113,0.3)' : 'rgba(39,174,96,0.2)')
                : (isDark ? 'rgba(231,76,60,0.3)' : 'rgba(231,76,60,0.2)')}`,
            }}
          >
            {availability.available > 0
              ? `${availability.available}/${availability.total} Available`
              : 'All In Use'}
            {availability.outOfService > 0 && ` | ${availability.outOfService} Offline`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {station.Connections?.slice(0, 3).map((conn, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: isDark ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.05)',
              color: theme.green,
              border: `1px solid ${isDark ? 'rgba(46,204,113,0.2)' : 'rgba(39,174,96,0.15)'}`,
            }}
          >
            {conn.ConnectionType?.Title || 'Unknown'} {conn.PowerKW ? `• ${conn.PowerKW}kW` : ''}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: theme.textMuted }}>
        <span>
          {station.NumberOfPoints ? `${station.NumberOfPoints} point${station.NumberOfPoints > 1 ? 's' : ''}` : ''}
        </span>
        {station.UsageType?.Title && (
          <span className="text-[10px]">{station.UsageType.Title}</span>
        )}
      </div>
    </div>
  );
}
