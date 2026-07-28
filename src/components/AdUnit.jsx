import { useEffect, useRef } from 'react';

const ADSENSE_PUB_ID = 'ca-pub-7549230738737699';

export default function AdUnit({ className = '' }) {
  const insRef = useRef(null);

  useEffect(() => {
    if (!insRef.current || insRef.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not loaded (e.g. blocked by an ad blocker) — safe to ignore
    }
  }, []);

  return (
    <div className={className} style={{ margin: '24px 0', textAlign: 'center', minHeight: '90px' }}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={ADSENSE_PUB_ID}
        data-ad-slot="auto"
      />
    </div>
  );
}
