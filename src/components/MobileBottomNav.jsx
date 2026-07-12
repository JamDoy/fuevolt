import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { id: 'fuel', label: 'Fuel Prices', path: '/fuel-prices', icon: 'fuel' },
  { id: 'ev', label: 'EV Charging', path: '/ev-charging', icon: 'ev' },
  { id: 'trip', label: 'Trip Planner', path: '/trip-planner', icon: 'trip' },
  { id: 'articles', label: 'Guides', path: '/guides', icon: 'guides' },
];

function NavIcon({ type }) {
  if (type === 'fuel') {
    return <path d="M6 3h8v18H6V3Zm2 3v5h4V6H8Zm6 2h2l2 2v8a2 2 0 0 1-4 0v-5" />;
  }
  if (type === 'ev') {
    return <path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z" />;
  }
  if (type === 'trip') {
    return <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15" />;
  }
  return <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" />;
}

export default function MobileBottomNav({ view, onNavigate }) {
  const { theme } = useTheme();
  const activeView = view === 'station-detail' ? 'fuel' : view === 'article-detail' ? 'articles' : view === 'landing' ? 'fuel' : view;

  return (
    <nav
      className="fixed md:hidden inset-x-0 bottom-0 z-[500] grid grid-cols-4 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5"
      style={{ background: theme.cardBg, borderTop: `1px solid ${theme.cardBorder}`, boxShadow: '0 -8px 24px rgba(0,0,0,0.16)' }}
      aria-label="Primary navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = activeView === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id, item.path)}
            className="min-h-14 flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold cursor-pointer"
            style={{ color: active ? theme.gold : theme.textMuted, background: 'transparent', border: 'none' }}
            aria-current={active ? 'page' : undefined}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <NavIcon type={item.icon} />
            </svg>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
