import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  getNotifications,
  markNotificationRead,
  getNotifPrefs,
  setNotifPrefs,
  getSavedGeofences,
  removeGeofence,
} from '../utils/tomtom';

export default function NotificationsPage() {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs] = useState({ priceDrops: true, chargerAvailability: true, trafficIncidents: false });
  const [geofences, setGeofences] = useState([]);
  const [tab, setTab] = useState('alerts');

  useEffect(() => {
    setNotifications(getNotifications());
    setPrefs(getNotifPrefs());
    setGeofences(getSavedGeofences());
  }, []);

  const handleRead = (id) => {
    markNotificationRead(id);
    setNotifications(getNotifications());
  };

  const handlePrefChange = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setNotifPrefs(updated);
  };

  const handleRemoveGeofence = (id) => {
    removeGeofence(id);
    setGeofences(getSavedGeofences());
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const iconForType = (type) => {
    switch (type) {
      case 'price_drop': return '\u26FD';
      case 'charger_available': return '\u26A1';
      case 'traffic': return '\u26A0';
      case 'geofence': return '\uD83D\uDCCD';
      default: return '\uD83D\uDD14';
    }
  };

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
              <div className="text-4xl mb-3">{'\uD83D\uDD14'}</div>
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
                  background: n.read ? theme.cardBg : (isDark ? 'rgba(255,215,0,0.06)' : 'rgba(200,151,31,0.04)'),
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
                        <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: theme.gold, color: '#0D2B5E' }}>
                          NEW
                        </span>
                      )}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>
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
              <div className="text-4xl mb-3">{'\uD83D\uDCCD'}</div>
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
                    {f.type === 'ev' ? '\u26A1 EV Charger' : '\u26FD Fuel Station'} — {f.radiusM}m radius
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
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
        >
          <h3 className="text-sm font-bold" style={{ color: theme.text }}>Notification Preferences</h3>
          {[
            { key: 'priceDrops', label: 'Fuel Price Drops', desc: 'Get alerts when nearby fuel prices drop significantly', icon: '\u26FD' },
            { key: 'chargerNearby', label: 'EV Charger Nearby', desc: 'Alerts when you are near a saved EV charger', icon: '\u26A1' },
            { key: 'trafficIncidents', label: 'Traffic Incidents', desc: 'Alerts for traffic issues near your saved stations', icon: '\u26A0' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${theme.divider}` }}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.text }}>{item.label}</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handlePrefChange(item.key)}
                className="w-12 h-6 rounded-full relative cursor-pointer"
                style={{
                  background: prefs[item.key] ? theme.green : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                  border: 'none',
                  transition: 'background 0.25s ease',
                }}
              >
                <div
                  className="w-5 h-5 rounded-full absolute top-0.5"
                  style={{
                    background: '#fff',
                    left: prefs[item.key] ? '26px' : '2px',
                    transition: 'left 0.25s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
