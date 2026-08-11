import { useState, useEffect, useId } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  isReminderEnabled,
  getReminderDays,
  daysSinceLastVisit,
  setReminder,
  isDismissedRecently,
  dismissReminder,
  hasReminderPreferenceSet,
  getReturnMessage,
  recordVisit,
  DEFAULT_REMINDER_DAYS,
} from '../utils/fuelReminder';

const DAY_OPTIONS = [
  { label: '1 week', value: '7' },
  { label: '2 weeks', value: '14' },
  { label: '3 weeks', value: '21' },
  { label: '1 month', value: '30' },
  { label: 'Custom', value: 'custom' },
];

function ClockIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </svg>
  );
}

function CheckIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5" />
    </svg>
  );
}

// Sits after the fuel results list, before the ad unit and footer. Never a
// modal — a quiet inline card that only appears once the user has already
// found what they came for.
export default function FuelReminderCard() {
  const { theme } = useTheme();
  const [mode, setMode] = useState(null); // null (hidden) | default | success | active | due
  const [selectedDays, setSelectedDays] = useState('14');
  const [customDays, setCustomDays] = useState('');
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const customInputId = useId();

  useEffect(() => {
    if (isReminderEnabled()) {
      const days = daysSinceLastVisit();
      const target = getReminderDays();
      if (days !== null && days >= target) {
        setMessage(getReturnMessage());
        setMode('due');
      } else {
        setMode('active');
      }
    } else if (hasReminderPreferenceSet() || isDismissedRecently()) {
      setMode(null);
    } else {
      setMode('default');
    }
  }, []);

  useEffect(() => {
    if (mode === null) return undefined;
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  if (mode === null) return null;

  const handleSetReminder = () => {
    const days = selectedDays === 'custom' ? parseInt(customDays, 10) : parseInt(selectedDays, 10);
    if (!Number.isFinite(days) || days <= 0) return;
    setReminder(days);
    setMode('success');
    window.setTimeout(() => setCollapsing(true), 4000);
    window.setTimeout(() => setMode(null), 4400);
  };

  const handleDismiss = () => {
    dismissReminder();
    setCollapsing(true);
    window.setTimeout(() => setMode(null), 300);
  };

  const handleAcknowledgeDue = () => {
    recordVisit();
    setMode('active');
  };

  const handleEdit = () => {
    setSelectedDays(String(getReminderDays() || DEFAULT_REMINDER_DAYS));
    setMode('default');
  };

  const wrapperStyle = {
    maxHeight: collapsing ? '0px' : '240px',
    opacity: collapsing ? 0 : mounted ? 1 : 0,
    overflow: 'hidden',
    transition: 'max-height 0.4s ease, opacity 0.4s ease',
  };

  const cardBase = {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderLeft: `3px solid ${theme.green}`,
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: theme.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.06)',
  };

  // STATE 4 — minimal one-line "already set" card
  if (mode === 'active') {
    return (
      <div style={wrapperStyle} className="mt-4">
        <div style={{ ...cardBase, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span className="text-sm flex items-center gap-2" style={{ color: theme.text }}>
            <ClockIcon color={theme.green} />
            Your fuel reminder is set for every {getReminderDays()} days
          </span>
          <button
            type="button"
            onClick={handleEdit}
            className="text-xs font-semibold cursor-pointer"
            style={{ background: 'none', border: 'none', color: theme.green }}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  // STATE 5 — reminder due, warm inline welcome-back message
  if (mode === 'due') {
    return (
      <div style={wrapperStyle} className="mt-4">
        <div
          className="rounded-xl p-4 flex items-start justify-between gap-3"
          style={{ background: 'rgba(34,197,94,0.08)', borderLeft: `3px solid ${theme.green}` }}
        >
          <p className="text-sm" style={{ color: theme.text }}>
            <span aria-hidden="true">⛽ </span>{message}
          </p>
          <button
            type="button"
            onClick={handleAcknowledgeDue}
            aria-label="Dismiss"
            className="text-lg leading-none cursor-pointer flex-shrink-0"
            style={{ background: 'none', border: 'none', color: theme.textMuted }}
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  // STATE 2 — success confirmation after setting a reminder
  if (mode === 'success') {
    const days = selectedDays === 'custom' ? parseInt(customDays, 10) : parseInt(selectedDays, 10);
    return (
      <div style={wrapperStyle} className="mt-4">
        <div style={cardBase}>
          <div className="flex items-center gap-2">
            <CheckIcon color={theme.green} />
            <p className="text-sm font-semibold" style={{ color: theme.text }}>
              Reminder set! We'll let you know in {days} day{days === 1 ? '' : 's'}.
            </p>
          </div>
          <p className="text-xs mt-1" style={{ color: theme.textMuted, marginLeft: '28px' }}>
            Change or cancel anytime via "Fuel Reminder Settings" in the footer.
          </p>
        </div>
      </div>
    );
  }

  // STATE 1 — default prompt
  const showCustom = selectedDays === 'custom';
  return (
    <div style={wrapperStyle} className="mt-4">
      <div style={cardBase}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5"><ClockIcon color={theme.green} /></div>
            <div>
              <p className="text-sm font-semibold" style={{ color: theme.text }}>
                Get reminded before your next fill-up
              </p>
              <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
                We'll remind you when it's time to check prices again.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <label htmlFor={customInputId} className="text-xs whitespace-nowrap" style={{ color: theme.textSecondary }}>
              Remind me in:
            </label>
            <select
              id={customInputId}
              value={selectedDays}
              onChange={(e) => setSelectedDays(e.target.value)}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
            >
              {DAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {showCustom && (
              <input
                type="number"
                min="1"
                max="365"
                placeholder="days"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className="text-xs rounded-lg px-2 py-1.5 w-16"
                style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
              />
            )}
            <button
              type="button"
              onClick={handleSetReminder}
              disabled={showCustom && !customDays}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: theme.green, color: '#FFFFFF', border: 'none' }}
            >
              Set Reminder &#10003;
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs cursor-pointer whitespace-nowrap"
              style={{ background: 'none', border: 'none', color: theme.textMuted }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
