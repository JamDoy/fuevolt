import { useState } from 'react';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import EVChargingPage from './pages/EVChargingPage';
import FuelPricePage from './pages/FuelPricePage';

export default function App() {
  const [view, setView] = useState('landing');
  const [initialFuelType, setInitialFuelType] = useState('U91');

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

  const handleBack = () => setView('landing');

  return (
    <div className="min-h-screen">
      <Header
        showBack={view !== 'landing'}
        onBack={handleBack}
        view={view}
        onViewChange={(v) => {
          if (v === 'fuel') setInitialFuelType('U91');
          setView(v);
        }}
      />
      <main>
        {view === 'landing' && <LandingPage onSelect={handleSelect} />}
        {view === 'ev' && <EVChargingPage />}
        {view === 'fuel' && <FuelPricePage initialFuelType={initialFuelType} />}
      </main>
      <footer className="text-center py-6 px-4 mt-8">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} FueVolt — Australian EV & Fuel Price Finder
        </p>
        <p className="text-[10px] text-gray-600 mt-1">
          EV data powered by Open Charge Map • Fuel prices from government APIs
        </p>
      </footer>
    </div>
  );
}
