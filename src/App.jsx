import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import EVChargingPage from './pages/EVChargingPage';
import FuelPricePage from './pages/FuelPricePage';
import FuelStationDetailPage from './pages/FuelStationDetailPage';
import TripPlannerPage from './pages/TripPlannerPage';
import EVvsFuelPage from './pages/EVvsFuelPage';
import NotificationsPage from './pages/NotificationsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import { updatePageMeta, POPULAR_SUBURBS } from './utils/seo';

function parseRoute() {
  const hash = window.location.hash.replace('#', '');
  if (!hash || hash === '/') return { view: 'landing', suburb: null };

  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'fuel-prices') {
    const suburb = parts[1] ? POPULAR_SUBURBS.fuel.find((s) => s.slug === parts[1]) : null;
    return { view: 'fuel', suburb };
  }
  if (parts[0] === 'ev-charging') {
    const suburb = parts[1] ? POPULAR_SUBURBS.ev.find((s) => s.slug === parts[1]) : null;
    return { view: 'ev', suburb };
  }
  if (parts[0] === 'trip-planner') return { view: 'trip', suburb: null };
  if (parts[0] === 'ev-vs-fuel') return { view: 'calculator', suburb: null };
  if (parts[0] === 'alerts') return { view: 'notifications', suburb: null };
  if (parts[0] === 'guides') {
    if (parts[1]) return { view: 'article-detail', suburb: null, articleSlug: parts[1] };
    return { view: 'articles', suburb: null };
  }
  if (parts[0] === 'privacy') return { view: 'privacy', suburb: null };
  if (parts[0] === 'terms') return { view: 'terms', suburb: null };
  return { view: 'landing', suburb: null };
}

function setRoute(path) {
  window.history.pushState(null, '', `#${path}`);
}

