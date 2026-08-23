import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getRecentSearches, saveRecentSearch } from '../utils/sessionPreferences';

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

  const recentDropdown = focused && recentSearches.length > 0 && (
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
  );

  // Prominent (homepage hero): input + Search merged into one pill, "Use My
  // Location" demoted to a small icon-only button — matches the merged
  // search-bar pattern used by Amazon/Booking.com plus the icon-only
  // "locate me" pattern used by Google Maps, rather than three separate
  // equal-weight boxes.
  if (prominent) {
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
                width={21}
                height={21}
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
                className="w-full min-h-12 pl-12 pr-4 py-3 text-base focus:outline-none"
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
              className="flex-shrink-0 min-h-12 px-6 text-base font-semibold cursor-pointer disabled:opacity-50"
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

          {recentDropdown}
        </div>

        <button
          type="button"
          onClick={onUseLocation}
          disabled={loading}
          aria-label="Use my location"
          title="Use my location"
          className="flex-shrink-0 min-h-12 min-w-12 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #B45309, #F59E0B)',
            border: 'none',
            boxShadow: '0 8px 24px rgba(245,158,11,0.24)',
            transition: 'all 0.25s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D2B5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: theme.textSecondary }}
            width={18}
            height={18}
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
            className="w-full pl-12 pr-4 rounded-2xl focus:outline-none py-3 text-sm"
            style={{
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.inputText,
              transition: 'all 0.25s ease',
            }}
            onFocus={(event) => {
              setFocused(true);
              setRecentSearches(getRecentSearches());
              event.target.style.borderColor = theme.inputFocusBorder;
              event.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.3)';
            }}
            onBlur={(event) => {
              window.setTimeout(() => setFocused(false), 120);
              event.target.style.borderColor = theme.inputBorder;
              event.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {recentDropdown}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-3 text-sm rounded-2xl font-semibold cursor-pointer disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #1A6FDB, #0D3A8C)',
            color: '#FFFFFF',
            border: 'none',
            transition: 'all 0.25s ease',
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>

        <button
          type="button"
          onClick={onUseLocation}
          disabled={loading}
          className="px-5 py-3 text-sm rounded-2xl font-bold cursor-pointer disabled:opacity-50 whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #B45309, #F59E0B)',
            color: '#0D2B5E',
            border: 'none',
            transition: 'all 0.25s ease',
          }}
        >
          Use My Location
        </button>
      </div>
    </form>
  );
}
