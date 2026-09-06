import { useTheme } from '../contexts/ThemeContext';

// Colors match real Australian bowser nozzle/signage conventions where one
// exists (diesel black, 91 blue, E10 green, premium yellow) — checked
// against an actual pump photo. 98 and LPG have no single standard color
// at the pump, so those two just carry their own distinct brand-style
// accent (purple, orange) rather than mimicking a real signage color.
// Shared by every page with a fuel-type selector so they can't drift apart.
export const FUEL_TYPES = [
  { id: 'E10', label: 'E10', color: '#22C55E' },
  { id: 'U91', label: 'Petrol 91', color: '#3B82F6' },
  { id: 'U95', label: 'Petrol 95', color: '#FACC15', activeText: '#422006' },
  { id: 'U98', label: 'Petrol 98', color: '#A855F7' },
  { id: 'Diesel', label: 'Diesel', color: '#4B5563', activeText: '#FFFFFF', mutedText: true },
  { id: 'LPG', label: 'LPG', color: '#F97316' },
];

// Fuel-pump glyph, reused for every chip.
function FuelTypeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8v18H6V3Zm2 3v5h4V6H8Zm6 2h2l2 2v8a2 2 0 0 1-4 0v-5" />
    </svg>
  );
}

// `size="compact"` (default) matches the pill row next to the search bar on
// Fuel Prices; `size="regular"` matches the larger standalone tab row on
// Trends. `options` lets a caller narrow to a subset (e.g. just petrol/diesel).
export default function FuelTypeSelector({ value, onChange, options = FUEL_TYPES, size = 'compact', className = '' }) {
  const { theme } = useTheme();
  const sizeClasses = size === 'compact'
    ? 'px-3 py-1.5 text-xs rounded-full min-h-9'
    : 'px-4 py-2 text-sm rounded-xl min-h-10';

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((ft) => {
        const active = value === ft.id;
        return (
          <button
            key={ft.id}
            type="button"
            onClick={() => onChange(ft.id)}
            className={`flex items-center gap-1.5 font-semibold cursor-pointer active:scale-95 ${sizeClasses}`}
            style={{
              transition: 'all 0.2s ease',
              border: `1px solid ${active ? ft.color : ft.color + '33'}`,
              background: active ? ft.color : ft.color + '14',
              color: active ? (ft.activeText || '#FFFFFF') : (ft.mutedText ? theme.text : ft.color),
              boxShadow: active ? `0 0 14px ${ft.color}66` : 'none',
              transform: active ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <FuelTypeIcon />
            {ft.label}
          </button>
        );
      })}
    </div>
  );
}
