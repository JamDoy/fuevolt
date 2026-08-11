import { useState, useEffect, useCallback, useRef } from 'react';
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
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import FuelPreferencePrompt from './components/FuelPreferencePrompt';
import FuelReminderSettings from './components/FuelReminderSettings';
import MobileBottomNav from './components/MobileBottomNav';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { updatePageMeta, buildCityMeta, POPULAR_SUBURBS } from './utils/seo';
import { getFuelPreference, saveFuelPreference } from './utils/sessionPreferences';

function parseRoute() {
  const historyState = window.history.state;
  if (historyState?.fuevoltView === 'station-detail' && historyState.station) {
    return { view: 'station-detail', suburb: null, station: historyState.station };
  }

  const path = window.location.pathname;
  if (!path || path === '/') return { view: 'landing', suburb: null };

  const parts = path.split('/').filter(Boolean);
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
  if (parts[0] === 'about') return { view: 'about', suburb: null };
  if (parts[0] === 'faq') return { view: 'faq', suburb: null };
  if (parts[0] === 'contact') return { view: 'contact', suburb: null };
  return { view: 'landing', suburb: null };
}

function setRoute(path, state = {}) {
  window.history.pushState(state, '', path);
}

function AppContent() {
  const parsed = parseRoute();
  const storedFuelPreference = getFuelPreference();
  const [view, setView] = useState(parsed.view);
  const [fuelPreference, setFuelPreference] = useState(storedFuelPreference);
  const [showFuelPreference, setShowFuelPreference] = useState(!storedFuelPreference);
  const [initialFuelType, setInitialFuelType] = useState(storedFuelPreference && storedFuelPreference !== 'EV' ? storedFuelPreference : 'U91');
  const [initialSearch, setInitialSearch] = useState(null);
  const [detailStation, setDetailStation] = useState(parsed.station || null);
  const [initialSuburb, setInitialSuburb] = useState(parsed.suburb);
  const [articleSlug, setArticleSlug] = useState(parsed.articleSlug || null);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const reminderSettingsRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (showReminderSettings) {
      reminderSettingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showReminderSettings]);

  const navigate = useCallback((newView, path, routeState = {}, extra) => {
    setView(newView);
    setRoute(path || '/', { fuevoltView: newView, ...routeState });
    updatePageMeta(newView, extra);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    updatePageMeta(view, buildCityMeta(view, initialSuburb));

    const handlePop = () => {
      const p = parseRoute();
      setView(p.view);
      setInitialSuburb(p.suburb);
      setDetailStation(p.station || null);
      setArticleSlug(p.articleSlug || null);
      updatePageMeta(p.view, buildCityMeta(p.view, p.suburb));
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [view, initialSuburb]);

  const handleSelect = (option) => {
    setInitialSearch(null);
    if (option === 'petrol') {
      setInitialFuelType(fuelPreference && fuelPreference !== 'EV' ? fuelPreference : 'U91');
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
    if (view === 'station-detail' || window.history.state?.fuevoltView) {
      window.history.back();
      return;
    }

    const fallbackView = view === 'article-detail' ? 'articles' : 'landing';
    const fallbackPath = view === 'article-detail' ? '/guides' : '/';
    window.history.replaceState({ fuevoltView: fallbackView }, '', fallbackPath);
    setView(fallbackView);
    setDetailStation(null);
    setArticleSlug(null);
    updatePageMeta(fallbackView);
    window.scrollTo(0, 0);
  };

  const handleStationDetail = (station) => {
    setDetailStation(station);
    setView('station-detail');
    setRoute(window.location.pathname, { fuevoltView: 'station-detail', station });
    window.scrollTo(0, 0);
  };

  const handleLandingSearch = (search) => {
    const targetView = fuelPreference === 'EV' ? 'ev' : 'fuel';
    setInitialFuelType(fuelPreference && fuelPreference !== 'EV' ? fuelPreference : 'U91');
    setInitialSuburb(null);
    setInitialSearch({ ...search, key: Date.now() });
    navigate(targetView, targetView === 'ev' ? '/ev-charging' : '/fuel-prices');
  };

  const handleFuelPreference = (preference) => {
    saveFuelPreference(preference);
    setFuelPreference(preference);
    setShowFuelPreference(false);

    const targetView = preference === 'EV' ? 'ev' : 'fuel';
    if (preference !== 'EV') setInitialFuelType(preference);
    setInitialSuburb(null);
    setInitialSearch({ useLocation: true, key: Date.now() });
    navigate(targetView, targetView === 'ev' ? '/ev-charging' : '/fuel-prices');
  };

  const handlePrimaryNavigation = (newView, path) => {
    setInitialSearch(null);
    setInitialSuburb(null);
    setDetailStation(null);
    if (newView === 'fuel') {
      setInitialFuelType(fuelPreference && fuelPreference !== 'EV' ? fuelPreference : 'U91');
    }
    navigate(newView, path);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header
        showBack={view !== 'landing'}
        onBack={handleBack}
        view={view}
        onViewChange={(v) => {
          const paths = { fuel: '/fuel-prices', ev: '/ev-charging', trip: '/trip-planner', calculator: '/ev-vs-fuel', notifications: '/alerts', articles: '/guides' };
          handlePrimaryNavigation(v, paths[v] || '/');
        }}
      />
      <main id="main-content" tabIndex={-1}>
        {view === 'landing' && (
          <LandingPage
            onSelect={handleSelect}
            onSearch={(query) => handleLandingSearch({ query })}
            onUseLocation={() => handleLandingSearch({ useLocation: true })}
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
        {view === 'ev' && (
          <EVChargingPage
            key={`ev-${initialSuburb?.slug || 'search'}-${initialSearch?.key || ''}`}
            initialSuburb={initialSuburb}
            initialSearch={initialSearch}
          />
        )}
        {view === 'fuel' && (
          <FuelPricePage
            key={`fuel-${initialFuelType}-${initialSuburb?.slug || 'search'}-${initialSearch?.key || ''}`}
            initialFuelType={initialFuelType}
            preferredFuelType={fuelPreference}
            initialSearch={initialSearch}
            onStationDetail={handleStationDetail}
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
        {view === 'notifications' && (
          <NotificationsPage onCheckNow={() => handlePrimaryNavigation('fuel', '/fuel-prices')} />
        )}
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
            onBack={handleBack}
          />
        )}
        {view === 'privacy' && <PrivacyPolicyPage />}
        {view === 'terms' && <TermsPage />}
        {view === 'about' && <AboutPage onContact={() => navigate('contact', '/contact')} />}
        {view === 'faq' && <FAQPage onContact={() => navigate('contact', '/contact')} />}
        {view === 'contact' && <ContactPage />}
      </main>
      <footer className="text-center py-6 px-4 mt-8">
        <p className="text-xs" style={{ color: theme.footerText }}>
          &copy; {new Date().getFullYear()} FueVolt &mdash; Australian EV & Fuel Price Finder
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <button
            onClick={() => navigate('about', '/about')}
            className="text-[10px] underline cursor-pointer"
            style={{ color: theme.footerSubtext, background: 'none', border: 'none' }}
          >
            About
          </button>
          <button
            onClick={() => navigate('faq', '/faq')}
            className="text-[10px] underline cursor-pointer"
            style={{ color: theme.footerSubtext, background: 'none', border: 'none' }}
          >
            FAQ
          </button>
          <button
            onClick={() => navigate('contact', '/contact')}
            className="text-[10px] underline cursor-pointer"
            style={{ color: theme.footerSubtext, background: 'none', border: 'none' }}
          >
            Contact
          </button>
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
          <button
            onClick={() => setShowReminderSettings((s) => !s)}
            className="text-[10px] cursor-pointer"
            style={{ color: theme.footerSubtext, background: 'none', border: 'none' }}
          >
            &#9200; Fuel Reminder Settings
          </button>
        </div>

        {showReminderSettings && <FuelReminderSettings innerRef={reminderSettingsRef} />}

        {/* SEO: Popular suburb links */}
        <div className="mt-4 max-w-4xl mx-auto">
          <p className="text-[10px] mb-1" style={{ color: theme.footerSubtext }}>Fuel prices in:</p>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5">
            {POPULAR_SUBURBS.fuel.map((s) => (
              <a
                key={s.slug}
                href={`/fuel-prices/${s.slug}`}
                className="text-[10px] hover:underline"
                style={{ color: theme.footerSubtext }}
                onClick={(e) => {
                  e.preventDefault();
                  setInitialFuelType(fuelPreference && fuelPreference !== 'EV' ? fuelPreference : 'U91');
                  setInitialSearch(null);
                  setInitialSuburb(s);
                  setDetailStation(null);
                  navigate('fuel', `/fuel-prices/${s.slug}`, {}, buildCityMeta('fuel', s));
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
                href={`/ev-charging/${s.slug}`}
                className="text-[10px] hover:underline"
                style={{ color: theme.footerSubtext }}
                onClick={(e) => {
                  e.preventDefault();
                  setInitialSuburb(s);
                  setDetailStation(null);
                  navigate('ev', `/ev-charging/${s.slug}`, {}, buildCityMeta('ev', s));
                }}
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </footer>
      <MobileBottomNav view={view} onNavigate={handlePrimaryNavigation} />
      <PWAInstallPrompt />
      {showFuelPreference && <FuelPreferencePrompt onSelect={handleFuelPreference} />}
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
