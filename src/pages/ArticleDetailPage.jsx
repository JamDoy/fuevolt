import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ArticleAuthorBio from '../components/ArticleAuthorBio';
import LiveFueVoltData from '../components/LiveFueVoltData';
import { injectArticleSchema, removeArticleSchema, updatePageMeta } from '../utils/seo';

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

function formatArticleDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function renderInlineLinks(text, linkColor) {
  const parts = [];
  const linkPattern = /\[([^\]]+)]\((https:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a
        key={`${match[2]}-${match.index}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="underline"
        style={{ color: linkColor }}
      >
        {match[1]}
      </a>
    );
    lastIndex = linkPattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
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
  const [articleState, setArticleState] = useState({ slug: null, article: null });
  const { theme } = useTheme();
  const loading = articleState.slug !== slug;
  const article = loading ? null : articleState.article;

  useEffect(() => {
    let cancelled = false;
    removeArticleSchema();

    fetch(`/content/articles/${slug}.md`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parseFrontmatter(text);
        setArticleState({ slug, article: parsed });
        updatePageMeta('article-detail', {
          title: `${parsed.meta.title} | FueVolt`,
          description: parsed.meta.description,
          url: `https://www.fuevolt.com/guides/${slug}`,
        });
        injectArticleSchema({
          slug,
          title: parsed.meta.title,
          description: parsed.meta.description,
          datePublished: parsed.meta.datePublished,
          dateModified: parsed.meta.dateModified,
        });
      })
      .catch(() => {
        if (!cancelled) setArticleState({ slug, article: null });
      });

    return () => {
      cancelled = true;
      removeArticleSchema();
    };
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

      <div className="text-xs mb-6 space-y-1" style={{ color: theme.textMuted }}>
        <p>By James Doyle{article.meta.readTime ? ` · ${article.meta.readTime}` : ''}</p>
        {formatArticleDate(article.meta.dateModified) && (
          <p>Last updated: {formatArticleDate(article.meta.dateModified)}</p>
        )}
      </div>

      <LiveFueVoltData slug={slug} theme={theme} />

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
              {renderInlineLinks(block.text, theme.accent)}
            </p>
          );
        })}
      </article>

      <ArticleAuthorBio theme={theme} />

      <p className="text-[11px] leading-relaxed mt-4" style={{ color: theme.textMuted }}>
        This guide was written and reviewed by James Doyle for FueVolt. Fuel prices, vehicle specifications and regulations change — always verify current information with your state government or vehicle manufacturer.
      </p>

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
