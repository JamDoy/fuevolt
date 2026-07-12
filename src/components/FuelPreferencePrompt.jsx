import { useTheme } from '../contexts/ThemeContext';
import { FUEL_PREFERENCES } from '../utils/sessionPreferences';

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
        <h2 id="fuel-preference-title" className="text-xl font-bold text-center" style={{ color: theme.text }}>
          What fuel does your car use?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {FUEL_PREFERENCES.map((preference) => (
            <button
              key={preference}
              type="button"
              onClick={() => onSelect(preference)}
              className="min-h-12 rounded-xl text-sm font-bold cursor-pointer"
              style={{
                background: preference === 'EV'
                  ? `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`
                  : `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`,
                color: preference === 'EV' ? '#FFFFFF' : '#0D2B5E',
                border: 'none',
              }}
            >
              {preference}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
