import StatusBadge from './StatusBadge';

export default function EVDetailPanel({ station, onClose }) {
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
          background: 'rgba(10, 22, 40, 0.8)',
          backdropFilter: 'blur(12px)',
        }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl p-6"
        style={{
          background: 'linear-gradient(180deg, #0D2B5E 0%, #0A1628 100%)',
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 40px rgba(26,111,219,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#FFFFFF',
            transition: 'all 0.25s ease',
          }}
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-1 pr-8" style={{ color: '#FFD700' }}>
          {station.AddressInfo?.Title}
        </h2>

        {/* Status */}
        <div className="mb-4">
          <StatusBadge status={station.StatusType?.Title || 'Unknown'} />
        </div>

        {/* Address */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Address</h4>
          <p className="text-sm text-white">
            {station.AddressInfo?.AddressLine1}
            <br />
            {station.AddressInfo?.Town}, {station.AddressInfo?.StateOrProvince} {station.AddressInfo?.Postcode}
          </p>
        </div>

        {/* Coordinates */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">GPS Coordinates</h4>
          <p className="text-sm text-white font-mono">
            {station.AddressInfo?.Latitude?.toFixed(5)}, {station.AddressInfo?.Longitude?.toFixed(5)}
          </p>
        </div>

        {/* Operator */}
        {station.OperatorInfo?.Title && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Network Operator</h4>
            <p className="text-sm text-white">{station.OperatorInfo.Title}</p>
          </div>
        )}

        {/* Charging points */}
        {station.NumberOfPoints && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Charging Points</h4>
            <p className="text-sm text-white">{station.NumberOfPoints}</p>
          </div>
        )}

        {/* Connectors */}
        {station.Connections?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Connectors</h4>
            <div className="space-y-2">
              {station.Connections.map((conn, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div>
                    <p className="text-sm text-white font-medium">
                      {conn.ConnectionType?.Title || 'Unknown'}
                    </p>
                    {conn.CurrentType?.Title && (
                      <p className="text-xs text-gray-400">{conn.CurrentType.Title}</p>
                    )}
                  </div>
                  {conn.PowerKW && (
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-lg"
                      style={{
                        color: conn.PowerKW >= 50 ? '#FFD700' : '#60A5FA',
                        background: conn.PowerKW >= 50
                          ? 'rgba(255,215,0,0.1)'
                          : 'rgba(96,165,250,0.1)',
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
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-1">Usage / Cost</h4>
            <p className="text-sm text-white">{station.UsageType.Title}</p>
          </div>
        )}

        {/* Directions button */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${station.AddressInfo?.Latitude},${station.AddressInfo?.Longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-xl text-sm font-semibold mt-4 no-underline"
          style={{
            background: 'linear-gradient(135deg, #C8971F, #FFD700)',
            color: '#0D2B5E',
            transition: 'all 0.25s ease',
          }}
        >
          🧭 Get Directions
        </a>
      </div>
    </div>
  );
}
