import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ColorFilterChips from './ColorFilterChips';

const RADIUS_OPTIONS = [1, 2, 5, 10, 15, 20];

function Chip({ active, activeColor, onClick, children }) {
  const { theme } = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-8 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer"
      style={{
        background: active ? activeColor : theme.chipBg,
        color: active ? '#FFFFFF' : theme.chipText,
        border: `1px solid ${active ? activeColor : theme.chipBorder}`,
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </button>
  );
}

// Multi-select brand dropdown — a button that shows a condensed summary of
// what's picked, opening a checkbox list underneath. Plain absolute
// positioning (no portal) is fine here since the panel this lives in is
// rendered inline in the page flow, not inside any overflow-hidden ancestor.
function MultiSelectDropdown({ label, options, selected, onToggle, accentColor, emptyLabel = 'Any brand' }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (wrapRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const summary =
    selected.length === 0 ? emptyLabel : selected.length === 1 ? selected[0] : `${selected[0]} +${selected.length - 1}`;

  return (
    <div ref={wrapRef} className="relative">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
        {label}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
        style={{
          background: theme.chipBg,
          color: selected.length ? theme.text : theme.chipText,
          border: `1px solid ${open ? accentColor : theme.chipBorder}`,
        }}
      >
        <span className="truncate">{summary}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl p-1.5 max-h-52 overflow-y-auto"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 16px 40px rgba(0,0,0,0.35)', zIndex: 30 }}
        >
          {options.map((brand) => (
            <label
              key={brand}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs"
              style={{ color: theme.text }}
            >
              <input type="checkbox" checked={selected.includes(brand)} onChange={() => onToggle(brand)} style={{ accentColor }} />
              {brand}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Shared "Advanced Search" panel used by both the Fuel Prices and EV Charging
// pages — an inline expanding section (not a popup) rendered directly under
// the page's search controls. Replaces the old always-visible sort chip row
// (which worked, but its effect was too subtle to notice: it only reorders
// cards and the hero card always shows the cheapest/nearest result
// regardless). Bundling sort, search radius and brand filtering into one
// panel makes each choice deliberate and gives room for the "Nearest to you"
// labelling the user asked for.
export default function AdvancedSearchPanel({
  onApply,
  accentColor,
  accentTextColor = '#0D2B5E',
  sortOptions,
  sortBy,
  radius,
  brands = [],
  includeBrands = [],
  excludeBrands = [],
  connectorOptions,
  connectorFilters = [],
  speedOptions,
  speedFilters = [],
  maxPrice,
  accessOptions,
  accessTypes = [],
}) {
  const { theme } = useTheme();
  const [draftSort, setDraftSort] = useState(sortBy);
  const [draftRadius, setDraftRadius] = useState(radius);
  const [draftInclude, setDraftInclude] = useState(includeBrands);
  const [draftExclude, setDraftExclude] = useState(excludeBrands);
  const [draftConnector, setDraftConnector] = useState(connectorFilters);
  const [draftSpeed, setDraftSpeed] = useState(speedFilters);
  const [draftMaxPriceInput, setDraftMaxPriceInput] = useState(maxPrice != null ? String(maxPrice) : '');
  const [draftAccess, setDraftAccess] = useState(accessTypes);

  const toggleInclude = (brand) => {
    setDraftInclude((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
    setDraftExclude((prev) => prev.filter((b) => b !== brand));
  };

  const toggleExclude = (brand) => {
    setDraftExclude((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]));
    setDraftInclude((prev) => prev.filter((b) => b !== brand));
  };

  const toggleConnector = (id) => {
    setDraftConnector((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSpeed = (id) => {
    setDraftSpeed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAccess = (id) => {
    setDraftAccess((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleReset = () => {
    setDraftSort(sortOptions[0]?.id || sortBy);
    setDraftRadius(10);
    setDraftInclude([]);
    setDraftExclude([]);
    setDraftConnector([]);
    setDraftSpeed([]);
    setDraftMaxPriceInput('');
    setDraftAccess([]);
  };

  const handleApply = () => {
    const parsedMaxPrice = parseFloat(draftMaxPriceInput);
    const maxPriceValue = draftMaxPriceInput.trim() === '' || Number.isNaN(parsedMaxPrice) || parsedMaxPrice <= 0 ? null : parsedMaxPrice;
    onApply({
      sortBy: draftSort,
      radius: draftRadius,
      includeBrands: draftInclude,
      excludeBrands: draftExclude,
      connectorFilters: draftConnector,
      speedFilters: draftSpeed,
      maxPrice: maxPriceValue,
      accessTypes: draftAccess,
    });
  };

  return (
    <div className="rounded-2xl p-4 space-y-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
      {/* Sort */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
          Sort results by
        </p>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((opt) => (
            <Chip key={opt.id} active={draftSort === opt.id} activeColor={accentColor} onClick={() => setDraftSort(opt.id)}>
              {opt.label}
            </Chip>
          ))}
        </div>
        {draftSort === 'distance' && (
          <p className="text-[11px] mt-2" style={{ color: theme.textMuted }}>
            Results will be labelled "Nearest to you" and ordered closest first.
          </p>
        )}
      </div>

      {/* Radius */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
          Search radius
        </p>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((km) => (
            <Chip key={km} active={draftRadius === km} activeColor={accentColor} onClick={() => setDraftRadius(km)}>
              {km}km
            </Chip>
          ))}
        </div>
      </div>

      {/* Max price (Fuel Prices only) — a free-form field rather than fixed
          preset amounts, so this never needs adjusting as fuel prices rise. */}
      {maxPrice !== undefined && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
            Max price per litre
          </p>
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl w-full sm:w-48"
            style={{ background: theme.inputBg, border: `1px solid ${draftMaxPriceInput ? accentColor : theme.inputBorder}` }}
          >
            <span className="text-sm font-semibold" style={{ color: theme.textMuted }}>$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="Any price"
              value={draftMaxPriceInput}
              onChange={(e) => setDraftMaxPriceInput(e.target.value)}
              className="w-full text-sm font-semibold bg-transparent outline-none"
              style={{ color: theme.text }}
            />
            <span className="text-xs flex-shrink-0" style={{ color: theme.textMuted }}>/L</span>
            {draftMaxPriceInput && (
              <button
                type="button"
                onClick={() => setDraftMaxPriceInput('')}
                aria-label="Clear max price"
                className="cursor-pointer flex-shrink-0 leading-none"
                style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '16px' }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connector / Speed (EV Charging only) */}
      {connectorOptions && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
            Connector type
          </p>
          <ColorFilterChips options={connectorOptions} activeIds={draftConnector} onToggle={toggleConnector} />
        </div>
      )}
      {speedOptions && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
            Charging speed
          </p>
          <ColorFilterChips options={speedOptions} activeIds={draftSpeed} onToggle={toggleSpeed} size="sm" />
        </div>
      )}

      {/* Brand filters */}
      {brands.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MultiSelectDropdown
            label="Only show these brands"
            options={brands}
            selected={draftInclude}
            onToggle={toggleInclude}
            accentColor={accentColor}
          />
          <MultiSelectDropdown
            label="Exclude these brands"
            options={brands}
            selected={draftExclude}
            onToggle={toggleExclude}
            accentColor="#DC2626"
          />
        </div>
      )}

      {/* Access type (EV Charging only) */}
      {accessOptions && accessOptions.length > 0 && (
        <MultiSelectDropdown
          label="Access type"
          options={accessOptions}
          selected={draftAccess}
          onToggle={toggleAccess}
          accentColor={accentColor}
          emptyLabel="Any access type"
        />
      )}

      <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: `1px solid ${theme.cardBorder}` }}>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold cursor-pointer"
          style={{ background: 'none', border: 'none', color: theme.textMuted }}
        >
          Reset all
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="min-h-10 px-6 py-2 rounded-xl text-sm font-bold cursor-pointer"
          style={{ background: accentColor, color: accentTextColor, border: 'none' }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
