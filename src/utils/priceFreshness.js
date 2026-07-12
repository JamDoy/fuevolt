const OUTDATED_THRESHOLD_MS = 2 * 60 * 60 * 1000;
export const PRICE_CONTEXT_TOLERANCE = 0.015;

function formatTime(date) {
  return new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(/\s/g, '').toLowerCase();
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function getPriceFreshness(lastUpdated, priceDate) {
  const parsed = lastUpdated ? new Date(lastUpdated) : null;
  const validTimestamp = parsed && !Number.isNaN(parsed.getTime());

  if (!validTimestamp) {
    if (priceDate) {
      return { label: `Price dated ${priceDate}; update time not provided`, isOutdated: false };
    }
    return { label: 'Price update time unavailable', isOutdated: false };
  }

  const now = new Date();
  const ageMs = Math.max(0, now.getTime() - parsed.getTime());
  const ageMinutes = Math.floor(ageMs / 60000);
  let label;

  if (ageMinutes < 1) {
    label = 'Updated just now';
  } else if (ageMinutes < 60) {
    label = `Updated ${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`;
  } else if (isSameDay(parsed, now)) {
    label = `Updated today at ${formatTime(parsed)}`;
  } else {
    label = `Updated ${formatDate(parsed)} at ${formatTime(parsed)}`;
  }

  return {
    label,
    isOutdated: ageMs > OUTDATED_THRESHOLD_MS,
  };
}

export function getPriceContext(price, averagePrice) {
  if (!Number.isFinite(price) || !Number.isFinite(averagePrice) || averagePrice <= 0) return null;
  const difference = price - averagePrice;
  if (Math.abs(difference) <= PRICE_CONTEXT_TOLERANCE) return 'about';
  return difference < 0 ? 'below' : 'above';
}
