import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { fetchLatestNews, formatNewsDate } from '../utils/rss';

export default function LatestNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchLatestNews()
      .then((items) => {
        setNews(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: theme.heading }}>Latest News</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex-shrink-0 w-56 rounded-xl overflow-hidden" style={{ background: theme.cardBg }}>
              <div className="w-full h-28" style={{ background: theme.shimmerBase }} />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded w-3/4" style={{ background: theme.shimmerBase }} />
                <div className="h-3 rounded w-1/2" style={{ background: theme.shimmerBase }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-1" style={{ color: theme.heading }}>Latest Auto & EV News</h2>
      <p className="text-[11px] mb-4" style={{ color: theme.textMuted }}>
        Headlines from Australian automotive sources. Auto-refreshes every 6 hours.
      </p>

      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
        {news.slice(0, 10).map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-56 rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, textDecoration: 'none', scrollSnapAlign: 'start' }}
          >
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt=""
                className="w-full h-28 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
                loading="lazy"
              />
            )}
            <div className="p-3">
              <h3 className="text-xs font-semibold leading-snug mb-1 line-clamp-2" style={{ color: theme.heading }}>
                {item.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: theme.textMuted }}>
                <span>{item.sourceIcon} {item.source}</span>
                {item.pubDate && <span>· {formatNewsDate(item.pubDate)}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="text-[11px] mt-3 text-center" style={{ color: theme.textMuted }}>
        News headlines sourced from The Driven, CarExpert, and Drive.com.au. All content belongs to their respective publishers.
      </p>
    </div>
  );
}
