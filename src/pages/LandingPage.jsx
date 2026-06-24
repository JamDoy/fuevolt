import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import LatestNews from '../components/LatestNews';

const FEATURED_ARTICLES = [
  { slug: 'fuel-types-explained', title: 'Fuel Types Explained: E10, U91, U95, U98, Diesel', category: 'Fuel Guide', readTime: '6 min' },
  { slug: 'ev-charging-connector-types-australia', title: 'EV Charging Connectors: Type 2, CCS, CHAdeMO', category: 'EV Guide', readTime: '6 min' },
  { slug: 'tips-to-save-money-on-fuel-australia', title: '10 Tips to Save Money on Fuel', category: 'Tips', readTime: '6 min' },
  { slug: 'petrol-vs-diesel-vs-electric-comparison', title: 'Petrol vs Diesel vs Electric: Cost Comparison', category: 'Comparison', readTime: '7 min' },
];

function FeaturedArticles({ theme, isDark, onArticle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {FEATURED_ARTICLES.map((a) => (
        <button
          key={a.slug}
          onClick={() => onArticle && onArticle(a.slug)}
          className="text-left rounded-xl p-4 transition-all hover:scale-[1.01] cursor-pointer"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder || theme.border}` }}
        >
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold mb-2"
            style={{
              background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(200,151,31,0.08)',
              color: theme.gold,
            }}
          >
            {a.category}
          </span>
          <h3 className="text-xs font-semibold leading-snug" style={{ color: theme.heading || theme.text }}>
            {a.title}
          </h3>
          <span className="text-[9px] mt-1 block" style={{ color: theme.textMuted }}>{a.readTime} read</span>
        </button>
      ))}
    </div>
  );
}

export default function LandingPage({ onSelect, onArticle }) {
  const [hovered, setHovered] = useState(null);
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
          <span style={{ color: theme.text }}>Find the </span>
          <span style={{ color: theme.gold }}>cheapest fuel</span>
          <span style={{ color: theme.text }}> & </span>
          <span style={{ color: theme.green }}>charge</span>
        </h1>
        <p className="text-base sm:text-lg max-w-lg mx-auto" style={{ color: theme.textSecondary }}>
          Compare real-time fuel prices and locate EV charging stations across Australia
        </p>
      </div>

      {/* 50/50 Split — Fuel vs EV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-slide-up">
        {/* Fuel Panel */}
        <div
          onMouseEnter={() => setHovered('fuel')}
          onMouseLeave={() => setHovered(null)}
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{
            background: isDark ? theme.cardBg : theme.cardBg,
            border: hovered === 'fuel'
              ? `2px solid ${theme.gold}`
              : `1px solid ${theme.cardBorder}`,
            boxShadow: hovered === 'fuel'
              ? (isDark
                  ? '0 0 50px rgba(255,215,0,0.12), 0 20px 60px rgba(0,0,0,0.4)'
                  : '0 0 40px rgba(200,151,31,0.15), 0 20px 40px rgba(0,0,0,0.1)')
              : (isDark
                  ? '0 4px 20px rgba(0,0,0,0.3)'
                  : '0 2px 12px rgba(0,0,0,0.06)'),
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hovered === 'fuel' ? 'translateY(-4px)' : 'translateY(0)',
          }}
        >
          {/* Background accent */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{
              background: `radial-gradient(circle, ${theme.gold} 0%, transparent 70%)`,
              transform: 'translate(30%, -30%)',
            }}
          />
          <div className="relative z-10">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(200,151,31,0.08)',
                border: `1px solid ${isDark ? 'rgba(255,215,0,0.25)' : 'rgba(200,151,31,0.2)'}`,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="10" width="24" height="30" rx="3" stroke={theme.gold} strokeWidth="2.5" fill="none" />
                <rect x="12" y="14" width="16" height="10" rx="2" fill={isDark ? 'rgba(255,215,0,0.15)' : 'rgba(200,151,31,0.12)'} stroke={theme.gold} strokeWidth="1.5" />
                <path d="M32 18h6a2 2 0 012 2v14a3 3 0 01-3 3h0a3 3 0 01-3-3V22" stroke={theme.gold} strokeWidth="2" />
                <circle cx="38" cy="16" r="2" fill={theme.gold} />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.gold }}>
              Fuel Prices
            </h2>
            <p className="text-sm mb-6" style={{ color: theme.textSecondary }}>
              Compare petrol & diesel prices from government APIs. Find the cheapest station near you and save money every fill-up.
            </p>

            {/* Fuel type quick-select */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Petrol', 'Diesel', 'E10', 'LPG'].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: isDark ? 'rgba(255,215,0,0.08)' : 'rgba(200,151,31,0.06)',
                    color: theme.gold,
                    border: `1px solid ${isDark ? 'rgba(255,215,0,0.2)' : 'rgba(200,151,31,0.15)'}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            <button
              onClick={() => onSelect('petrol')}
              className="w-full px-6 py-3 rounded-2xl text-sm font-bold cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`,
                color: '#0D2B5E',
                boxShadow: isDark ? '0 4px 20px rgba(255,215,0,0.2)' : '0 4px 15px rgba(200,151,31,0.25)',
                transition: 'all 0.25s ease',
                border: 'none',
              }}
            >
              Find Cheap Fuel →
            </button>
          </div>
        </div>

        {/* EV Panel */}
        <div
          onMouseEnter={() => setHovered('ev')}
          onMouseLeave={() => setHovered(null)}
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{
            background: isDark ? theme.cardBg : theme.cardBg,
            border: hovered === 'ev'
              ? `2px solid ${theme.green}`
              : `1px solid ${theme.cardBorder}`,
            boxShadow: hovered === 'ev'
              ? (isDark
                  ? '0 0 50px rgba(46,204,113,0.12), 0 20px 60px rgba(0,0,0,0.4)'
                  : '0 0 40px rgba(39,174,96,0.15), 0 20px 40px rgba(0,0,0,0.1)')
              : (isDark
                  ? '0 4px 20px rgba(0,0,0,0.3)'
                  : '0 2px 12px rgba(0,0,0,0.06)'),
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hovered === 'ev' ? 'translateY(-4px)' : 'translateY(0)',
          }}
        >
          {/* Background accent */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
            style={{
              background: `radial-gradient(circle, ${theme.green} 0%, transparent 70%)`,
              transform: 'translate(30%, -30%)',
            }}
          />
          <div className="relative z-10">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: isDark ? 'rgba(46,204,113,0.1)' : 'rgba(39,174,96,0.08)',
                border: `1px solid ${isDark ? 'rgba(46,204,113,0.25)' : 'rgba(39,174,96,0.2)'}`,
              }}
            >
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <path d="M20 8l-8 18h10l-4 14 14-20H22l6-12H20z" fill={isDark ? 'rgba(46,204,113,0.15)' : 'rgba(39,174,96,0.12)'} stroke={theme.green} strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.green }}>
              EV Charging
            </h2>
            <p className="text-sm mb-6" style={{ color: theme.textSecondary }}>
              Locate thousands of charging points. Filter by connector type, speed, and availability. Go electric with confidence.
            </p>

            {/* Connector type quick-select */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Type 2', 'CCS', 'CHAdeMO', 'Tesla'].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: isDark ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.06)',
                    color: theme.green,
                    border: `1px solid ${isDark ? 'rgba(46,204,113,0.2)' : 'rgba(39,174,96,0.15)'}`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            <button
              onClick={() => onSelect('ev')}
              className="w-full px-6 py-3 rounded-2xl text-sm font-bold cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`,
                color: '#FFFFFF',
                boxShadow: isDark ? '0 4px 20px rgba(46,204,113,0.2)' : '0 4px 15px rgba(39,174,96,0.25)',
                transition: 'all 0.25s ease',
                border: 'none',
              }}
            >
              Find EV Chargers →
            </button>
          </div>
        </div>
      </div>

      {/* Trip Planner Card */}
      <div
        onClick={() => onSelect('trip')}
        onMouseEnter={() => setHovered('trip')}
        onMouseLeave={() => setHovered(null)}
        className="w-full max-w-4xl rounded-2xl p-6 cursor-pointer animate-slide-up"
        style={{
          background: theme.cardBg,
          border: hovered === 'trip'
            ? `2px solid ${theme.gold}`
            : `1px solid ${theme.cardBorder}`,
          boxShadow: hovered === 'trip'
            ? (isDark ? '0 0 30px rgba(255,215,0,0.1)' : '0 0 20px rgba(200,151,31,0.1)')
            : theme.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered === 'trip' ? 'translateY(-2px)' : 'translateY(0)',
          animationDelay: '0.1s',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{
              background: isDark ? 'rgba(255,215,0,0.1)' : 'rgba(200,151,31,0.08)',
              border: `1px solid ${isDark ? 'rgba(255,215,0,0.25)' : 'rgba(200,151,31,0.2)'}`,
            }}
          >
            {'\uD83D\uDDFA'}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold" style={{ color: theme.gold }}>Trip Planner</h3>
            <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
              Plan your route with fuel stops and EV chargers. Live traffic, EV battery forecast, and drive time estimates powered by TomTom.
            </p>
          </div>
          <span className="text-sm font-semibold hidden sm:block" style={{ color: theme.gold }}>Plan Trip →</span>
        </div>
      </div>

      {/* Fuel vs EV Cost Comparison Widget */}
      <div
        className="w-full max-w-4xl mt-10 rounded-2xl p-6 animate-slide-up"
        style={{
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(13,43,94,0.02)',
          border: `1px solid ${theme.cardBorder}`,
          animationDelay: '0.2s',
        }}
      >
        <h3 className="text-center text-sm font-bold mb-4" style={{ color: theme.text }}>
          💡 Fuel vs Electric — Weekly Cost Comparison
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl" style={{ background: isDark ? 'rgba(255,215,0,0.05)' : 'rgba(200,151,31,0.04)' }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Avg Petrol Cost</p>
            <p className="text-2xl font-bold" style={{ color: theme.gold }}>$65</p>
            <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>Based on 300km/week</p>
          </div>
          <div className="text-center p-4 rounded-xl flex flex-col items-center justify-center">
            <div className="text-2xl mb-1">→</div>
            <p className="text-xs font-semibold" style={{ color: theme.green }}>Save ~60%</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ background: isDark ? 'rgba(46,204,113,0.05)' : 'rgba(39,174,96,0.04)' }}>
            <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Avg EV Charge Cost</p>
            <p className="text-2xl font-bold" style={{ color: theme.green }}>$25</p>
            <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>Based on 300km/week</p>
          </div>
        </div>
        <p className="text-[10px] text-center mt-3" style={{ color: theme.textMuted }}>
          Estimates based on avg fuel price 175¢/L at 8L/100km vs avg EV charging at 45¢/kWh at 15kWh/100km
        </p>
      </div>

      {/* Featured Articles */}
      <div className="w-full max-w-4xl mt-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: theme.heading || theme.text }}>Guides & Articles</h2>
          <button
            onClick={() => onArticle && onArticle()}
            className="text-xs font-medium hover:underline cursor-pointer"
            style={{ color: theme.accent || theme.gold, background: 'none', border: 'none' }}
          >
            View all →
          </button>
        </div>
        <FeaturedArticles theme={theme} isDark={isDark} onArticle={onArticle} />
      </div>

      {/* Latest News (RSS) */}
      <div className="w-full max-w-4xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <LatestNews />
      </div>

      {/* Footer tagline */}
      <p className="text-xs mt-10 text-center" style={{ color: theme.textMuted }}>
        Maps by TomTom &bull; Fuel data from NSW, VIC, QLD, WA &bull; EV data from Open Charge Map
      </p>
    </div>
  );
}
