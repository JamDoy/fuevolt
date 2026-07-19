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

function formatCheckedLabel(dataCheckedAt, now) {
  const checked = dataCheckedAt ? new Date(dataCheckedAt) : null;
  if (!checked || Number.isNaN(checked.getTime())) return null;

  const ageMinutes = Math.floor(Math.max(0, now.getTime() - checked.getTime()) / 60000);
  if (ageMinutes < 1) return 'Government data checked just now';
  if (ageMinutes < 60) {
    return `Government data checked ${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`;
  }
  if (isSameDay(checked, now)) return `Government data checked today at ${formatTime(checked)}`;
  return `Government data checked ${formatDate(checked)} at ${formatTime(checked)}`;
}

export function getPriceFreshness(lastUpdated, priceDate, dataCheckedAt) {
  const parsed = lastUpdated ? new Date(lastUpdated) : null;
  const checked = dataCheckedAt ? new Date(dataCheckedAt) : null;
  const validTimestamp = parsed && !Number.isNaN(parsed.getTime());
  const validCheckedTimestamp = checked && !Number.isNaN(checked.getTime());
  const now = new Date();
  const checkedLabel = formatCheckedLabel(dataCheckedAt, now);
  const isOutdated = validCheckedTimestamp
    ? now.getTime() - checked.getTime() > OUTDATED_THRESHOLD_MS
    : false;

  if (!validTimestamp) {
    if (priceDate) {
      return { label: `Price applies ${priceDate}; report time unavailable`, checkedLabel, isOutdated };
    }
    return { label: 'Price report time unavailable', checkedLabel, isOutdated };
  }

  const ageMs = Math.max(0, now.getTime() - parsed.getTime());
  const ageMinutes = Math.floor(ageMs / 60000);
  let label;

  if (ageMinutes < 1) {
    label = 'Price change reported just now';
  } else if (ageMinutes < 60) {
    label = `Price change reported ${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`;
  } else if (isSameDay(parsed, now)) {
    label = `Price change reported today at ${formatTime(parsed)}`;
  } else {
    label = `Last price change reported ${formatDate(parsed)} at ${formatTime(parsed)}`;
  }

  return { label, checkedLabel, isOutdated };
}

export function getPriceContext(price, averagePrice) {
  if (!Number.isFinite(price) || !Number.isFinite(averagePrice) || averagePrice <= 0) return null;
  const difference = price - averagePrice;
  if (Math.abs(difference) <= PRICE_CONTEXT_TOLERANCE) return 'about';
  return difference < 0 ? 'below' : 'above';
}
