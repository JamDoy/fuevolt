export default function FuelStationCard({ station, isSelected, onClick, rank }) {
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
        <div className="flex items-start gap-3">
          {rank != null && (
            <span
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: rank === 0
                  ? 'linear-gradient(135deg, #2ECC71, #27AE60)'
                  : rank < 3
                    ? 'rgba(46,204,113,0.15)'
                    : 'rgba(255,255,255,0.06)',
                color: rank < 3 ? '#2ECC71' : '#9CA3AF',
              }}
            >
              {rank + 1}
            </span>
          )}
          <div>
            <h3 className="text-sm font-semibold" style={{ color: '#FFD700' }}>
              {station.name}
            </h3>
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1"
              style={{
                background: 'rgba(255,215,0,0.1)',
                color: '#FFD700',
                border: '1px solid rgba(255,215,0,0.3)',
              }}
            >
              {station.brand}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: '#2ECC71' }}>
            {(station.price * 100).toFixed(1)}
          </span>
          <span className="text-xs text-gray-400 ml-0.5">¢/L</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-2">{station.address}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{station.distance} km away</span>
        <span>
          Updated {new Date(station.lastUpdated).toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {station.source && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-[10px] text-gray-600">{station.source}</span>
        </div>
      )}
    </div>
  );
}
