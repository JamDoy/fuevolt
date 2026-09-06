import { useTheme } from '../contexts/ThemeContext';

function PlugIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="9" width="10" height="9" rx="2" />
      <line x1="8" y1="9" x2="8" y2="4" />
      <line x1="12" y1="9" x2="12" y2="4" />
      <line x1="15" y1="13" x2="20" y2="13" />
    </svg>
  );
}

function BoltIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z" />
    </svg>
  );
}

const ICONS = { plug: PlugIcon, bolt: BoltIcon };

// Same colored-pill-with-icon visual language as FuelTypeSelector, but for
// multi-select toggle groups (EV connector/speed filters allow more than one
// active at once) rather than a single active value.
export default function ColorFilterChips({ options, activeIds, onToggle, label, size = 'compact' }) {
  const { theme } = useTheme();
  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-[11px] rounded-full min-h-7'
    : size === 'compact'
      ? 'px-3 py-1.5 text-xs rounded-full min-h-9'
      : 'px-4 py-2 text-sm rounded-xl min-h-10';
  const iconSize = size === 'sm' ? 11 : 14;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {label && <span className="text-xs mr-1" style={{ color: theme.textSecondary }}>{label}</span>}
      {options.map((opt) => {
        const active = activeIds.includes(opt.id);
        const Icon = ICONS[opt.icon] || PlugIcon;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 font-semibold cursor-pointer active:scale-95 ${sizeClasses}`}
            style={{
              transition: 'all 0.2s ease',
              border: `1px solid ${active ? opt.color : opt.color + '33'}`,
              background: active ? opt.color : opt.color + '14',
              color: active ? (opt.activeText || '#FFFFFF') : (opt.mutedText ? theme.text : opt.color),
              boxShadow: active ? `0 0 14px ${opt.color}66` : 'none',
              transform: active ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <Icon size={iconSize} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
