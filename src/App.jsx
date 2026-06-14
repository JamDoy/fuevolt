import { useState } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import EVChargingPage from './pages/EVChargingPage';
import FuelPricePage from './pages/FuelPricePage';
import FuelStationDetailPage from './pages/FuelStationDetailPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';

function AppContent() {
  const [view, setView] = useState('landing');
  const [initialFuelType, setInitialFuelType] = useState('U91');
  const [detailStation, setDetailStation] = useState(null);
  const { theme } = useTheme();

  const handleSelect = (option) => {
    if (option === 'petrol') {
      setInitialFuelType('U91');
      setView('fuel');
    } else if (option === 'diesel') {
      setInitialFuelType('Diesel');
      setView('fuel');
    } else {
      setView('ev');
    }
  };

  const handleBack = () => {
    if (view === 'station-detail') {
      setView('fuel');
      setDetailStation(null);
    } else if (view === 'privacy' || view === 'terms') {
      setView('landing');
    } else {
      setView('landing');
    }
  };

  const handleStationDetail = (station) => {
    setDetailStation(station);
    setView('station-detail');
  };

  return (
    <div className="min-h-screen">
      <Header
        showBack={view !== 'landing'}
        onBack={handleBack}
        view={view}
        onViewChange={(v) => {
          if (v === 'fuel') setInitialFuelType('U91');
          setView(v);
          setDetailStation(null);
        }}
        onHome={() => { setView('landing'); setDetailStation(null); }}
      />
      <main>
        {view === 'landing' && <LandingPage onSelect={handleSelect} />}
        {view === 'ev' && <EVChargingPage />}
        {view === 'fuel' && (
          <FuelPricePage
            initialFuelType={initialFuelType}
            onStationDetail={handleStationDetail}
            onSwitchToEV={() => setView('ev')}
          />
        )}
        {view === 'station-detail' && detailStation && (
          <FuelStationDetailPage
            station={detailStation}
            onBack={handleBack}
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
          EV data powered by Open Charge Map &bull; Fuel prices from government APIs
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <button
            onClick={() => setView('privacy')}
            className="text-[10px] underline cursor-pointer"
            style={{ color: theme.footerSubtext }}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setView('terms')}
            className="text-[10px] underline cursor-pointer"
            style={{ color: theme.footerSubtext }}
          >
            Terms of Service
          </button>
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
