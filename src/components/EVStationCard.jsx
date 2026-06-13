import { useTheme } from '../contexts/ThemeContext';
import StatusBadge from './StatusBadge';

export default function EVStationCard({ station, isSelected, onClick }) {
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
        <h3 className="text-sm font-semibold" style={{ color: theme.gold }}>
          {station.AddressInfo?.Title || 'Unknown Station'}
        </h3>
        <StatusBadge status={station.StatusType?.Title || 'Unknown'} />
      </div>

      <p className="text-xs mb-2" style={{ color: theme.textSecondary }}>
        {station.AddressInfo?.AddressLine1}
        {station.AddressInfo?.Town && `, ${station.AddressInfo.Town}`}
        {station.AddressInfo?.StateOrProvince && ` ${station.AddressInfo.StateOrProvince}`}
        {station.AddressInfo?.Postcode && ` ${station.AddressInfo.Postcode}`}
      </p>

      {station.OperatorInfo?.Title && (
        <p className="text-xs mb-2" style={{ color: theme.textMuted }}>
          &#x1F50C; {station.OperatorInfo.Title}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {station.Connections?.slice(0, 3).map((conn, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: conn.PowerKW >= 50
                ? theme.brandBadgeBg
                : (theme.mode === 'dark' ? 'rgba(26,111,219,0.15)' : 'rgba(26,111,219,0.08)'),
              color: conn.PowerKW >= 50 ? theme.gold : '#60A5FA',
              border: `1px solid ${conn.PowerKW >= 50 ? theme.brandBadgeBorder : (theme.mode === 'dark' ? 'rgba(26,111,219,0.3)' : 'rgba(26,111,219,0.2)')}`,
            }}
          >
            {conn.ConnectionType?.Title || 'Unknown'} {conn.PowerKW ? `\u2022 ${conn.PowerKW}kW` : ''}
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
