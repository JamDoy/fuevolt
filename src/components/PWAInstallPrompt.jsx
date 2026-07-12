import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SESSION_KEY = 'fuevolt_install_prompt_seen';

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    // sessionStorage may be unavailable in restricted browser modes.
  }
}

function wasSeen() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function PWAInstallPrompt() {
  const { theme } = useTheme();
  const [installEvent, setInstallEvent] = useState(null);
  const [delayElapsed, setDelayElapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => wasSeen());

  useEffect(() => {
    if (dismissed || window.matchMedia('(display-mode: standalone)').matches) return undefined;

    const timer = window.setTimeout(() => setDelayElapsed(true), 45000);
    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      markSeen();
      setDismissed(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [dismissed]);

  useEffect(() => {
    if (delayElapsed && installEvent && !dismissed) markSeen();
  }, [delayElapsed, installEvent, dismissed]);

  if (dismissed || !delayElapsed || !installEvent) return null;

  const dismiss = () => {
    markSeen();
    setDismissed(true);
  };

  const install = async () => {
    await installEvent.prompt();
    await installEvent.userChoice;
    markSeen();
    setDismissed(true);
    setInstallEvent(null);
  };

  return (
    <div
      className="fixed left-3 right-3 md:left-auto md:right-5 bottom-[5.1rem] md:bottom-5 z-[600] md:max-w-md rounded-2xl p-3 flex items-center gap-3"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 12px 36px rgba(0,0,0,0.28)' }}
      role="status"
    >
      <p className="text-xs flex-1 leading-relaxed" style={{ color: theme.text }}>
        Add FueVolt to your home screen for quick access
      </p>
      <button
        type="button"
        onClick={install}
        className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`, color: '#0D2B5E', border: 'none' }}
      >
        Add
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="w-8 h-8 rounded-lg text-lg cursor-pointer"
        style={{ background: 'transparent', color: theme.textMuted, border: 'none' }}
        aria-label="Dismiss install prompt"
      >
        ×
      </button>
    </div>
  );
}
