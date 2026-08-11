import { useEffect, useRef, useState } from 'react';
import { getPriceContext } from '../utils/priceFreshness';

const BADGE_STYLES = {
  below: { label: 'Below average', background: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: '#22C55E' },
  about: { label: 'Average price', background: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B' },
  above: { label: 'Above average', background: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#EF4444' },
};

const HINT_KEY = 'fuevolt_hero_hint_shown';
const EXIT_MS = 280;

function hintAlreadyShown() {
  try {
    return localStorage.getItem(HINT_KEY) === 'true';
  } catch {
    return true;
  }
}

function markHintShown() {
  try {
    localStorage.setItem(HINT_KEY, 'true');
  } catch {
    // localStorage may be unavailable in restricted browser modes.
  }
}

export default function HeroResultCard({ cheapest, avgPrice, freshness, onDetail }) {
  // 'expanded' (full blurred takeover) | 'exiting' (shrink/fade transition) | 'compact' (in-flow bar)
  const [phase, setPhase] = useState('expanded');
  const [showHint, setShowHint] = useState(false);
  const cardRef = useRef(null);
  const compactRef = useRef(null);
  const hintTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  const context = getPriceContext(cheapest.price, avgPrice);
  const badge = context ? BADGE_STYLES[context] : null;

  useEffect(() => {
    if (phase === 'compact') return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'expanded') return undefined;
    cardRef.current?.focus();
    if (!hintAlreadyShown()) {
      markHintShown();
      setShowHint(true);
      hintTimerRef.current = window.setTimeout(() => setShowHint(false), 2000);
    }
    const onKey = (event) => {
      if (event.key === 'Escape') startExit();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
  }, []);

  const startExit = () => {
    if (phase !== 'expanded') return;
    setPhase('exiting');
    exitTimerRef.current = window.setTimeout(() => {
      setPhase('compact');
      window.requestAnimationFrame(() => compactRef.current?.focus());
    }, EXIT_MS);
  };

  const expand = () => {
    setPhase('expanded');
  };

  if (phase === 'compact') {
    return (
      <button
        ref={compactRef}
        type="button"
        onClick={expand}
        className="compact-hero-card mx-auto w-[92%] sm:w-3/5 flex items-center justify-between gap-3 cursor-pointer"
        style={{
          maxWidth: '680px',
          height: '80px',
          background: 'rgba(10,22,40,0.95)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(34,197,94,0.12)',
          padding: '0 20px',
          animation: 'heroCompactIn 220ms ease-out forwards',
        }}
      >
        <CompactContent cheapest={cheapest} />
      </button>
    );
  }

  const exiting = phase === 'exiting';

  return (
    <>
      <div
        className="hero-overlay fixed inset-0 z-40 cursor-pointer"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(10, 22, 40, 0.45)',
          opacity: exiting ? 0 : 1,
          pointerEvents: exiting ? 'none' : 'auto',
          transition: 'opacity 200ms ease',
        }}
        onClick={startExit}
        aria-hidden="true"
      />

      {showHint && !exiting && (
        <p
          className="fixed left-1/2 z-50"
          style={{
            bottom: '24px',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            transition: 'opacity 400ms ease',
            opacity: showHint ? 1 : 0,
            pointerEvents: 'none',
          }}
        >
          Tap anywhere to close
        </p>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Cheapest fuel: ${cheapest.name}`}
          tabIndex={-1}
          className={`hero-result-card relative w-[92%] sm:w-3/5 ${exiting ? 'flex items-center justify-between gap-3 px-5' : 'px-5 py-5 sm:px-8 sm:py-7'}`}
          style={{
            pointerEvents: 'auto',
            maxWidth: '680px',
            maxHeight: exiting ? '88px' : '300px',
            overflow: 'hidden',
            background: 'rgba(10, 22, 40, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: exiting ? '16px' : '24px',
            transform: exiting ? 'scale(0.97)' : 'scale(1)',
            boxShadow: exiting
              ? '0 2px 12px rgba(0,0,0,0.15)'
              : '0 0 0 1px rgba(34,197,94,0.2), 0 0 24px rgba(34,197,94,0.25), 0 0 48px rgba(34,197,94,0.12), 0 0 80px rgba(245,158,11,0.08), 0 20px 60px rgba(0,0,0,0.5)',
            transition: 'max-height 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 280ms ease, box-shadow 280ms ease',
            animation: exiting ? undefined : 'heroCardEntry 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards, heroGlowPulse 600ms ease-out forwards',
          }}
        >
          {exiting ? (
            <CompactContent cheapest={cheapest} />
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase mb-3" style={{ color: '#22C55E', letterSpacing: '0.15em' }}>
                &#9889; CHEAPEST NEAR YOU
              </p>

              <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="min-w-0">
                  <h3 className="text-[28px] sm:text-[34px] font-extrabold text-white" style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {cheapest.name}
                  </h3>
                  <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {cheapest.brand} &middot; {cheapest.distance} km away
                  </p>
                  {cheapest.address && (
                    <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {cheapest.address}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="leading-none font-black text-[56px] sm:text-[68px]" style={{ color: '#F59E0B', letterSpacing: '-0.03em' }}>
                    {(cheapest.price * 100).toFixed(1)}
                    <span className="text-lg font-semibold align-top ml-1" style={{ color: '#F59E0B' }}>&cent;/L</span>
                  </p>
                  {badge && (
                    <span
                      className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: badge.background, border: `1px solid ${badge.border}`, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0 16px' }} />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {freshness?.checkedLabel || freshness?.label}
                </p>
                <button
                  type="button"
                  onClick={onDetail}
                  className="hero-view-details text-[13px] font-semibold cursor-pointer"
                  style={{ color: '#22C55E', background: 'none', border: 'none' }}
                >
                  View Details &rarr;
                </button>
                <button
                  type="button"
                  onClick={startExit}
                  className="hero-search-again text-xs font-medium cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none' }}
                >
                  Search again &darr;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function CompactContent({ cheapest }) {
  return (
    <>
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="hero-dot flex-shrink-0"
          style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', animation: 'heroDotPulse 2s ease-in-out infinite' }}
        />
        <span className="text-[11px] font-bold flex-shrink-0" style={{ color: '#22C55E' }}>&#9889; Cheapest:</span>
        <span className="text-sm font-bold truncate" style={{ color: '#FFFFFF' }}>{cheapest.name}</span>
        <span className="text-[13px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>&middot; {cheapest.distance} km</span>
      </span>
      <span className="flex items-center gap-3 flex-shrink-0">
        <span className="font-extrabold text-[22px]" style={{ color: '#F59E0B' }}>
          {(cheapest.price * 100).toFixed(1)}<span className="text-xs">&cent;/L</span>
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Details &rarr;</span>
      </span>
    </>
  );
}

export function HeroResultCardSkeleton({ theme }) {
  const shimmerClass = theme.mode === 'dark' ? 'shimmer-dark' : 'shimmer-light';
  return (
    <div
      className="relative z-10 mx-auto w-[92%] sm:w-3/5 px-5 py-5 sm:px-8 sm:py-7"
      style={{
        maxWidth: '680px',
        background: 'rgba(10, 22, 40, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '24px',
      }}
    >
      <div className={`${shimmerClass} h-3 w-40 rounded-lg mb-4`} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className={`${shimmerClass} h-8 w-3/4 rounded-lg mb-3`} />
          <div className={`${shimmerClass} h-3 w-1/2 rounded-lg`} />
        </div>
        <div className={`${shimmerClass} h-12 w-32 rounded-lg flex-shrink-0`} />
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0 16px' }} />
      <div className={`${shimmerClass} h-3 w-full rounded-lg`} />
    </div>
  );
}
