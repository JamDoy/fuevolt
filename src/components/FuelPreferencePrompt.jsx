import { useTheme } from '../contexts/ThemeContext';

const OPTIONS = [
  { label: 'Petrol', value: 'U91', icon: '⛽' },
  { label: 'Diesel', value: 'Diesel', icon: '🚚' },
  { label: 'EV', value: 'EV', icon: '⚡' },
];

export default function FuelPreferencePrompt({ onSelect }) {
  const { theme } = useTheme();

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(5, 15, 32, 0.72)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fuel-preference-title"
    >
      <div
        className="w-full max-w-md rounded-3xl p-6"
        style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #C8971F, #FFD700)', color: '#0D2B5E' }}
            aria-hidden="true"
          >
            FV
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: theme.text }}>
            Fue<span style={{ color: theme.gold }}>Volt</span>
          </span>
        </div>

        <h2 id="fuel-preference-title" className="text-xl font-bold text-center" style={{ color: theme.text }}>
          What fuel does your car use?
        </h2>
        <p className="text-xs text-center mt-1" style={{ color: theme.textMuted }}>
          We'll find the cheapest nearby option for you
        </p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="min-h-16 rounded-xl text-sm font-bold cursor-pointer flex flex-col items-center justify-center gap-1"
              style={{
                background: option.value === 'EV'
                  ? `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`
                  : `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`,
                color: option.value === 'EV' ? '#FFFFFF' : '#0D2B5E',
                border: 'none',
              }}
            >
              <span className="text-lg" aria-hidden="true">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
