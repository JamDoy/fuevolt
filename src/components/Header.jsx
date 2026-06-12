import { useState } from 'react';

const TABS = [
  { id: 'fuel', label: 'Fuel Prices', icon: '⛽' },
  { id: 'ev', label: 'EV Charging', icon: '⚡' },
];

export default function Header({ showBack, onBack, view, onViewChange }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #C8971F, #FFD700)',
                color: '#0D2B5E',
              }}
            >
              FV
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Fue<span style={{ color: '#FFD700' }}>Volt</span>
            </span>
          </button>
        </div>

        {/* Desktop Tabs — only show when not on landing */}
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

        {/* Mobile menu button — only when not on landing */}
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
