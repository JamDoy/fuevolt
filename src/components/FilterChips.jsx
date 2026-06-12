export default function FilterChips({ filters, activeFilters, onToggle, label }) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {label && <span className="text-xs text-gray-400 mr-1">{label}</span>}
      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter);
        return (
          <button
            key={filter}
            onClick={() => onToggle(filter)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            style={{
              transition: 'all 0.25s ease',
              border: '1px solid',
              ...(isActive
                ? {
                    background: 'linear-gradient(135deg, #2ECC71, #27AE60)',
                    borderColor: '#2ECC71',
                    color: '#FFFFFF',
                  }
                : {
                    background: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    color: '#9CA3AF',
                  }),
            }}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
