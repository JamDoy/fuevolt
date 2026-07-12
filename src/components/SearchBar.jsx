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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: theme.textSecondary }}
            width={prominent ? 21 : 18}
            height={prominent ? 21 : 18}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M13 13l4 4" />
          </svg>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder || 'Search suburb, city or postcode...'}
            className={`w-full pl-12 pr-4 rounded-2xl focus:outline-none ${prominent ? 'py-4 text-base min-h-14' : 'py-3 text-sm'}`}
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
              event.target.style.boxShadow = `0 0 12px ${theme.mode === 'dark' ? 'rgba(255,215,0,0.15)' : 'rgba(200,151,31,0.12)'}`;
            }}
            onBlur={(event) => {
              window.setTimeout(() => setFocused(false), 120);
              event.target.style.borderColor = theme.inputBorder;
              event.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {focused && recentSearches.length > 0 && (
          <div
            className="absolute z-30 left-0 right-0 mt-2 rounded-2xl p-3"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 12px 30px rgba(0,0,0,0.22)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
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

      <div className={`flex gap-2 ${prominent ? 'flex-col sm:flex-row' : ''}`}>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`${prominent ? 'min-h-14 px-6 py-4 text-base' : 'px-5 py-3 text-sm'} rounded-2xl font-semibold cursor-pointer disabled:opacity-50`}
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
          className={`${prominent ? 'min-h-14 px-6 py-4 text-base w-full sm:w-auto' : 'px-5 py-3 text-sm'} rounded-2xl font-bold cursor-pointer disabled:opacity-50 whitespace-nowrap`}
          style={{
            background: 'linear-gradient(135deg, #C8971F, #FFD700)',
            color: '#0D2B5E',
            border: 'none',
            transition: 'all 0.25s ease',
            boxShadow: prominent ? '0 8px 24px rgba(200,151,31,0.24)' : 'none',
          }}
        >
          Use My Location
        </button>
      </div>
    </form>
  );
}
