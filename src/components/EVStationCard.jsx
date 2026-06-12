import StatusBadge from './StatusBadge';

export default function EVStationCard({ station, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer"
      style={{
        background: '#0D2B5E',
        border: isSelected ? '1px solid #2ECC71' : '1px solid rgba(255,215,0,0.2)',
        boxShadow: isSelected
          ? '0 0 20px rgba(46,204,113,0.15) inset'
          : '0 0 12px rgba(26,111,219,0.08) inset',
        transition: 'all 0.25s ease',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: '#FFD700' }}>
          {station.AddressInfo?.Title || 'Unknown Station'}
        </h3>
        <StatusBadge status={station.StatusType?.Title || 'Unknown'} />
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {station.AddressInfo?.AddressLine1}
        {station.AddressInfo?.Town && `, ${station.AddressInfo.Town}`}
        {station.AddressInfo?.StateOrProvince && ` ${station.AddressInfo.StateOrProvince}`}
        {station.AddressInfo?.Postcode && ` ${station.AddressInfo.Postcode}`}
      </p>

      {station.OperatorInfo?.Title && (
        <p className="text-xs text-gray-500 mb-2">
          🔌 {station.OperatorInfo.Title}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {station.Connections?.slice(0, 3).map((conn, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: conn.PowerKW >= 50
                ? 'rgba(255,215,0,0.15)'
                : 'rgba(26,111,219,0.15)',
              color: conn.PowerKW >= 50 ? '#FFD700' : '#60A5FA',
              border: `1px solid ${conn.PowerKW >= 50 ? 'rgba(255,215,0,0.3)' : 'rgba(26,111,219,0.3)'}`,
            }}
          >
            {conn.ConnectionType?.Title || 'Unknown'} {conn.PowerKW ? `• ${conn.PowerKW}kW` : ''}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
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
