import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const OPTIONS = [
  {
    id: 'petrol',
    label: 'Petrol',
    sublabel: 'Find cheapest petrol near you',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="10" width="24" height="30" rx="3" stroke="#FFD700" strokeWidth="2.5" fill="none" />
        <rect x="12" y="14" width="16" height="10" rx="2" fill="rgba(255,215,0,0.15)" stroke="#FFD700" strokeWidth="1.5" />
        <path d="M32 18h6a2 2 0 012 2v14a3 3 0 01-3 3h0a3 3 0 01-3-3V22" stroke="#FFD700" strokeWidth="2" />
        <circle cx="38" cy="16" r="2" fill="#FFD700" />
        <rect x="17" y="30" width="6" height="6" rx="1" fill="#2ECC71" />
      </svg>
    ),
  },
  {
    id: 'diesel',
    label: 'Diesel',
    sublabel: 'Compare diesel prices nearby',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="8" y="10" width="24" height="30" rx="3" stroke="#60A5FA" strokeWidth="2.5" fill="none" />
        <rect x="12" y="14" width="16" height="10" rx="2" fill="rgba(96,165,250,0.15)" stroke="#60A5FA" strokeWidth="1.5" />
        <path d="M32 18h6a2 2 0 012 2v14a3 3 0 01-3 3h0a3 3 0 01-3-3V22" stroke="#60A5FA" strokeWidth="2" />
        <circle cx="38" cy="16" r="2" fill="#60A5FA" />
        <rect x="17" y="30" width="6" height="6" rx="1" fill="#FFD700" />
      </svg>
    ),
  },
  {
    id: 'ev',
    label: 'EV Charging',
    sublabel: 'Locate charging stations',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path d="M20 8l-8 18h10l-4 14 14-20H22l6-12H20z" fill="rgba(46,204,113,0.15)" stroke="#2ECC71" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function LandingPage({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
          <span style={{ color: theme.text }}>Find the </span>
          <span style={{ color: theme.gold }}>cheapest fuel</span>
        </h1>
        <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: theme.textSecondary }}>
          Compare real-time fuel prices across Australian service stations
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl animate-slide-up">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            onMouseEnter={() => setHovered(opt.id)}
            onMouseLeave={() => setHovered(null)}
            className="group relative flex flex-col items-center gap-4 p-8 rounded-3xl cursor-pointer border"
            style={{
              background: isDark
                ? theme.cardBg
                : theme.cardBg,
              borderColor: hovered === opt.id
                ? (isDark ? 'rgba(255,215,0,0.5)' : 'rgba(200,151,31,0.5)')
                : theme.cardBorder,
              boxShadow: hovered === opt.id
                ? (isDark
                    ? '0 0 40px rgba(255,215,0,0.08), 0 20px 60px rgba(0,0,0,0.3)'
                    : '0 0 40px rgba(200,151,31,0.1), 0 20px 40px rgba(0,0,0,0.08)')
                : (isDark
                    ? '0 4px 20px rgba(0,0,0,0.2)'
                    : '0 2px 12px rgba(0,0,0,0.06)'),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hovered === opt.id ? 'translateY(-4px)' : 'translateY(0)',
            }}
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: theme.glassBg,
                border: `1px solid ${theme.glassBorder}`,
              }}
            >
              {opt.icon}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold mb-1" style={{ color: theme.text }}>{opt.label}</h3>
              <p className="text-xs" style={{ color: theme.textSecondary }}>{opt.sublabel}</p>
            </div>
            <div
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: hovered === opt.id
                  ? 'linear-gradient(135deg, #C8971F, #FFD700)'
                  : theme.chipBg,
                color: hovered === opt.id ? '#0D2B5E' : theme.chipText,
                transition: 'all 0.3s ease',
              }}
            >
              Search &rarr;
            </div>
          </button>
        ))}
      </div>

      {/* Footer tagline */}
      <p className="text-xs mt-10 text-center" style={{ color: theme.textMuted }}>
        Real-time data from NSW, WA & more &bull; EV data from Open Charge Map
      </p>
    </div>
  );
}
