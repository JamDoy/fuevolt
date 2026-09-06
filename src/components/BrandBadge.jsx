import { useState } from 'react';
import { getBrandStyle, getBrandLogoUrl } from '../utils/brandLogos';

// Shows the station's real logo (via Brandfetch) directly, with no circular
// background — logos come in varied aspect ratios (square icons, wide
// wordmarks) and clipping them into a circle cropped or squashed many of
// them. Falls back to the colored-monogram badge for brands Brandfetch
// doesn't cover, and automatically if the image fails to load.
export default function BrandBadge({ brand, size = 32, ringStyle }) {
  const [imgFailed, setImgFailed] = useState(false);
  const style = getBrandStyle(brand);
  const logoUrl = getBrandLogoUrl(brand);
  const showLogo = logoUrl && !imgFailed;

  if (showLogo) {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ height: size, maxWidth: size * 1.8 }}
      >
        <img
          src={logoUrl}
          alt={`${brand} logo`}
          onError={() => setImgFailed(true)}
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden"
      style={{ width: size, height: size, background: style.bg, ...ringStyle }}
    >
      <span className="font-extrabold" style={{ color: style.text, fontSize: size * 0.34 }}>
        {style.short}
      </span>
    </div>
  );
}
