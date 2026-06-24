const RSS_FEEDS = [
  { name: 'The Driven', url: 'https://thedriven.io/feed/', icon: '⚡' },
  { name: 'CarExpert', url: 'https://www.carexpert.com.au/feed', icon: '🚗' },
  { name: 'Drive.com.au', url: 'https://www.drive.com.au/feed/', icon: '🏎️' },
];

const RSS_CACHE_KEY = 'fuevolt_rss_cache';
const RSS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function getCachedNews() {
  try {
    const raw = localStorage.getItem(RSS_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > RSS_CACHE_TTL) {
      localStorage.removeItem(RSS_CACHE_KEY);
      return null;
    }
    return cached.items;
  } catch {
    return null;
  }
}

function setCachedNews(items) {
  try {
    localStorage.setItem(RSS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), items }));
  } catch {
    // localStorage full — ignore
  }
}

function parseRSSXML(xmlText, sourceName, sourceIcon) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const items = doc.querySelectorAll('item');
  const results = [];

  items.forEach((item) => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
    const description = item.querySelector('description')?.textContent?.trim() || '';

    // Extract thumbnail from media:content or enclosure
    let thumbnail = '';
    const mediaContent = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'content');
    if (mediaContent.length > 0) {
      thumbnail = mediaContent[0].getAttribute('url') || '';
    }
    if (!thumbnail) {
      const enclosure = item.querySelector('enclosure');
      if (enclosure?.getAttribute('type')?.startsWith('image')) {
        thumbnail = enclosure.getAttribute('url') || '';
      }
    }
    // Try to extract image from description HTML
    if (!thumbnail && description) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/);
      if (imgMatch) thumbnail = imgMatch[1];
    }

    // Clean description: strip HTML and limit length
    const cleanDesc = description
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150);

    if (title && link) {
      results.push({
        title,
        link,
        pubDate: pubDate ? new Date(pubDate).toISOString() : '',
        description: cleanDesc,
        thumbnail,
        source: sourceName,
        sourceIcon,
      });
    }
  });

  return results.slice(0, 5); // Max 5 per source
}

// Use a public CORS proxy for RSS feeds
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithCORS(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) });
      if (res.ok) return await res.text();
    } catch {
      continue;
    }
  }
  // Try direct (works in Capacitor/Android)
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return await res.text();
  } catch {
    // ignore
  }
  return null;
}

export async function fetchLatestNews() {
  // Check cache first
  const cached = getCachedNews();
  if (cached) return cached;

  const allItems = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const xml = await fetchWithCORS(feed.url);
      if (!xml) return [];
      return parseRSSXML(xml, feed.name, feed.icon);
    })
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      allItems.push(...result.value);
    }
  });

  // Sort by date (newest first)
  allItems.sort((a, b) => {
    if (!a.pubDate || !b.pubDate) return 0;
    return new Date(b.pubDate) - new Date(a.pubDate);
  });

  if (allItems.length > 0) {
    setCachedNews(allItems);
  }

  return allItems;
}

export function formatNewsDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now - d;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
