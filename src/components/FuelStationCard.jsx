import { useTheme } from '../contexts/ThemeContext';

export default function FuelStationCard({ station, isSelected, onClick, onDetail, rank }) {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer"
      style={{
        background: theme.cardBg,
        border: isSelected ? `1px solid ${theme.cardBorderActive}` : `1px solid ${theme.cardBorder}`,
        boxShadow: isSelected ? theme.cardGlow : theme.cardGlowDefault,
        transition: 'all 0.25s ease',
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
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: theme.green }}>
            {(station.price * 100).toFixed(1)}
          </span>
          <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>&cent;/L</span>
        </div>
      </div>

      <p className="text-xs mb-2" style={{ color: theme.textSecondary }}>{station.address}</p>

      <div className="flex items-center justify-between text-xs" style={{ color: theme.textMuted }}>
        <span>{station.distance} km away</span>
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
