import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  isReminderEnabled,
  getReminderDays,
  daysSinceLastVisit,
  getLastVisit,
  setReminder,
  cancelReminder,
  DEFAULT_REMINDER_DAYS,
} from '../utils/fuelReminder';

const DAY_OPTIONS = [
  { label: '1 week', value: '7' },
  { label: '2 weeks', value: '14' },
  { label: '3 weeks', value: '21' },
  { label: '1 month', value: '30' },
];

export default function FuelReminderSettings({ innerRef }) {
  const { theme } = useTheme();
  const [enabled, setEnabled] = useState(() => isReminderEnabled());
  const [days, setDays] = useState(() => String(getReminderDays() || DEFAULT_REMINDER_DAYS));
  const [saved, setSaved] = useState(false);

  const lastVisit = getLastVisit();
  const daysSince = daysSinceLastVisit();
  const remaining = daysSince === null ? null : Math.max(0, Number(days) - daysSince);

  const handleSave = () => {
    if (enabled) {
      setReminder(Number(days));
    } else {
      cancelReminder();
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    cancelReminder();
    setEnabled(false);
    setSaved(false);
  };

  return (
    <section
      ref={innerRef}
      id="fuel-reminder-settings"
      className="max-w-md mx-auto mt-8 rounded-2xl p-5"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      aria-label="Fuel reminder settings"
    >
      <h2 className="text-base font-bold mb-4" style={{ color: theme.heading }}>Your Fuel Reminder</h2>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: theme.text }}>Reminders</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((e) => !e)}
          className="relative cursor-pointer"
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: enabled ? theme.green : theme.chipBg,
            border: `1px solid ${enabled ? theme.green : theme.chipBorder}`,
            transition: 'background 0.2s ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: enabled ? '22px' : '2px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#FFFFFF',
              transition: 'left 0.2s ease',
            }}
          />
        </button>
      </div>

      {enabled && (
        <div className="mb-4">
          <label htmlFor="reminder-frequency" className="text-xs block mb-1" style={{ color: theme.textSecondary }}>
            Frequency
          </label>
          <select
            id="reminder-frequency"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 w-full"
            style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
          >
            {DAY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="text-xs space-y-1 mb-4" style={{ color: theme.textMuted }}>
        {enabled && remaining !== null && <p>Next reminder: in {remaining} day{remaining === 1 ? '' : 's'}</p>}
        {lastVisit && <p>Last visit recorded: {lastVisit}</p>}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
          style={{ background: theme.green, color: '#FFFFFF', border: 'none' }}
        >
          {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="text-xs cursor-pointer"
          style={{ background: 'none', border: 'none', color: '#EF4444' }}
        >
          Cancel reminder
        </button>
      </div>
    </section>
  );
}
