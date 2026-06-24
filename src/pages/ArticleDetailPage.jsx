import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };
  const meta = {};
  match[1].split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      meta[key] = val;
    }
  });
  return { meta, body: match[2] };
}

function renderMarkdown(md) {
  const blocks = [];
  let key = 0;
  const lines = md.split('\n');
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'p', text: currentParagraph.join('\n'), key: key++ });
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      flushParagraph();
      blocks.push({ type: 'h2', text: line.slice(3), key: key++ });
    } else if (line.startsWith('### ')) {
      flushParagraph();
      blocks.push({ type: 'h3', text: line.slice(4), key: key++ });
    } else if (line.trim() === '') {
      flushParagraph();
    } else {
      currentParagraph.push(line);
    }
  }
  flushParagraph();
  return blocks;
}

export default function ArticleDetailPage({ slug, onBack }) {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    setLoading(true);
    fetch(`/content/articles/${slug}.md`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.text();
      })
      .then((text) => {
        setArticle(parseFrontmatter(text));
        setLoading(false);
      })
      .catch(() => {
        setArticle(null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded w-3/4" style={{ background: theme.shimmerBase }} />
          <div className="h-4 rounded w-1/4" style={{ background: theme.shimmerBase }} />
          <div className="h-4 rounded w-full" style={{ background: theme.shimmerBase }} />
          <div className="h-4 rounded w-full" style={{ background: theme.shimmerBase }} />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p style={{ color: theme.subtext }}>Article not found.</p>
        <button onClick={onBack} className="mt-4 text-sm underline" style={{ color: theme.accent }}>
          Back to articles
        </button>
      </div>
    );
  }

  const blocks = renderMarkdown(article.body);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="text-xs mb-4 flex items-center gap-1 hover:underline"
        style={{ color: theme.accent, background: 'none', border: 'none' }}
      >
        ← Back to articles
      </button>

      {article.meta.category && (
        <span
          className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-3"
          style={{ background: theme.accent + '22', color: theme.accent }}
        >
          {article.meta.category}
        </span>
      )}

      <h1 className="text-xl font-bold mb-2 leading-snug" style={{ color: theme.heading }}>
        {article.meta.title}
      </h1>

      {article.meta.readTime && (
        <p className="text-xs mb-6" style={{ color: theme.textMuted }}>{article.meta.readTime}</p>
      )}

      <article className="space-y-4">
        {blocks.map((block) => {
          if (block.type === 'h2') {
            return (
              <h2 key={block.key} className="text-lg font-semibold mt-6 mb-2" style={{ color: theme.heading }}>
                {block.text}
              </h2>
            );
          }
          if (block.type === 'h3') {
            return (
              <h3 key={block.key} className="text-base font-semibold mt-4 mb-1" style={{ color: theme.heading }}>
                {block.text}
              </h3>
            );
          }
          return (
            <p key={block.key} className="text-sm leading-relaxed" style={{ color: theme.text }}>
              {block.text}
            </p>
          );
        })}
      </article>

      <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${theme.cardBorder}` }}>
        <button
          onClick={onBack}
          className="text-xs hover:underline"
          style={{ color: theme.accent, background: 'none', border: 'none' }}
        >
          ← Back to all articles
        </button>
      </div>
    </div>
  );
}
