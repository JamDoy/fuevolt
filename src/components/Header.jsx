import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TABS = [
  { id: 'fuel', label: 'Fuel Prices', icon: '\u26FD' },
  { id: 'ev', label: 'EV Charging', icon: '\u26A1' },
];

export default function Header({ showBack, onBack, view, onViewChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-50 px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, #1A6FDB 0%, #0D2B5E 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: Back + Logo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#FFFFFF',
                transition: 'all 0.25s ease',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10 2L4 8l6 6" />
              </svg>
            </button>
          )}
          <button
            onClick={showBack ? onBack : undefined}
            className="flex items-center gap-2 cursor-pointer"
            style={{ background: 'none', border: 'none' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold logo-charge-icon"
              style={{
                background: 'linear-gradient(135deg, #C8971F, #FFD700)',
                color: '#0D2B5E',
              }}
            >
              FV
            </div>
            <span className="text-xl font-bold tracking-tight logo-charge" style={{ color: '#FFFFFF' }}>
              Fue<span className="logo-charge-volt" style={{ color: '#FFD700' }}>Volt</span>
            </span>
          </button>
        </div>

        {/* Center: Desktop Tabs */}
        {showBack && (
          <nav className="hidden md:flex items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className="px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
                style={{
                  transition: 'all 0.25s ease',
                  ...(view === tab.id
                    ? {
                        background: 'linear-gradient(135deg, #2ECC71, #27AE60)',
                        color: '#FFFFFF',
                        boxShadow: '0 0 12px rgba(46, 204, 113, 0.3)',
                      }
                    : {
                        background: 'rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                      }),
                }}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* Right: Theme toggle + Mobile menu */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#FFD700',
              transition: 'all 0.25s ease',
            }}
            title={theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme.mode === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Mobile menu button */}
          {showBack && (
            <button
              className="md:hidden text-white p-2 cursor-pointer"
              style={{ background: 'none', border: 'none' }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && showBack && (
        <div className="md:hidden mt-3 flex flex-col gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onViewChange(tab.id);
                setMenuOpen(false);
              }}
              className="px-4 py-3 rounded-xl text-sm font-semibold text-left cursor-pointer"
              style={{
                transition: 'all 0.25s ease',
                ...(view === tab.id
                  ? {
                      background: 'linear-gradient(135deg, #2ECC71, #27AE60)',
                      color: '#FFFFFF',
                    }
                  : {
                      background: 'rgba(255,255,255,0.08)',
                      color: '#FFFFFF',
                    }),
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
