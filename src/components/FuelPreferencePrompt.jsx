import { useTheme } from '../contexts/ThemeContext';

function FuelPumpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 22h10" />
      <path d="M6 22V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v17" />
      <path d="M6 11h6" />
      <path d="M13 8h2.5a1.5 1.5 0 0 1 1.5 1.5V15a1.5 1.5 0 0 0 3 0V8.8a1 1 0 0 0-.3-.7L17 5.5" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4h11v12H2z" />
      <path d="M13 9h4l4 3.5V16h-8z" />
      <circle cx="6" cy="18" r="1.75" />
      <circle cx="17.5" cy="18" r="1.75" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

const OPTIONS = [
  { label: 'Petrol', value: 'U91', Icon: FuelPumpIcon },
  { label: 'Diesel', value: 'Diesel', Icon: TruckIcon },
  { label: 'EV', value: 'EV', Icon: BoltIcon },
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
          {OPTIONS.map(({ label, value, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className="min-h-16 rounded-xl text-sm font-bold cursor-pointer flex flex-col items-center justify-center gap-1"
              style={{
                background: value === 'EV'
                  ? `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`
                  : `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`,
                color: value === 'EV' ? '#FFFFFF' : '#0D2B5E',
                border: 'none',
              }}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
