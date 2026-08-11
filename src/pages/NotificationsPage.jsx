import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  getNotifications,
  markNotificationRead,
  getNotifPrefs,
  setNotifPrefs,
  getSavedGeofences,
  removeGeofence,
} from '../utils/tomtom';
import {
  isReminderEnabled,
  getReminderDays,
  getLastVisit,
  daysSinceLastVisit,
  setReminder,
  updateReminderDays,
  cancelReminder,
  recordVisit,
  getReminderMethod,
  setReminderMethod,
  getMessageStyle,
  setMessageStyle,
  getAllNotificationsOff,
  setAllNotificationsOff,
  getNotificationPermission,
  requestNotificationPermission,
  DEFAULT_REMINDER_DAYS,
} from '../utils/fuelReminder';

const FREQUENCY_OPTIONS = [
  { label: 'Weekly', value: '7' },
  { label: '2 Weeks', value: '14' },
  { label: '3 Weeks', value: '21' },
  { label: 'Monthly', value: '30' },
  { label: 'Custom', value: 'custom' },
];
const KNOWN_DAYS = FREQUENCY_OPTIONS.map((o) => o.value).filter((v) => v !== 'custom');

function SectionHeader({ title, subtitle, theme }) {
  return (
    <div className="mb-3">
      <h3 className="text-[15px] font-bold" style={{ color: theme.heading }}>{title}</h3>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{subtitle}</p>}
    </div>
  );
}

function Toggle({ on, onChange, disabled, theme, offColor }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onChange}
      className="relative flex-shrink-0"
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: on ? theme.green : (offColor || (theme.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')),
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 200ms ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: on ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 200ms ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

function SettingsRow({ label, sublabel, children, showDivider, greyed, theme }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-3"
      style={{
        minHeight: '52px',
        borderBottom: showDivider ? `1px solid ${theme.divider}` : 'none',
        opacity: greyed ? 0.45 : 1,
        pointerEvents: greyed ? 'none' : 'auto',
        transition: 'opacity 200ms ease',
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: theme.text }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{sublabel}</p>}
      </div>
      <div className="flex-shrink-0 text-right">{children}</div>
    </div>
  );
}

function Pill({ label, active, onClick, theme, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        background: active ? theme.green : theme.chipBg,
        color: active ? '#FFFFFF' : theme.chipText,
        border: active ? 'none' : `1px solid ${theme.chipBorder}`,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 200ms ease',
      }}
    >
      {label}
    </button>
  );
}

