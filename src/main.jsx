import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeAdMob, showBannerAd } from './utils/admob.js'

// Initialize AdMob when running as native app
initializeAdMob().then(() => {
  showBannerAd();
});

// Register service worker for offline caching. updateViaCache: 'none' stops
// the browser's own HTTP cache from ever serving a stale copy of sw.js
// itself when checking for updates, so a new deploy is detected promptly.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
