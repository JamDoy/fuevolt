import { useTheme } from '../contexts/ThemeContext';

export default function FilterChips({ filters, activeFilters, onToggle, label }) {
  const { theme } = useTheme();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {label && <span className="text-xs mr-1" style={{ color: theme.textSecondary }}>{label}</span>}
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
                    background: `linear-gradient(135deg, ${theme.green}, ${theme.greenDark})`,
                    borderColor: theme.green,
                    color: '#FFFFFF',
                  }
                : {
                    background: theme.chipBg,
                    borderColor: theme.chipBorder,
                    color: theme.chipText,
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
