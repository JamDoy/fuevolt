import { useState } from 'react';

export default function SearchBar({ onSearch, onUseLocation, loading, placeholder }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="relative flex-1">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="8" cy="8" r="6" />
          <path d="M13 13l4 4" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Search suburb, city or postcode...'}
          className="w-full pl-11 pr-4 py-3 rounded-xl text-white text-sm focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.25s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#FFD700';
            e.target.style.boxShadow = '0 0 12px rgba(255,215,0,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.15)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50"
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
          className="px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #C8971F, #FFD700)',
            color: '#0D2B5E',
            border: 'none',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = '0 0 20px rgba(255,215,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = 'none';
          }}
        >
          📍 Use My Location
        </button>
      </div>
    </form>
  );
}
