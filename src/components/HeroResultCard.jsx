import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getPriceContext } from '../utils/priceFreshness';

const BADGE_STYLES = {
  below: { label: 'Below average', background: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: '#22C55E' },
  about: { label: 'Average price', background: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#F59E0B' },
  above: { label: 'Above average', background: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#EF4444' },
};

const OVERLAP_RATIO = 0.65;

export default function HeroResultCard({ cheapest, avgPrice, freshness, onDetail, searchSectionRef }) {
  const cardRef = useRef(null);
  const [overlap, setOverlap] = useState(0);
  const context = getPriceContext(cheapest.price, avgPrice);
  const badge = context ? BADGE_STYLES[context] : null;

  useLayoutEffect(() => {
    const measure = () => {
      if (!cardRef.current) return;
      setOverlap(Math.round(cardRef.current.offsetHeight * OVERLAP_RATIO));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [cheapest.id, cheapest.name]);

  useEffect(() => {
    const searchSection = searchSectionRef.current;
    if (!searchSection) return undefined;

    const handleScroll = () => {
      if (!cardRef.current) return;
      const cardBottom = cardRef.current.getBoundingClientRect().bottom;
      const viewportHeight = window.innerHeight;
      const scrollProgress = Math.max(0, Math.min(1, 1 - cardBottom / (viewportHeight * 0.5)));
      const blurAmount = 6 * (1 - scrollProgress);
      searchSection.style.filter = blurAmount > 0.5 ? `blur(${blurAmount}px)` : 'none';
      searchSection.style.pointerEvents = blurAmount < 0.5 ? 'auto' : 'none';
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      searchSection.style.filter = 'none';
      searchSection.style.pointerEvents = 'auto';
    };
  }, [cheapest.id, searchSectionRef]);

  const handleSearchAgain = () => {
    if (cardRef.current) {
      const top = cardRef.current.getBoundingClientRect().bottom + window.scrollY + 20;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    window.setTimeout(() => {
      const input = document.getElementById('fuel-location-search');
      if (!input) return;
      input.style.transition = 'box-shadow 200ms ease';
      input.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.5)';
      input.focus();
      window.setTimeout(() => { input.style.boxShadow = ''; }, 1500);
    }, 400);
  };

  return (
    <div
      ref={cardRef}
      className="hero-result-card relative z-10 mx-auto w-[92%] sm:w-3/5 px-5 py-5 sm:px-8 sm:py-7"
      style={{
        marginTop: `-${overlap}px`,
        maxWidth: '680px',
        background: 'rgba(10, 22, 40, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '24px',
        animation: 'heroCardEntry 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards, heroGlowPulse 600ms ease-out forwards',
      }}
    >
      <p
        className="text-[11px] font-bold uppercase mb-3"
        style={{ color: '#22C55E', letterSpacing: '0.15em' }}
      >
        &#9889; CHEAPEST NEAR YOU
      </p>

      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="min-w-0">
          <h3
            className="text-[28px] sm:text-[34px] font-extrabold text-white"
            style={{ letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
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
          onClick={handleSearchAgain}
          className="hero-search-again text-xs font-medium cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none' }}
        >
          Search again &darr;
        </button>
      </div>
    </div>
  );
}

export function HeroResultCardSkeleton({ theme }) {
  const shimmerClass = theme.mode === 'dark' ? 'shimmer-dark' : 'shimmer-light';
  return (
    <div
      className="relative z-10 mx-auto w-[92%] sm:w-3/5 px-5 py-5 sm:px-8 sm:py-7"
      style={{
        marginTop: '-140px',
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