export default function NotificationsPage({ onCheckNow }) {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState({ priceDrops: true, chargerAvailability: true, trafficIncidents: false });
  const [geofences, setGeofences] = useState([]);
  const [tab, setTab] = useState('alerts');

  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderDays, setReminderDaysState] = useState(String(DEFAULT_REMINDER_DAYS));
  const [frequencyChoice, setFrequencyChoice] = useState(String(DEFAULT_REMINDER_DAYS));
  const [customDays, setCustomDays] = useState('');
  const [reminderMethod, setReminderMethodState] = useState('inapp');
  const [notifPermission, setNotifPermission] = useState('default');
  const [msgStyle, setMsgStyle] = useState('friendly');
  const [allOff, setAllOffState] = useState(false);
  const [lastVisit, setLastVisitState] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  useEffect(() => {
    setNotifications(getNotifications());
    setPrefs(getNotifPrefs());
    setGeofences(getSavedGeofences());
    refreshReminderState();
  }, []);

  const refreshReminderState = () => {
    setReminderEnabledState(isReminderEnabled());
    const daysStr = String(getReminderDays());
    setReminderDaysState(daysStr);
    if (KNOWN_DAYS.includes(daysStr)) {
      setFrequencyChoice(daysStr);
      setCustomDays('');
    } else {
      setFrequencyChoice('custom');
      setCustomDays(daysStr);
    }
    setReminderMethodState(getReminderMethod());
    setNotifPermission(getNotificationPermission());
    setMsgStyle(getMessageStyle());
    setAllOffState(getAllNotificationsOff());
    setLastVisitState(getLastVisit());
  };

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  };

  const handleRead = (id) => {
    markNotificationRead(id);
    setNotifications(getNotifications());
  };

  const handlePrefChange = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setNotifPrefs(updated);
    showToast('Settings saved ✓');
  };

  const handleRemoveGeofence = (id) => {
    removeGeofence(id);
    setGeofences(getSavedGeofences());
  };

  const handleReminderToggle = () => {
    if (reminderEnabled) {
      cancelReminder();
    } else {
      setReminder(Number(reminderDays) || DEFAULT_REMINDER_DAYS);
    }
    refreshReminderState();
    showToast('Settings saved ✓');
  };

  const handleFrequencyPill = (value) => {
    if (value === 'custom') {
      const initial = customDays || reminderDays || String(DEFAULT_REMINDER_DAYS);
      setFrequencyChoice('custom');
      setCustomDays(initial);
      updateReminderDays(Number(initial));
      setReminderDaysState(String(initial));
    } else {
      setFrequencyChoice(value);
      updateReminderDays(Number(value));
      setReminderDaysState(value);
    }
    showToast('Settings saved ✓');
  };

  const handleCustomDaysChange = (raw) => {
    setCustomDays(raw);
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 90) {
      updateReminderDays(n);
      setReminderDaysState(String(n));
      showToast('Settings saved ✓');
    }
  };

  const stepCustomDays = (delta) => {
    const current = parseInt(customDays, 10) || DEFAULT_REMINDER_DAYS;
    const next = Math.min(90, Math.max(1, current + delta));
    handleCustomDaysChange(String(next));
  };

  const toggleMethod = async (channel) => {
    if (channel === 'push' && notifPermission !== 'granted') {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
      if (perm !== 'granted') return;
    }
    const hasInapp = reminderMethod === 'inapp' || reminderMethod === 'both';
    const hasPush = reminderMethod === 'push' || reminderMethod === 'both';
    let nextInapp = hasInapp;
    let nextPush = hasPush;
    if (channel === 'inapp') nextInapp = !hasInapp;
    if (channel === 'push') nextPush = !hasPush;
    if (!nextInapp && !nextPush) {
      if (channel === 'inapp') nextPush = true; else nextInapp = true;
    }
    const next = nextInapp && nextPush ? 'both' : nextInapp ? 'inapp' : 'push';
    setReminderMethodState(next);
    setReminderMethod(next);
    showToast('Settings saved ✓');
  };

  const handleMessageStyleChange = (value) => {
    setMsgStyle(value);
    setMessageStyle(value);
    showToast('Settings saved ✓');
  };

  const handleResetLastVisit = () => {
    recordVisit();
    setLastVisitState(getLastVisit());
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2000);
    showToast('Settings saved ✓');
  };

  const handleAllOffToggle = () => {
    const next = !allOff;
    setAllOffState(next);
    setAllNotificationsOff(next);
    showToast('Settings saved ✓');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const iconForType = (type) => {
    switch (type) {
      case 'price_drop': return '⛽';
      case 'charger_available': return '⚡';
      case 'traffic': return '⚠';
      case 'geofence': return '📍';
      default: return '🔔';
    }
  };

  const daysSince = daysSinceLastVisit();
  let nextReminderText = 'Not set yet — set your frequency above';
  let nextReminderColor = theme.textMuted;
  if (lastVisit) {
    const target = Number(reminderDays) || DEFAULT_REMINDER_DAYS;
    const remaining = target - (daysSince ?? 0);
    if (remaining <= 0) {
      nextReminderText = 'Overdue — check prices now!';
      nextReminderColor = theme.gold;
    } else {
      const dueDate = new Date(`${lastVisit}T00:00:00`);
      dueDate.setDate(dueDate.getDate() + target);
      nextReminderText = `Due in ${remaining} day${remaining === 1 ? '' : 's'} (on ${dueDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
    }
  }
  const lastVisitText = lastVisit
    ? `${lastVisit} — ${daysSince ?? 0} day${(daysSince ?? 0) === 1 ? '' : 's'} ago`
    : 'Not recorded yet';

  const sectionCardStyle = {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '12px',
  };
  const stepperBtnStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer',
  };
  const deviceDisabled = notifPermission === 'denied' || notifPermission === 'unsupported';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="text-center mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.gold }}>
          Alerts & Notifications
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2">
        {[
          { id: 'alerts', label: `Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { id: 'geofences', label: `Geofences (${geofences.length})` },
          { id: 'settings', label: 'Settings' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
            style={{
              background: tab === t.id
                ? `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`
                : theme.chipBg,
              color: tab === t.id ? '#0D2B5E' : theme.chipText,
              border: 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">{'🔔'}</div>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No alerts yet. Search for fuel or EV stations to start receiving alerts.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleRead(n.id)}
                className="rounded-xl p-4 cursor-pointer"
                style={{
                  background: n.read ? theme.cardBg : (isDark ? 'rgba(245, 158, 11,0.06)' : 'rgba(245,158,11,0.04)'),
                  border: `1px solid ${n.read ? theme.cardBorder : theme.gold}`,
                  opacity: n.read ? 0.7 : 1,
                  transition: 'all 0.25s ease',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{iconForType(n.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: theme.text }}>
                      {n.title}
                      {!n.read && (
                        <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: theme.gold, color: '#0D2B5E' }}>
                          NEW
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>{n.message}</p>
                    <p className="text-[11px] mt-1" style={{ color: theme.textMuted }}>
                      {new Date(n.timestamp).toLocaleString('en-AU')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Geofences Tab */}
      {tab === 'geofences' && (
        <div className="space-y-2">
          {geofences.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">{'📍'}</div>
              <p className="text-sm" style={{ color: theme.textSecondary }}>
                No geofence alerts set. Tap the bell icon on any station to get alerts when you are nearby.
              </p>
            </div>
          ) : (
            geofences.map((f) => (
              <div
                key={f.id}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.text }}>{f.name}</p>
                  <p className="text-xs" style={{ color: theme.textSecondary }}>
                    {f.type === 'ev' ? '⚡ EV Charger' : '⛽ Fuel Station'} — {f.radiusM}m radius
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveGeofence(f.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{
                    background: isDark ? 'rgba(255,100,100,0.1)' : 'rgba(239,68,68,0.06)',
                    color: '#ef4444',
                    border: `1px solid ${isDark ? 'rgba(255,100,100,0.2)' : 'rgba(239,68,68,0.15)'}`,
                  }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div>
          {/* Section 1 — Fuel Price Alerts */}
          <div style={sectionCardStyle}>
            <SectionHeader theme={theme} title="Fuel Price Alerts" subtitle="Get notified when prices drop near you" />
            <SettingsRow theme={theme} label="Price drop alerts" sublabel="Notify me when fuel drops below my average" showDivider={false} greyed={allOff}>
              <Toggle theme={theme} on={prefs.priceDrops} onChange={() => handlePrefChange('priceDrops')} disabled={allOff} />
            </SettingsRow>
          </div>

          {/* Section 2 — Fill-Up Reminder */}
          <div style={sectionCardStyle}>
            <SectionHeader theme={theme} title="Fill-Up Reminder" subtitle="We'll remind you to check prices before your next fill-up" />
            <SettingsRow theme={theme} label="Fill-up reminder" sublabel="Remind me to check fuel prices regularly" showDivider={reminderEnabled} greyed={allOff}>
              <Toggle theme={theme} on={reminderEnabled} onChange={handleReminderToggle} disabled={allOff} />
            </SettingsRow>

            {reminderEnabled && (
              <>
                <div className="py-3" style={{ borderBottom: `1px solid ${theme.divider}`, opacity: allOff ? 0.45 : 1, pointerEvents: allOff ? 'none' : 'auto' }}>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>How often do you fill up?</p>
                  <p className="text-xs mt-0.5 mb-2" style={{ color: theme.textMuted }}>We'll remind you a day before you're due</p>
                  <div className="flex flex-wrap gap-2">
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <Pill key={opt.value} theme={theme} label={opt.label} active={frequencyChoice === opt.value} onClick={() => handleFrequencyPill(opt.value)} />
                    ))}
                  </div>
                  {frequencyChoice === 'custom' && (
                    <div className="flex items-center gap-2 mt-3">
                      <button type="button" aria-label="Decrease days" onClick={() => stepCustomDays(-1)} style={stepperBtnStyle}>&minus;</button>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={customDays}
                        onChange={(e) => handleCustomDaysChange(e.target.value)}
                        className="text-sm rounded-lg px-2 text-center"
                        style={{ width: '64px', height: '44px', background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
                      />
                      <button type="button" aria-label="Increase days" onClick={() => stepCustomDays(1)} style={stepperBtnStyle}>+</button>
                      <span className="text-xs" style={{ color: theme.textMuted }}>days</span>
                    </div>
                  )}
                </div>

                <div className="py-3" style={{ borderBottom: `1px solid ${theme.divider}`, opacity: allOff ? 0.45 : 1, pointerEvents: allOff ? 'none' : 'auto' }}>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>Remind me via</p>
                  <p className="text-xs mt-0.5 mb-2" style={{ color: theme.textMuted }}>How would you like to be reminded?</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Pill theme={theme} label="In-app banner" active={reminderMethod === 'inapp' || reminderMethod === 'both'} onClick={() => toggleMethod('inapp')} />
                    <Pill theme={theme} label="Device notification" active={reminderMethod === 'push' || reminderMethod === 'both'} onClick={() => toggleMethod('push')} disabled={deviceDisabled} />
                  </div>
                  {deviceDisabled && (
                    <p className="text-[11px] mt-1.5" style={{ color: theme.textMuted }}>
                      Enable notifications in your browser settings to use device alerts.
                    </p>
                  )}
                </div>

                <SettingsRow theme={theme} label="Next reminder" showDivider greyed={allOff}>
                  <p className="text-xs font-semibold" style={{ color: nextReminderColor }}>{nextReminderText}</p>
                  <button type="button" onClick={onCheckNow} className="text-xs font-semibold cursor-pointer mt-1" style={{ color: theme.green, background: 'none', border: 'none' }}>
                    Check now &rarr;
                  </button>
                </SettingsRow>

                <SettingsRow theme={theme} label="Last visit recorded" sublabel={lastVisitText} showDivider greyed={allOff}>
                  <button type="button" onClick={handleResetLastVisit} className="text-xs cursor-pointer" style={{ color: theme.textMuted, background: 'none', border: 'none' }}>
                    {resetConfirm ? 'Reset to today ✓' : 'Reset'}
                  </button>
                </SettingsRow>

                <SettingsRow theme={theme} label="Reminder message style" sublabel="What tone would you prefer?" showDivider={false} greyed={allOff}>
                  <select
                    value={msgStyle}
                    onChange={(e) => handleMessageStyleChange(e.target.value)}
                    className="text-xs rounded-lg px-2 py-1.5"
                    style={{ background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.inputText }}
                  >
                    <option value="friendly">Friendly</option>
                    <option value="informative">Informative</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </SettingsRow>

                <div
                  className="mt-3 rounded-lg px-3.5 py-3 flex items-start gap-2"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', opacity: allOff ? 0.45 : 1 }}
                >
                  <span className="text-xs flex-shrink-0" aria-hidden="true">{'ℹ️'}</span>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    All reminder data is stored on your device only. FueVolt never collects or shares this information.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Section 3 — EV Charging Alerts */}
          <div style={sectionCardStyle}>
            <SectionHeader theme={theme} title="EV Charging Alerts" subtitle="Stay updated on charger availability" />
            <SettingsRow theme={theme} label="Charger nearby alerts" sublabel="Alerts when you are near a saved EV charger" showDivider greyed={allOff}>
              <Toggle theme={theme} on={prefs.chargerAvailability} onChange={() => handlePrefChange('chargerAvailability')} disabled={allOff} />
            </SettingsRow>
            <SettingsRow theme={theme} label="Traffic incident alerts" sublabel="Alerts for traffic issues near your saved stations" showDivider={false} greyed={allOff}>
              <Toggle theme={theme} on={prefs.trafficIncidents} onChange={() => handlePrefChange('trafficIncidents')} disabled={allOff} />
            </SettingsRow>
          </div>

          {/* Section 4 — Turn off all notifications */}
          <div style={sectionCardStyle}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold" style={{ color: theme.text }}>Turn off all notifications</p>
                <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Disable every alert and reminder across FueVolt</p>
              </div>
              <Toggle theme={theme} on={!allOff} onChange={handleAllOffToggle} offColor="#9CA3AF" />
            </div>
            {allOff && (
              <div className="mt-3 rounded-lg px-3.5 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  All notifications are paused. Your settings are saved and will resume when you turn notifications back on.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed left-1/2 z-50"
          style={{ bottom: '24px', transform: 'translateX(-50%)', background: '#111827', color: '#fff', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
