import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';
import { getBrandStyle } from '../utils/brandLogos';
import TouchableMap from '../components/TouchableMap';

const greenPin = new L.DivIcon({
  className: 'custom-marker',
  html: `<svg width="36" height="52" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#22C55E"/>
    <circle cx="14" cy="14" r="6" fill="#0D2B5E"/>
  </svg>`,
  iconSize: [36, 52],
  iconAnchor: [18, 52],
  popupAnchor: [0, -52],
});

const STATUS_CONFIG = {
  'Operational': { color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', label: 'Operational', pulse: true },
  'Available': { color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', label: 'Operational', pulse: true },
  'Not Operational': { color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', label: 'Not operational', pulse: false },
  'Offline': { color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', label: 'Not operational', pulse: false },
};
const STATUS_UNKNOWN = { color: '#9CA3AF', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)', label: 'Status unknown', pulse: false };

const VEHICLE_PRESETS = {
  small: { label: 'Small EV (40kWh)', kwh: 40 },
  medium: { label: 'Medium EV (60kWh)', kwh: 60 },
  large: { label: 'Large EV (80kWh)', kwh: 80 },
  suv: { label: 'Large SUV (100kWh)', kwh: 100 },
};
const COST_PER_KWH_DEFAULT = 0.45;

function speedTier(kw) {
  if (kw >= 50) return { label: 'Ultra-Rapid', bg: '#22C55E', text: '#FFFFFF' };
  if (kw >= 7) return { label: 'Fast', bg: '#F59E0B', text: '#0D2B5E' };
  return { label: 'Slow', bg: '#0D2B5E', text: '#FFFFFF' };
}

export default function EVStationDetailPage({ station, onBack, onStationDetail }) {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [shareStatus, setShareStatus] = useState('');
  const [heroVisible, setHeroVisible] = useState(true);
  const [currentPct, setCurrentPct] = useState(20);
  const [targetPct, setTargetPct] = useState(80);
  const [vehicleKey, setVehicleKey] = useState('medium');
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const info = station.AddressInfo || {};
  const lat = info.Latitude;
  const lng = info.Longitude;
  const address = [info.AddressLine1, info.Town, info.StateOrProvince, info.Postcode].filter(Boolean).join(', ');
  const distance = info.Distance != null ? info.Distance.toFixed(1) : null;
  const connections = station.Connections || [];
  const maxPower = connections.length ? Math.max(...connections.map((c) => c.PowerKW || 0)) : 0;
  const tier = speedTier(maxPower);
  const statusConfig = STATUS_CONFIG[station.StatusType?.Title] || STATUS_UNKNOWN;
  const operatorStyle = getBrandStyle(station.OperatorInfo?.Title);

  const rank = station.resultRank;
  const total = station.resultTotal;
  const suburbName = station.resultSuburb || '';
  const hasAlternativesContext = station.resultAlternatives != null;
  const alternatives = station.resultAlternatives || [];
  const isLocalClosest = alternatives.length === 0 || (alternatives[0].AddressInfo?.Distance ?? Infinity) >= (info.Distance ?? 0);

  const vehicle = VEHICLE_PRESETS[vehicleKey];
  const kWhNeeded = Math.max(0, (targetPct - currentPct) / 100 * vehicle.kwh);
  const estimatedCost = kWhNeeded * COST_PER_KWH_DEFAULT;
  const estimatedTimeMin = maxPower > 0 ? Math.round((kWhNeeded / maxPower) * 60) : null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}`;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const platformNavUrl = isIOS ? `maps://maps.apple.com/?daddr=${lat},${lng}` : isAndroid ? `google.navigation:q=${lat},${lng}` : directionsUrl;

  const handleNavigate = () => { window.location.href = platformNavUrl; };

  const handleCopyAddress = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(address);
      setShareStatus('Address copied ✓');
    } catch {
      setShareStatus('Unable to copy');
    }
    window.setTimeout(() => setShareStatus(''), 2000);
  };

  const handleShare = async () => {
    const text = `Found an EV charger at ${info.Title} via fuevolt.com`;
    const shareData = { title: info.Title, text, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Shared');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setShareStatus('Copied to clipboard');
      } else {
        setShareStatus('Unable to share');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setShareStatus('Unable to share');
    }
    window.setTimeout(() => setShareStatus(''), 2500);
  };

  const cardStyle = { background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '16px' };

  return (
    <div className="max-w-4xl mx-auto pb-24 sm:pb-6" style={{ animation: 'evFadeSlideIn 0.35s ease' }}>
      {/* [1] Hero */}
      <Section index={0}>
        <div
          ref={heroRef}
          className="px-4 pt-5 pb-6 sm:px-6 sm:rounded-2xl sm:mt-4"
          style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0D2B5E 100%)', boxShadow: '0 0 48px rgba(34,197,94,0.15), 0 0 80px rgba(245,158,11,0.08)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] cursor-pointer" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              Back to results
            </button>
            <button type="button" onClick={handleShare} aria-label="Share this charger" className="cursor-pointer flex-shrink-0" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /></svg>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: '48px', height: '48px', background: operatorStyle.bg }}>
              <span className="font-extrabold text-lg" style={{ color: operatorStyle.text }}>{operatorStyle.short}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-[28px] sm:text-4xl font-extrabold text-white truncate" style={{ letterSpacing: '-0.02em' }}>{info.Title || 'EV Charger'}</h1>
            </div>
          </div>

          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {station.OperatorInfo?.Title}{station.OperatorInfo?.Title ? ' · ' : ''}{distance ? `${distance} km away` : ''}
          </p>
          {address && <p className="text-[13px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{address}</p>}

          <div
            className="mt-5 flex items-center gap-3"
            style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, borderRadius: '16px', padding: '16px 20px' }}
          >
            <span
              className="flex-shrink-0 rounded-full"
              style={{ width: '14px', height: '14px', background: statusConfig.color, animation: statusConfig.pulse ? 'evStatusPulse 2s ease-in-out infinite' : 'none' }}
            />
            <div>
              <p className="font-extrabold text-lg" style={{ color: statusConfig.color }}>{statusConfig.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {station.NumberOfPoints ? `${station.NumberOfPoints} charging point${station.NumberOfPoints === 1 ? '' : 's'} · ` : ''}
                Status from Open Charge Map
              </p>
            </div>
          </div>

          {shareStatus && <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{shareStatus}</p>}
        </div>
      </Section>

      <div className="px-4 sm:px-0">
        {/* [2] Charger list */}
        <Section index={1}>
          <div className="mt-3" style={{ ...cardStyle, padding: '20px' }}>
            <h2 className="text-[15px] font-bold mb-3" style={{ color: theme.heading }}>Chargers at this station</h2>
            {connections.length === 0 ? (
              <p className="text-sm" style={{ color: theme.textMuted }}>Connector details not available for this station.</p>
            ) : (
              <div className="space-y-2">
                {connections.map((conn, i) => {
                  const t = speedTier(conn.PowerKW || 0);
                  return (
                    <div key={i} className="flex items-center justify-between" style={{ background: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderRadius: '10px', padding: '10px 14px' }}>
                      <span className="text-sm font-semibold" style={{ color: theme.text }}>{conn.ConnectionType?.Title || 'Unknown connector'}</span>
                      <span className="flex items-center gap-2">
                        {conn.PowerKW != null && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.text }}>{conn.PowerKW}kW</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-center mt-3" style={{ color: theme.textMuted }}>
              Live per-connector availability isn't provided by this data source — operational status only.
            </p>
          </div>
        </Section>

        {/* [3] Navigate There */}
        <Section index={2}>
          <div className="mt-3" style={{ ...cardStyle, padding: '20px', boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-2xl" aria-hidden="true">&#128205;</p>
                <p className="font-extrabold text-[22px]" style={{ color: theme.text }}>{distance != null ? `${distance} km` : '—'}</p>
                <p className="text-[11px] uppercase" style={{ color: theme.textMuted }}>Distance</p>
              </div>
              <div>
                <p className="text-2xl" aria-hidden="true">&#9889;</p>
                <p className="font-extrabold text-[22px]" style={{ color: '#22C55E' }}>{maxPower ? `${maxPower}kW` : '—'}</p>
                <p className="text-[11px] uppercase" style={{ color: theme.textMuted }}>Max speed</p>
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${theme.divider}`, margin: '16px 0' }} />
            <button
              type="button"
              onClick={handleNavigate}
              className="navigate-cta w-full cursor-pointer"
              style={{ height: '56px', background: '#22C55E', borderRadius: '14px', boxShadow: '0 4px 16px rgba(34,197,94,0.35)', border: 'none', color: '#FFFFFF', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}
            >
              &#9654; Navigate to {info.Title}
            </button>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-3 text-xs" style={{ color: theme.textMuted }}>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.textMuted }}>Open in Google Maps</a>
              <span>&middot;</span>
              <a href={appleMapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.textMuted }}>Open in Apple Maps</a>
              <span>&middot;</span>
              <button type="button" onClick={handleCopyAddress} className="cursor-pointer" style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '12px' }}>Copy address</button>
            </div>
          </div>
        </Section>

        {/* [4] Charging Cost Estimate */}
        <Section index={3}>
          <div className="mt-3" style={{ ...cardStyle, padding: '20px' }}>
            <h2 className="text-[15px] font-bold mb-1" style={{ color: theme.heading }}>Estimated cost for your session</h2>
            <p className="text-xs mb-4" style={{ color: theme.textMuted }}>Estimate only — actual costs vary by network</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="block">
                <span className="text-xs font-semibold" style={{ color: theme.textSecondary }}>Battery at</span>
                <input
                  type="number" min="0" max="100" value={currentPct}
                  onChange={(e) => setCurrentPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                  style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold" style={{ color: theme.textSecondary }}>Charge to</span>
                <input
                  type="number" min="0" max="100" value={targetPct}
                  onChange={(e) => setTargetPct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                  style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
                />
              </label>
            </div>
            <label className="block mb-4">
              <span className="text-xs font-semibold" style={{ color: theme.textSecondary }}>My vehicle</span>
              <select
                value={vehicleKey}
                onChange={(e) => setVehicleKey(e.target.value)}
                className="w-full mt-1 rounded-lg px-3 py-2 text-sm"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
              >
                {Object.entries(VEHICLE_PRESETS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}
              </select>
            </label>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs" style={{ color: theme.textMuted }}>Est. cost</p>
                <p className="font-black text-3xl" style={{ color: '#F59E0B' }}>${estimatedCost.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: theme.textMuted }}>Est. time</p>
                <p className="font-bold text-lg text-white" style={{ color: theme.text }}>{estimatedTimeMin != null ? `${estimatedTimeMin} mins` : '—'}</p>
              </div>
            </div>
            <p className="text-[11px] mt-3" style={{ color: theme.textMuted }}>
              Based on a typical Australian public charging rate (~{(COST_PER_KWH_DEFAULT * 100).toFixed(0)}c/kWh) — this network's actual rate may differ.
            </p>
          </div>
        </Section>

        {/* [5] Charger Specs */}
        <Section index={4}>
          <div className="mt-3" style={{ ...cardStyle, padding: '20px' }}>
            <h2 className="text-[15px] font-bold mb-3" style={{ color: theme.heading }}>Charger specs</h2>
            <div className="space-y-2.5">
              <SpecRow label="Network" value={station.OperatorInfo?.Title || 'Not specified'} theme={theme} />
              <SpecRow label="Max power" value={maxPower ? `${maxPower}kW` : 'Not specified'} theme={theme} />
              <SpecRow
                label="Charging speed"
                value={<span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: tier.bg, color: tier.text }}>{tier.label}</span>}
                theme={theme}
              />
              <SpecRow label="Access" value={station.UsageType?.Title || 'Not specified'} theme={theme} />
              <SpecRow label="Cost" value={station.UsageCost || 'Not specified — check with the network operator'} theme={theme} />
              {station.DateLastVerified && (
                <SpecRow label="Last verified" value={new Date(station.DateLastVerified).toLocaleDateString('en-AU')} theme={theme} />
              )}
            </div>
          </div>
        </Section>

        {/* [6] Ranking (distance-based — no pricing data exists for EV) */}
        {rank != null && total != null && (
          <Section index={5}>
            <RankingBadge rank={rank} total={total} suburb={suburbName} />
          </Section>
        )}

        {/* Map */}
        <Section index={6}>
          <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.mapBorder}` }}>
            <TouchableMap>
              {(mapActive, interactionController) => (
                <MapContainer center={[lat, lng]} zoom={16} style={{ height: '260px', width: '100%' }} scrollWheelZoom={false} dragging={false}>
                  {interactionController}
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]} icon={greenPin}>
                    <Popup>
                      <div style={{ color: '#1a1a1a' }}>
                        <strong style={{ color: '#0D2B5E' }}>{info.Title}</strong>
                        <br />
                        <span style={{ fontSize: '12px' }}>{address}</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </TouchableMap>
          </div>
        </Section>

        {/* [7] Nearby Alternatives */}
        {hasAlternativesContext && (
          <Section index={7}>
            <div className="mt-3" style={{ ...cardStyle, padding: '20px' }}>
              {isLocalClosest ? (
                <>
                  <h2 className="text-[15px] font-bold" style={{ color: '#22C55E' }}>&#10003; This is the closest charger nearby</h2>
                  <p className="text-xs mt-1" style={{ color: theme.textMuted }}>No closer chargers within 5km</p>
                </>
              ) : (
                <>
                  <h2 className="text-[15px] font-bold mb-3" style={{ color: theme.heading }}>Other chargers nearby</h2>
                  {alternatives.map((alt) => {
                    const altDist = alt.AddressInfo?.Distance;
                    const diff = altDist != null && info.Distance != null ? altDist - info.Distance : null;
                    const closer = diff != null && diff < -0.05;
                    return (
                      <div
                        key={alt.ID}
                        role="button"
                        tabIndex={0}
                        onClick={() => onStationDetail?.(alt)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onStationDetail?.(alt); }}
                        className="flex items-center justify-between mb-2 cursor-pointer alt-station-row"
                        style={{ background: theme.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#F9FAFB', borderRadius: '12px', padding: '12px 14px' }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: theme.heading }}>{alt.AddressInfo?.Title}</p>
                          <p className="text-xs" style={{ color: theme.textMuted }}>{altDist != null ? `${altDist.toFixed(1)} km away` : ''}</p>
                        </div>
                        {diff != null && (
                          <p className="text-[11px] font-semibold flex-shrink-0" style={{ color: closer ? '#22C55E' : '#EF4444' }}>
                            {closer ? `${Math.abs(diff).toFixed(1)} km closer` : `+${diff.toFixed(1)} km further`}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Section>
        )}
      </div>

      {!heroVisible && (
        <div
          className="sm:hidden fixed left-0 right-0 bottom-0 z-40"
          style={{ height: '72px', background: theme.cardBg, borderTop: `1px solid ${theme.cardBorder}`, padding: '12px 16px', boxShadow: '0 -4px 16px rgba(0,0,0,0.25)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={handleNavigate}
            className="navigate-cta w-full h-full cursor-pointer"
            style={{ background: '#22C55E', borderRadius: '12px', border: 'none', color: '#FFFFFF', fontSize: '15px', fontWeight: 700 }}
          >
            &#9654; Navigate to {info.Title}
          </button>
        </div>
      )}

      <style>{`
        @keyframes evFadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes evSectionFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes evStatusPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.15); } }
        .navigate-cta { transition: transform 150ms ease; }
        .navigate-cta:active { transform: scale(0.97); }
        .alt-station-row { transition: transform 150ms ease, box-shadow 150ms ease; }
        @media (hover: hover) {
          .alt-station-row:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        }
      `}</style>
    </div>
  );
}

function Section({ index, children }) {
  return <div style={{ animation: 'evSectionFadeIn 250ms ease-out both', animationDelay: `${index * 60}ms` }}>{children}</div>;
}

function SpecRow({ label, value, theme }) {
  return (
    <div className="flex items-center justify-between" style={{ minHeight: '32px' }}>
      <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>{label}</span>
      <span className="text-sm text-right" style={{ color: theme.text }}>{value}</span>
    </div>
  );
}

function RankingBadge({ rank, total, suburb }) {
  const isFirst = rank === 1;
  const isTop3 = rank <= 3;
  const gradient = isFirst ? 'linear-gradient(135deg, #F59E0B, #FDE68A)' : isTop3 ? 'linear-gradient(135deg, #22C55E, #4ADE80)' : '#0D2B5E';
  const percentile = Math.round((rank / total) * 100);

  let mainText;
  if (isFirst) mainText = `\u{1F3C6} Closest EV charger in ${suburb}`;
  else if (isTop3) mainText = `#${rank} closest EV charger in ${suburb}`;
  else mainText = `In the top ${percentile}% closest chargers in ${suburb}`;

  return (
    <div className="mt-3 flex items-center gap-4" style={{ background: '#0D2B5E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 20px' }}>
      <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: '52px', height: '52px', background: gradient }}>
        <span className="font-black" style={{ fontSize: rank > 99 ? '13px' : '20px', color: '#FFFFFF' }}>{rank > 99 ? `Top ${percentile}%` : `#${rank}`}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-bold text-white">{mainText}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Out of {total} chargers checked</p>
      </div>
    </div>
  );
}
