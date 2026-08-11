// Fuel fill-up reminder — entirely localStorage-based, no account or server.

const KEYS = {
  enabled: 'fuevolt_reminder_enabled',
  days: 'fuevolt_reminder_days',
  lastVisit: 'fuevolt_last_visit',
  dismissed: 'fuevolt_reminder_dismissed',
  dismissedDate: 'fuevolt_reminder_dismissed_date',
  lastMessageIndex: 'fuevolt_reminder_last_message',
};

export const DEFAULT_REMINDER_DAYS = 14;
const DISMISS_SNOOZE_DAYS = 7;

function readLS(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable in restricted browser modes.
  }
}

function removeLS(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage may be unavailable in restricted browser modes.
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function hasReminderPreferenceSet() {
  return readLS(KEYS.enabled) !== null;
}

export function isReminderEnabled() {
  return readLS(KEYS.enabled) === 'true';
}

export function getReminderDays() {
  const days = parseInt(readLS(KEYS.days), 10);
  return Number.isFinite(days) && days > 0 ? days : DEFAULT_REMINDER_DAYS;
}

export function getLastVisit() {
  return readLS(KEYS.lastVisit);
}

export function daysSinceLastVisit() {
  const lastVisit = getLastVisit();
  if (!lastVisit) return null;
  const diff = Date.now() - new Date(`${lastVisit}T00:00:00`).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function setReminder(days) {
  writeLS(KEYS.enabled, 'true');
  writeLS(KEYS.days, String(days));
  writeLS(KEYS.lastVisit, todayISO());
  removeLS(KEYS.dismissed);
  removeLS(KEYS.dismissedDate);
}

export function updateReminderDays(days) {
  writeLS(KEYS.days, String(days));
}

export function cancelReminder() {
  writeLS(KEYS.enabled, 'false');
}

// Resets the countdown to "now" — used when a due reminder is acknowledged,
// or simply to record that the user is here looking at fresh prices.
export function recordVisit() {
  writeLS(KEYS.lastVisit, todayISO());
}

export function isDismissedRecently() {
  if (readLS(KEYS.dismissed) !== 'true') return false;
  const dismissedDate = readLS(KEYS.dismissedDate);
  if (!dismissedDate) return false;
  const diffDays = (Date.now() - new Date(`${dismissedDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < DISMISS_SNOOZE_DAYS;
}

export function dismissReminder() {
  writeLS(KEYS.dismissed, 'true');
  writeLS(KEYS.dismissedDate, todayISO());
}

const RETURN_MESSAGES = [
  "Good timing — your fill-up reminder brought you back!",
  "Time to check prices before your next fill-up.",
  "Welcome back! Let's find you the cheapest fuel nearby.",
  "Your fill-up reminder — prices have been moving lately.",
];

export function getReturnMessage() {
  const lastIndex = parseInt(readLS(KEYS.lastMessageIndex), 10);
  let index = Math.floor(Math.random() * RETURN_MESSAGES.length);
  if (RETURN_MESSAGES.length > 1 && index === lastIndex) {
    index = (index + 1) % RETURN_MESSAGES.length;
  }
  writeLS(KEYS.lastMessageIndex, String(index));
  return RETURN_MESSAGES[index];
}
