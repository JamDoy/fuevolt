import { useEffect, useRef } from 'react';

// Renders one Google AdSense display ad unit. Reuses the same non-intrusive
// placement pattern the Ezoic integration used (see SideRailAds.jsx) — this
// component only controls the ad itself, not where it sits on the page.
export default function AdSenseAd({ slot, className = '', style }) {
  const insRef = useRef(null);

  useEffect(() => {
    if (!insRef.current || insRef.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script may not have loaded yet (e.g. blocked, or account
      // not yet approved) — fail silently rather than break the page.
    }
  }, []);

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-7549230738737699"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
