import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORY_COLORS = {
  'Fuel Guide': { bg: '#FFF3CD', text: '#856404' },
  'EV Guide': { bg: '#D4EDDA', text: '#155724' },
  'Comparison': { bg: '#CCE5FF', text: '#004085' },
  'Tips': { bg: '#F8D7DA', text: '#721C24' },
};

export default function ArticlesPage({ onArticle }) {
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState('All');
  const { theme } = useTheme();

  useEffect(() => {
    fetch('/content/articles/index.json')
      .then((r) => r.json())
      .then(setArticles)
      .catch(() => {});
  }, []);

  const categories = ['All', ...new Set(articles.map((a) => a.category))];
  const filtered = filter === 'All' ? articles : articles.filter((a) => a.category === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: theme.heading }}>Guides & Articles</h1>
      <p className="text-sm mb-5" style={{ color: theme.subtext }}>
        Expert guides on fuel, EV charging, and saving money on the road
      </p>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === cat ? theme.accent : theme.cardBg,
              color: filter === cat ? '#fff' : theme.text,
              border: `1px solid ${filter === cat ? theme.accent : theme.cardBorder}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Article cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((article) => {
          const catColor = CATEGORY_COLORS[article.category] || { bg: '#E2E3E5', text: '#383D41' };
          return (
            <button
              key={article.id}
              onClick={() => onArticle(article.slug)}
              className="text-left rounded-xl p-5 transition-all hover:scale-[1.02]"
              style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            >
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2"
                style={{ background: catColor.bg, color: catColor.text }}
              >
                {article.category}
              </span>
              <h3 className="font-semibold text-sm leading-snug mb-2" style={{ color: theme.heading }}>
                {article.title}
              </h3>
              <p className="text-xs leading-relaxed mb-3" style={{ color: theme.subtext }}>
                {article.description}
              </p>
              <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>
                {article.readTime}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm mt-8" style={{ color: theme.subtext }}>No articles found.</p>
      )}
    </div>
  );
}
