import { useTheme } from '../contexts/ThemeContext';
import StatusBadge from './StatusBadge';

export default function EVDetailPanel({ station, onClose }) {
  const { theme } = useTheme();

  if (!station) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: theme.overlayBg,
          backdropFilter: 'blur(12px)',
        }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl p-6"
        style={{
          background: theme.panelBg,
          border: `1px solid ${theme.mode === 'dark' ? 'rgba(255,215,0,0.3)' : 'rgba(200,151,31,0.25)'}`,
          boxShadow: theme.mode === 'dark'
            ? '0 0 40px rgba(26,111,219,0.2)'
            : '0 8px 40px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: theme.chipBg,
            border: 'none',
            color: theme.text,
            transition: 'all 0.25s ease',
          }}
        >
          &#x2715;
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-1 pr-8" style={{ color: theme.gold }}>
          {station.AddressInfo?.Title}
        </h2>

        {/* Status */}
        <div className="mb-4">
          <StatusBadge status={station.StatusType?.Title || 'Unknown'} />
        </div>

        {/* Address */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Address</h4>
          <p className="text-sm" style={{ color: theme.text }}>
            {station.AddressInfo?.AddressLine1}
            <br />
            {station.AddressInfo?.Town}, {station.AddressInfo?.StateOrProvince} {station.AddressInfo?.Postcode}
          </p>
        </div>

        {/* Coordinates */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>GPS Coordinates</h4>
          <p className="text-sm font-mono" style={{ color: theme.text }}>
            {station.AddressInfo?.Latitude?.toFixed(5)}, {station.AddressInfo?.Longitude?.toFixed(5)}
          </p>
        </div>

        {/* Operator */}
        {station.OperatorInfo?.Title && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Network Operator</h4>
            <p className="text-sm" style={{ color: theme.text }}>{station.OperatorInfo.Title}</p>
          </div>
        )}

        {/* Charging points */}
        {station.NumberOfPoints && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Charging Points</h4>
            <p className="text-sm" style={{ color: theme.text }}>{station.NumberOfPoints}</p>
          </div>
        )}

        {/* Connectors */}
        {station.Connections?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Connectors</h4>
            <div className="space-y-2">
              {station.Connections.map((conn, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: theme.glassBg,
                    border: `1px solid ${theme.glassBorder}`,
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.text }}>
                      {conn.ConnectionType?.Title || 'Unknown'}
                    </p>
                    {conn.CurrentType?.Title && (
                      <p className="text-xs" style={{ color: theme.textSecondary }}>{conn.CurrentType.Title}</p>
                    )}
                  </div>
                  {conn.PowerKW && (
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-lg"
                      style={{
                        color: conn.PowerKW >= 50 ? theme.gold : '#60A5FA',
                        background: conn.PowerKW >= 50
                          ? theme.brandBadgeBg
                          : (theme.mode === 'dark' ? 'rgba(96,165,250,0.1)' : 'rgba(96,165,250,0.08)'),
                      }}
                    >
                      {conn.PowerKW} kW
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage/Cost */}
        {station.UsageType?.Title && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase mb-1" style={{ color: theme.textSecondary }}>Usage / Cost</h4>
            <p className="text-sm" style={{ color: theme.text }}>{station.UsageType.Title}</p>
          </div>
        )}

        {/* Directions button */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${station.AddressInfo?.Latitude},${station.AddressInfo?.Longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center py-3 rounded-xl text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, #C8971F, #FFD700)',
            color: '#0D2B5E',
            transition: 'all 0.25s ease',
          }}
        >
          Get Directions &#x2192;
        </a>
      </div>
    </div>
  );
}
