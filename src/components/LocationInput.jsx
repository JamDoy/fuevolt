import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { autocompleteSearch } from '../utils/tomtom';

export default function LocationInput({ value, onChange, onSelect, placeholder, label }) {
  const { theme } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const results = await autocompleteSearch(query);
    setSuggestions(results);
    setShowDropdown(results.length > 0);
    setHighlightIdx(-1);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion.label);
    setSuggestions([]);
    setShowDropdown(false);
    if (onSelect) onSelect(suggestion);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold mb-1" style={{ color: theme.textSecondary }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm"
        style={{
          background: theme.inputBg,
          border: `1px solid ${theme.inputBorder}`,
          color: theme.inputText,
          outline: 'none',
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.label}-${i}`}
              onClick={() => handleSelect(s)}
              className="px-4 py-2.5 text-sm cursor-pointer"
              style={{
                color: theme.text,
                background: i === highlightIdx ? (theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
              }}
              onMouseEnter={() => setHighlightIdx(i)}
            >
              <span className="mr-2" style={{ opacity: 0.5 }}>
                {s.type === 'POI' ? '📍' : '🏙️'}
              </span>
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
