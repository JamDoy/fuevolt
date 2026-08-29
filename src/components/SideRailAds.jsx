import AdSenseAd from './AdSenseAd';

const RAIL_AD_SLOT = '1239070178';

// Side-of-page ad rails. Only shown on very wide viewports (2xl, 1536px+)
// where the centred page content (max-w-6xl = 1152px) genuinely leaves
// enough empty gutter on each side to fit a 160px ad without crowding real
// content — hidden entirely below that, so mobile and typical laptop
// screens (the majority of traffic) never see them.
export default function SideRailAds() {
  return (
    <>
      <div
        className="hidden 2xl:block"
        style={{ position: 'fixed', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '160px', zIndex: 10 }}
      >
        <AdSenseAd slot={RAIL_AD_SLOT} style={{ width: '160px', height: '600px' }} />
      </div>
      <div
        className="hidden 2xl:block"
        style={{ position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '160px', zIndex: 10 }}
      >
        <AdSenseAd slot={RAIL_AD_SLOT} style={{ width: '160px', height: '600px' }} />
      </div>
    </>
  );
}
