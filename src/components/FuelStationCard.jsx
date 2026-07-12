import { useRef, useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { formatOpeningHours } from '../utils/brandLogos';
import { isFavourite, addFavourite, removeFavourite } from '../utils/favourites';
import { saveGeofence, removeGeofence, getSavedGeofences } from '../utils/tomtom';
import { getPriceContext, getPriceFreshness } from '../utils/priceFreshness';

export default function FuelStationCard({ station, isSelected, onClick, onDetail, rank, sortBy, averagePrice }) {
  const { theme } = useTheme();
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [fav, setFav] = useState(() => isFavourite(station.id));
  const [hasGeofence, setHasGeofence] = useState(() => getSavedGeofences().some((geofence) => geofence.id === station.id));
  const hours = formatOpeningHours(station.openingHours);
  const freshness = getPriceFreshness(station.lastUpdated, station.priceDate);
  const priceContext = getPriceContext(station.price, averagePrice);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleFav = (event) => {
    event.stopPropagation();
    if (fav) {
      removeFavourite(station.id);
      setFav(false);
    } else {
      addFavourite(station);
      setFav(true);
    }
  };

  const toggleGeofence = (event) => {
    event.stopPropagation();
    if (hasGeofence) {
      removeGeofence(station.id);
      setHasGeofence(false);
    } else {
      saveGeofence({ id: station.id, name: station.name, latitude: station.latitude, longitude: station.longitude, type: 'fuel' });
      setHasGeofence(true);
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer"
      style={{
        background: theme.cardBg,
        border: isSelected ? `1px solid ${theme.cardBorderActive}` : `1px solid ${theme.cardBorder}`,
        boxShadow: isSelected ? theme.cardGlow : theme.cardGlowDefault,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {rank != null && (
              <span className="text-[10px] font-bold" style={{ color: rank === 0 ? theme.green : theme.textMuted }}>
                #{rank + 1}
              </span>
            )}
            <p className="text-sm font-bold truncate" style={{ color: theme.text }}>{station.name}</p>
          </div>
          {station.brand && station.brand !== station.name && (
            <p className="text-xs mt-1 truncate" style={{ color: theme.textMuted }}>{station.brand}</p>
          )}
          <p className="text-lg font-bold mt-3" style={{ color: theme.text }}>
            {station.distance} km
            <span className="text-xs font-medium ml-1" style={{ color: theme.textMuted }}>away</span>
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          {station.price != null ? (
            <p className="text-3xl font-black leading-none" style={{ color: theme.gold }}>
              {(station.price * 100).toFixed(1)}
              <span className="text-xs ml-0.5 font-semibold" style={{ color: theme.textSecondary }}>¢/L</span>
            </p>
          ) : (
            <p className="text-xs font-medium" style={{ color: theme.textMuted }}>No price data</p>
          )}
          {priceContext && <PriceContextBadge context={priceContext} theme={theme} />}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>{station.price != null ? freshness.label : 'No live price update available'}</p>
          {freshness.isOutdated && (
            <span className="inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(231,76,60,0.14)', color: '#E74C3C' }}>
              Price may be outdated ⚠️
            </span>
          )}
        </div>
        {onDetail && (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onDetail(); }}
            className="min-h-10 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`, color: '#0D2B5E', border: 'none' }}
          >
            Station page
          </button>
        )}
      </div>

      <details className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.divider}` }} onClick={(event) => event.stopPropagation()}>
        <summary className="text-xs font-semibold cursor-pointer" style={{ color: theme.textSecondary }}>
          View details
        </summary>
        <div className="pt-3 space-y-2">
          {station.address && <p className="text-xs" style={{ color: theme.textSecondary }}>{station.address}</p>}
          {hours && (
            <p className="text-[10px]" style={{ color: hours.isOpen === true ? theme.green : hours.isOpen === false ? '#E74C3C' : theme.textMuted }}>
              {hours.isOpen === true ? 'Open now' : hours.isOpen === false ? 'Closed' : ''} {hours.display}
            </p>
          )}
          {station.driveTime != null && (
            <p className="text-xs" style={{ color: sortBy === 'driveTime' ? theme.gold : theme.textMuted }}>
              {station.driveTime} min drive{station.trafficDelay > 0 ? ` (+${station.trafficDelay} min traffic)` : ''}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={toggleGeofence} className="px-3 py-2 rounded-lg text-xs cursor-pointer" style={{ background: theme.chipBg, color: hasGeofence ? theme.gold : theme.textMuted, border: 'none' }}>
              {hasGeofence ? 'Alert saved' : 'Set nearby alert'}
            </button>
            <button type="button" onClick={toggleFav} className="px-3 py-2 rounded-lg text-xs cursor-pointer" style={{ background: theme.chipBg, color: fav ? theme.gold : theme.textMuted, border: 'none' }}>
              {fav ? 'Saved' : 'Save station'}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

function PriceContextBadge({ context, theme }) {
  const styles = {
    below: { label: 'Below average', background: 'rgba(39,174,96,0.14)', color: theme.green },
    about: { label: 'About average', background: 'rgba(255,215,0,0.14)', color: theme.gold },
    above: { label: 'Above average', background: 'rgba(231,76,60,0.14)', color: '#E74C3C' },
  };
  const style = styles[context];

  return (
    <span className="inline-block mt-2 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: style.background, color: style.color }}>
      {style.label}
    </span>
  );
}
