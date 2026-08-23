import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getRecentSearches, saveRecentSearch } from '../utils/sessionPreferences';

// Input + Search merged into one pill, "Use My Location" demoted to a small
// icon-only button — matches the merged search-bar pattern used by Amazon/
// Booking.com plus the icon-only "locate me" pattern used by Google Maps,
// rather than three separate equal-weight boxes. `prominent` only changes
// sizing (homepage hero vs. the more compact list-page search bars) — the
// layout and colors are the same everywhere for site-wide consistency.
export default function SearchBar({
  onSearch,
  onUseLocation,
  loading,
  placeholder,
  prominent = false,
  inputId = 'location-search',
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => getRecentSearches());
  const { theme } = useTheme();

  const search = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setRecentSearches(saveRecentSearch(trimmed));
    setFocused(false);
    onSearch(trimmed);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    search(query);
  };

  const inputHeight = prominent ? 'min-h-12 py-3 text-base' : 'min-h-11 py-2.5 text-sm';
  const searchIconSize = prominent ? 21 : 18;
  const locBtnSize = prominent ? 'min-h-12 min-w-12' : 'min-h-11 min-w-11';
  const locIconSize = prominent ? 20 : 18;

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <div
          className="flex items-stretch rounded-2xl overflow-hidden"
          style={{
            border: `1px solid ${focused ? theme.inputFocusBorder : theme.inputBorder}`,
            boxShadow: focused ? '0 0 0 3px rgba(34,197,94,0.3)' : 'none',
            background: theme.inputBg,
            transition: 'all 0.25s ease',
          }}
        >
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: theme.textSecondary }}
              width={searchIconSize}
              height={searchIconSize}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M13 13l4 4" />
            </svg>
            <label htmlFor={inputId} className="sr-only">
              {placeholder || 'Search suburb, city or postcode'}
            </label>
            <input
              id={inputId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder || 'Search suburb, city or postcode...'}
              className={`w-full pl-12 pr-4 focus:outline-none ${inputHeight}`}
              style={{ background: 'transparent', color: theme.inputText }}
              onFocus={() => {
                setFocused(true);
                setRecentSearches(getRecentSearches());
              }}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={`flex-shrink-0 px-6 font-semibold cursor-pointer disabled:opacity-50 ${inputHeight}`}
            style={{
              background: 'linear-gradient(135deg, #1A6FDB, #0D3A8C)',
              color: '#FFFFFF',
              border: 'none',
              transition: 'all 0.25s ease',
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {focused && recentSearches.length > 0 && (
          <div
            className="absolute z-30 left-0 right-0 mt-2 rounded-2xl p-3"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 12px 30px rgba(0,0,0,0.22)' }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
              Recent
            </p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((searchTerm) => (
                <button
                  key={searchTerm}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => search(searchTerm)}
                  className="px-3 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ background: theme.chipBg, color: theme.chipText, border: `1px solid ${theme.chipBorder}` }}
                >
                  {searchTerm}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onUseLocation}
        disabled={loading}
        aria-label="Use my location"
        title="Use my location"
        className={`flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50 ${locBtnSize}`}
        style={{
          background: 'linear-gradient(135deg, #B45309, #F59E0B)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(245,158,11,0.24)',
          transition: 'all 0.25s ease',
        }}
      >
        <svg width={locIconSize} height={locIconSize} viewBox="0 0 24 24" fill="none" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </button>
    </form>
  );
}
