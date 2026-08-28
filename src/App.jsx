import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import EVChargingPage from './pages/EVChargingPage';
import FuelPricePage from './pages/FuelPricePage';
import FuelStationDetailPage from './pages/FuelStationDetailPage';
import EVStationDetailPage from './pages/EVStationDetailPage';
import TripPlannerPage from './pages/TripPlannerPage';
import TrendsPage from './pages/TrendsPage';
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
import SideRailAds from './components/SideRailAds';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { updatePageMeta, buildCityMeta, POPULAR_SUBURBS } from './utils/seo';
import { getFuelPreference, saveFuelPreference } from './utils/sessionPreferences';

function parseRoute() {
  const historyState = window.history.state;
  if (historyState?.fuevoltView === 'station-detail' && historyState.station) {
    return { view: 'station-detail', suburb: null, station: historyState.station };
  }
  if (historyState?.fuevoltView === 'ev-station-detail' && historyState.station) {
    return { view: 'ev-station-detail', suburb: null, station: historyState.station };
  }

  const path = window.location.pathname;
  if (!path || path === '/') return { view: 'landing', suburb: null };

  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'fuel-prices') {
    const suburb = parts[1] ? POPULAR_SUBURBS.fuel.find((s) => s.slug === parts[1]) : null;
    // A shared station link (?lat=&lng=&fuel=&station=) re-runs the same
    // nearby search live rather than replaying stale shared data, then
    // opens the matching station once results come back — so a recipient
    // always sees a currently-accurate price, not what the sharer saw.
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat'));
    const lng = parseFloat(params.get('lng'));
    if (!suburb && Number.isFinite(lat) && Number.isFinite(lng)) {
      return {
        view: 'fuel',
        suburb: null,
        initialSearch: {
          lat,
          lng,
          fuelType: params.get('fuel') || undefined,
          stationId: params.get('station') || null,
          label: params.get('label') || '',
          key: Date.now(),
        },
      };
    }
    return { view: 'fuel', suburb };
  }
  if (parts[0] === 'ev-charging') {
    const suburb = parts[1] ? POPULAR_SUBURBS.ev.find((s) => s.slug === parts[1]) : null;
    const evParams = new URLSearchParams(window.location.search);
    const evLat = parseFloat(evParams.get('lat'));
    const evLng = parseFloat(evParams.get('lng'));
    if (!suburb && Number.isFinite(evLat) && Number.isFinite(evLng)) {
      return {
        view: 'ev',
        suburb: null,
        initialSearch: {
          lat: evLat,
          lng: evLng,
          label: evParams.get('label') || '',
          key: Date.now(),
        },
      };
    }
    return { view: 'ev', suburb };
  }
  if (parts[0] === 'trip-planner') {
    const tripParams = new URLSearchParams(window.location.search);
    const start = tripParams.get('start');
    const end = tripParams.get('end');
    if (start && end) {
      return {
        view: 'trip',
        suburb: null,
        initialTrip: { start, end, mode: tripParams.get('mode') || 'car' },
      };
    }
    return { view: 'trip', suburb: null };
  }
  if (parts[0] === 'trends') {
    const trendsParams = new URLSearchParams(window.location.search);
    const tLat = parseFloat(trendsParams.get('lat'));
    const tLng = parseFloat(trendsParams.get('lng'));
    if (Number.isFinite(tLat) && Number.isFinite(tLng)) {
      return {
        view: 'trends',
        suburb: null,
        initialTrendsSearch: {
          lat: tLat,
          lng: tLng,
          fuelType: trendsParams.get('fuel') || undefined,
          label: trendsParams.get('label') || '',
        },
      };
    }
    return { view: 'trends', suburb: null };
  }
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
  const [initialFuelType, setInitialFuelType] = useState(
    parsed.initialSearch?.fuelType || (storedFuelPreference && storedFuelPreference !== 'EV' ? storedFuelPreference : 'U91')
  );
  const [initialSearch, setInitialSearch] = useState(parsed.initialSearch || null);
  const [initialTrendsSearch] = useState(parsed.initialTrendsSearch || null);
  const [initialTrip] = useState(parsed.initialTrip || null);
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

  // FueVolt navigates client-side (pushState, no full reload) — Ezoic's ad
  // placeholders only auto-refresh on a real page load, so each subsequent
  // route change needs an explicit showAds() call. The first render is
  // skipped since EzoicAd's own mount effect already requests each slot.
  const isFirstRouteRender = useRef(true);
  useEffect(() => {
    if (isFirstRouteRender.current) {
      isFirstRouteRender.current = false;
      return;
    }
    window.ezstandalone = window.ezstandalone || {};
    window.ezstandalone.cmd = window.ezstandalone.cmd || [];
    window.ezstandalone.cmd.push(() => window.ezstandalone.showAds());
  }, [view, initialSuburb, articleSlug]);

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

      if ((p.view === 'fuel' || p.view === 'ev') && !p.station) {
        let savedScroll = null;
        try {
          savedScroll = sessionStorage.getItem('fuevolt_results_scroll');
          sessionStorage.removeItem('fuevolt_results_scroll');
        } catch {
          // sessionStorage may be unavailable in restricted browser modes.
        }
        if (savedScroll != null) {
          requestAnimationFrame(() => window.scrollTo(0, parseInt(savedScroll, 10) || 0));
          return;
        }
      }
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
    try {
      sessionStorage.setItem('fuevolt_results_scroll', String(window.scrollY));
    } catch {
      // sessionStorage may be unavailable in restricted browser modes.
    }
    setDetailStation(station);
    setView('station-detail');
    setRoute(window.location.pathname, { fuevoltView: 'station-detail', station });
    window.scrollTo(0, 0);
  };

  const handleEVStationDetail = (station) => {
    try {
      sessionStorage.setItem('fuevolt_results_scroll', String(window.scrollY));
    } catch {
      // sessionStorage may be unavailable in restricted browser modes.
    }
    setDetailStation(station);
    setView('ev-station-detail');
    setRoute(window.location.pathname, { fuevoltView: 'ev-station-detail', station });
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
      <SideRailAds />
      <Header
        showBack={view !== 'landing'}
        onBack={handleBack}
        view={view}
        onViewChange={(v) => {
          const paths = { fuel: '/fuel-prices', ev: '/ev-charging', trip: '/trip-planner', trends: '/trends', calculator: '/ev-vs-fuel', notifications: '/alerts', articles: '/guides' };
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
            onStationDetail={handleEVStationDetail}
          />
        )}
        {view === 'fuel' && (
          <FuelPricePage
            key={`fuel-${initialFuelType}-${initialSuburb?.slug || 'search'}-${initialSearch?.key || ''}`}
            initialFuelType={initialFuelType}
            preferredFuelType={fuelPreference}
            initialSearch={initialSearch}
            onStationDetail={handleStationDetail}
            onSharedStationOpened={() => setInitialSearch((prev) => (prev ? { ...prev, stationId: null } : prev))}
            initialSuburb={initialSuburb}
          />
        )}
        {view === 'station-detail' && detailStation && (
          <FuelStationDetailPage
            station={detailStation}
            onBack={handleBack}
            onStationDetail={handleStationDetail}
          />
        )}
        {view === 'ev-station-detail' && detailStation && (
          <EVStationDetailPage
            station={detailStation}
            onBack={handleBack}
            onStationDetail={handleEVStationDetail}
          />
        )}
        {view === 'trip' && <TripPlannerPage initialTrip={initialTrip} />}
        {view === 'trends' && (
          <TrendsPage
            onStationDetail={handleStationDetail}
            onGoHome={() => navigate('landing', '/')}
            initialSearch={initialTrendsSearch}
          />
        )}
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
        <p className="text-[10px] mt-1" style={{ color: theme.footerSubtext }}>
          Prices sourced from official government data where available.
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
