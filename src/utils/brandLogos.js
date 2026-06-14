// SVG brand logo colors/identifiers for Australian fuel brands
const BRAND_COLORS = {
  'BP': { bg: '#009B3A', text: '#FFFFFF', short: 'BP' },
  'Shell': { bg: '#FFD500', text: '#DD1D21', short: 'SH' },
  'Caltex': { bg: '#E31937', text: '#FFFFFF', short: 'CX' },
  'Ampol': { bg: '#003DA5', text: '#FFFFFF', short: 'AM' },
  '7-Eleven': { bg: '#F77F00', text: '#00573F', short: '7E' },
  'United': { bg: '#0055A5', text: '#FFFFFF', short: 'UT' },
  'Mobil': { bg: '#0033A0', text: '#FF0000', short: 'MB' },
  'Metro Petroleum': { bg: '#FF6B00', text: '#FFFFFF', short: 'MP' },
  'Costco': { bg: '#E31837', text: '#FFFFFF', short: 'CO' },
  'Liberty': { bg: '#002B5C', text: '#E4002B', short: 'LB' },
  'Puma': { bg: '#FFCC00', text: '#000000', short: 'PM' },
  'Viva Energy': { bg: '#FF6900', text: '#FFFFFF', short: 'VE' },
  'OTR': { bg: '#E30613', text: '#FFFFFF', short: 'OT' },
  'Woolworths': { bg: '#24A044', text: '#FFFFFF', short: 'WW' },
  'Woolworths Petrol': { bg: '#24A044', text: '#FFFFFF', short: 'WW' },
  'Coles Express': { bg: '#E01A22', text: '#FFFFFF', short: 'CE' },
  'Independent': { bg: '#6B7280', text: '#FFFFFF', short: 'IN' },
  'Budget Petrol': { bg: '#FF8C00', text: '#FFFFFF', short: 'BG' },
  'Self-Serve Fuel': { bg: '#4B5563', text: '#FFFFFF', short: 'SS' },
  'EG': { bg: '#1D4ED8', text: '#FFFFFF', short: 'EG' },
};

export function getBrandStyle(brand) {
  if (!brand) return BRAND_COLORS['Independent'];

  // Try exact match first
  if (BRAND_COLORS[brand]) return BRAND_COLORS[brand];

  // Try partial match
  const lowerBrand = brand.toLowerCase();
  for (const [key, value] of Object.entries(BRAND_COLORS)) {
    if (lowerBrand.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerBrand)) {
      return value;
    }
  }

  // Generate a consistent color from brand name
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = brand.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return {
    bg: `hsl(${hue}, 60%, 40%)`,
    text: '#FFFFFF',
    short: brand.slice(0, 2).toUpperCase(),
  };
}

export function formatOpeningHours(hoursStr) {
  if (!hoursStr) return null;

  // Handle common OSM opening_hours formats
  if (hoursStr === '24/7') return { display: 'Open 24/7', isOpen: true };

  try {
    const now = new Date();
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const today = dayNames[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Parse simple formats like "Mo-Fr 06:00-22:00; Sa-Su 07:00-21:00"
    const rules = hoursStr.split(';').map(r => r.trim());
    let todayHours = null;

    for (const rule of rules) {
      const match = rule.match(/^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
      if (!match) continue;

      const [, days, open, close] = match;
      if (isDayInRange(today, days)) {
        const openMin = parseTime(open);
        const closeMin = parseTime(close);
        const isOpen = currentTime >= openMin && currentTime <= closeMin;
        todayHours = { display: `${open} – ${close}`, isOpen };
        break;
      }
    }

    if (todayHours) return todayHours;

    // If we couldn't parse it, just show the raw string
    return { display: hoursStr, isOpen: null };
  } catch {
    return { display: hoursStr, isOpen: null };
  }
}

function isDayInRange(today, daysStr) {
  const dayOrder = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const ranges = daysStr.split(',');

  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      const startIdx = dayOrder.indexOf(start.trim());
      const endIdx = dayOrder.indexOf(end.trim());
      const todayIdx = dayOrder.indexOf(today);
      if (startIdx <= endIdx) {
        if (todayIdx >= startIdx && todayIdx <= endIdx) return true;
      } else {
        if (todayIdx >= startIdx || todayIdx <= endIdx) return true;
      }
    } else {
      if (range.trim() === today) return true;
    }
  }
  return false;
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