function AppContent() {
  const parsed = parseRoute();
  const [view, setView] = useState(parsed.view);
  const [initialFuelType, setInitialFuelType] = useState('U91');
  const [detailStation, setDetailStation] = useState(null);
  const [initialSuburb, setInitialSuburb] = useState(parsed.suburb);
  const [articleSlug, setArticleSlug] = useState(parsed.articleSlug || null);
  const { theme } = useTheme();

  const navigate = useCallback((newView, path) => {
    setView(newView);
    setRoute(path || '/');
    updatePageMeta(newView);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    updatePageMeta(view);

    const handlePop = () => {
      const p = parseRoute();
      setView(p.view);
      setInitialSuburb(p.suburb);
      if (p.articleSlug) setArticleSlug(p.articleSlug);
      updatePageMeta(p.view);
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [view]);

  const handleSelect = (option) => {
    if (option === 'petrol') {
      setInitialFuelType('U91');
      setInitialSuburb(null);
      navigate('fuel', '/fuel-prices');
    } else if (option === 'diesel') {
      setInitialFuelType('Diesel');
      setInitialSuburb(null);
      navigate('fuel', '/fuel-prices');
    } else if (option === 'trip') {
      navigate('trip', '/trip-planner');
    } else if (option === 'calculator') {
      navigate('calculator', '/ev-vs-fuel');
    } else {
      setInitialSuburb(null);
      navigate('ev', '/ev-charging');
    }
  };

  const handleBack = () => {
    if (view === 'station-detail') {
      setView('fuel');
      setDetailStation(null);
      setRoute('/fuel-prices');
    } else if (view === 'article-detail') {
      setArticleSlug(null);
      navigate('articles', '/guides');
    } else {
      setDetailStation(null);
      navigate('landing', '/');
    }
  };

  const handleStationDetail = (station) => {
    setDetailStation(station);
    setView('station-detail');
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen">
      <Header
        showBack={view !== 'landing'}
        onBack={handleBack}
        view={view}
        onViewChange={(v) => {
          if (v === 'fuel') { setInitialFuelType('U91'); setInitialSuburb(null); }
          setDetailStation(null);
          const paths = { fuel: '/fuel-prices', ev: '/ev-charging', trip: '/trip-planner', calculator: '/ev-vs-fuel', notifications: '/alerts', articles: '/guides' };
          navigate(v, paths[v] || '/');
        }}
        onHome={() => { setDetailStation(null); navigate('landing', '/'); }}
      />
      <main>
        {view === 'landing' && (
          <LandingPage
            onSelect={handleSelect}
            onArticle={(slug) => {
              if (slug) {
                setArticleSlug(slug);
                navigate('article-detail', `/guides/${slug}`);
              } else {
                navigate('articles', '/guides');
              }
            }}
          />
        )}
        {view === 'ev' && <EVChargingPage initialSuburb={initialSuburb} />}
        {view === 'fuel' && (
          <FuelPricePage
            initialFuelType={initialFuelType}
            onStationDetail={handleStationDetail}
            onSwitchToEV={() => navigate('ev', '/ev-charging')}
            initialSuburb={initialSuburb}
          />
        )}
        {view === 'station-detail' && detailStation && (
          <FuelStationDetailPage
            station={detailStation}
            onBack={handleBack}
          />
        )}
        {view === 'trip' && <TripPlannerPage />}
        {view === 'calculator' && <EVvsFuelPage />}
        {view === 'notifications' && <NotificationsPage />}
        {view === 'articles' && (
          <ArticlesPage
            onArticle={(slug) => {
              setArticleSlug(slug);
              navigate('article-detail', `/guides/${slug}`);
            }}
          />
        )}
        {view === 'article-detail' && articleSlug && (
          <ArticleDetailPage
            slug={articleSlug}
            onBack={() => { setArticleSlug(null); navigate('articles', '/guides'); }}
          />
        )}
        {view === 'privacy' && <PrivacyPolicyPage />}
        {view === 'terms' && <TermsPage />}
      </main>
      <footer className="text-center py-6 px-4 mt-8">
        <p className="text-xs" style={{ color: theme.footerText }}>
          &copy; {new Date().getFullYear()} FueVolt &mdash; Australian EV & Fuel Price Finder
        </p>
        <p className="text-[10px] mt-1" style={{ color: theme.footerSubtext }}>
          Maps & routing by TomTom &bull; EV data by Open Charge Map &bull; Fuel prices from government APIs (NSW, VIC, QLD, WA)
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <button
            onClick={() => navigate('privacy', '/privacy')}
            className="text-[10px] underline cursor-pointer"
            style={{ color: theme.footerSubtext, background: 'none', border: 'none' }}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => navigate('terms', '/terms')}
            className="text-[10px] underline cursor-pointer"
            style={{ color: theme.footerSubtext, background: 'none', border: 'none' }}
          >
            Terms of Service
          </button>
        </div>

        {/* SEO: Popular suburb links */}
        <div className="mt-4 max-w-4xl mx-auto">
          <p className="text-[10px] mb-1" style={{ color: theme.footerSubtext }}>Fuel prices in:</p>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
            {POPULAR_SUBURBS.fuel.slice(0, 10).map((s) => (
              <a
                key={s.slug}
                href={`#/fuel-prices/${s.slug}`}
                className="text-[10px] hover:underline"
                style={{ color: theme.footerSubtext }}
                onClick={(e) => {
                  e.preventDefault();
                  setInitialFuelType('U91');
                  setInitialSuburb(s);
                  setDetailStation(null);
                  navigate('fuel', `/fuel-prices/${s.slug}`);
                  updatePageMeta('fuel', {
                    title: `Fuel Prices in ${s.name} — Cheapest Petrol Today | FueVolt`,
                    description: `Compare petrol, diesel and LPG prices near ${s.name}. Live data from government APIs. Find the cheapest fuel station today.`,
                    url: `https://fuevolt.com/fuel-prices/${s.slug}`,
                  });
                }}
              >
                {s.name}
              </a>
            ))}
          </div>
          <p className="text-[10px] mt-2 mb-1" style={{ color: theme.footerSubtext }}>EV charging in:</p>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
            {POPULAR_SUBURBS.ev.map((s) => (
              <a
                key={s.slug}
                href={`#/ev-charging/${s.slug}`}
                className="text-[10px] hover:underline"
                style={{ color: theme.footerSubtext }}
                onClick={(e) => {
                  e.preventDefault();
                  setInitialSuburb(s);
                  setDetailStation(null);
                  navigate('ev', `/ev-charging/${s.slug}`);
                  updatePageMeta('ev', {
                    title: `EV Charging Stations in ${s.name} — Find Chargers | FueVolt`,
                    description: `Find EV charging stations near ${s.name}. Filter by connector type and charging speed. Real-time availability.`,
                    url: `https://fuevolt.com/ev-charging/${s.slug}`,
                  });
                }}
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
