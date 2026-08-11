import { createContext, useContext, useState, useEffect } from 'react';

const DARK = {
  mode: 'dark',
  bg: 'linear-gradient(180deg, #0A1628 0%, #0D2B5E 100%)',
  cardBg: '#0D2B5E',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#94A3B8',
  gold: '#F59E0B',
  goldDark: '#B45309',
  goldLight: '#FDE68A',
  green: '#22C55E',
  greenDark: '#14532D',
  greenLight: '#4ADE80',
  inputBg: 'rgba(255,255,255,0.08)',
  inputBorder: 'rgba(255,255,255,0.15)',
  inputFocusBorder: '#22C55E',
  inputText: '#FFFFFF',
  cardBorder: 'rgba(245,158,11,0.2)',
  cardBorderActive: '#22C55E',
  cardGlow: '0 0 20px rgba(34,197,94,0.15) inset',
  cardGlowDefault: '0 0 12px rgba(26,111,219,0.08) inset',
  glassBg: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  overlayBg: 'rgba(10, 22, 40, 0.8)',
  panelBg: 'linear-gradient(180deg, #0D2B5E 0%, #0A1628 100%)',
  shimmerBase: '#0D2B5E',
  shimmerHighlight: '#1A3A6E',
  errorBorder: 'rgba(255, 100, 100, 0.3)',
  errorGlow: '0 0 20px rgba(255, 100, 100, 0.05) inset',
  tabBg: 'rgba(255,255,255,0.1)',
  tabText: '#FFFFFF',
  chipBg: 'rgba(255,255,255,0.06)',
  chipBorder: 'rgba(255,255,255,0.15)',
  chipText: '#9CA3AF',
  divider: 'rgba(255,255,255,0.05)',
  brandBadgeBg: 'rgba(245,158,11,0.1)',
  brandBadgeBorder: 'rgba(245,158,11,0.3)',
  mapBorder: 'rgba(245,158,11,0.2)',
  heading: '#F59E0B',
  subtext: '#9CA3AF',
  accent: '#F59E0B',
  footerText: '#9CA3AF',
  footerSubtext: '#94A3B8',
};

const LIGHT = {
  mode: 'light',
  bg: 'linear-gradient(180deg, #F0F4F8 0%, #FFFFFF 100%)',
  cardBg: '#FFFFFF',
  text: '#0D2B5E',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  gold: '#F59E0B',
  goldDark: '#B45309',
  goldLight: '#FDE68A',
  green: '#22C55E',
  greenDark: '#14532D',
  greenLight: '#4ADE80',
  inputBg: '#F3F4F6',
  inputBorder: '#D1D5DB',
  inputFocusBorder: '#22C55E',
  inputText: '#0D2B5E',
  cardBorder: 'rgba(13,43,94,0.12)',
  cardBorderActive: '#22C55E',
  cardGlow: '0 0 20px rgba(34,197,94,0.1) inset',
  cardGlowDefault: '0 2px 8px rgba(0,0,0,0.06)',
  glassBg: 'rgba(13,43,94,0.03)',
  glassBorder: 'rgba(13,43,94,0.08)',
  overlayBg: 'rgba(255,255,255,0.85)',
  panelBg: 'linear-gradient(180deg, #FFFFFF 0%, #F0F4F8 100%)',
  shimmerBase: '#E5E7EB',
  shimmerHighlight: '#F3F4F6',
  errorBorder: 'rgba(239, 68, 68, 0.3)',
  errorGlow: '0 2px 8px rgba(239, 68, 68, 0.06)',
  tabBg: 'rgba(13,43,94,0.06)',
  tabText: '#0D2B5E',
  chipBg: 'rgba(13,43,94,0.04)',
  chipBorder: 'rgba(13,43,94,0.12)',
  chipText: '#4B5563',
  divider: 'rgba(13,43,94,0.08)',
  brandBadgeBg: 'rgba(245,158,11,0.1)',
  brandBadgeBorder: 'rgba(245,158,11,0.3)',
  mapBorder: 'rgba(13,43,94,0.12)',
  heading: '#0D2B5E',
  subtext: '#6B7280',
  accent: '#F59E0B',
  footerText: '#4B5563',
  footerSubtext: '#6B7280',
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('fuevolt_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('fuevolt_theme', mode); } catch {}
    document.body.style.background = mode === 'dark' ? DARK.bg : LIGHT.bg;
    document.body.style.color = mode === 'dark' ? DARK.text : LIGHT.text;
  }, [mode]);

  const theme = mode === 'dark' ? DARK : LIGHT;
  const toggle = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
