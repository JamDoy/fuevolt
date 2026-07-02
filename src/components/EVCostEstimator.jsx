import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function EVCostEstimator() {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';
  const [batteryStart, setBatteryStart] = useState('20');
  const [batteryEnd, setBatteryEnd] = useState('80');
  const [batterySize, setBatterySize] = useState('60');

  // Avg cost assumptions: 45c/kWh for public, 25c/kWh for home
  const PUBLIC_RATE = 0.45;
  const HOME_RATE = 0.25;

  const numStart = Number(batteryStart) || 0;
  const numEnd = Number(batteryEnd) || 0;
  const numSize = Number(batterySize) || 0;
  const kWhNeeded = ((numEnd - numStart) / 100) * numSize;
  const publicCost = kWhNeeded * PUBLIC_RATE;
  const homeCost = kWhNeeded * HOME_RATE;
  const rangeAdded = Math.round(kWhNeeded * 6.5); // ~6.5km per kWh average

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: theme.cardBg,
        border: `1px solid ${isDark ? 'rgba(46,204,113,0.2)' : 'rgba(39,174,96,0.15)'}`,
      }}
    >
      <h3 className="text-base font-bold mb-4" style={{ color: theme.green }}>
        ⚡ Charge Cost Estimator
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: theme.textSecondary }}>
            Battery size (kWh)
          </label>
          <input
            type="number"
            value={batterySize}
            onChange={(e) => setBatterySize(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.inputText,
            }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: theme.textSecondary }}>
            Charge from (%)
          </label>
          <input
            type="number"
            value={batteryStart}
            onChange={(e) => setBatteryStart(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.inputText,
            }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: theme.textSecondary }}>
            Charge to (%)
          </label>
          <input
            type="number"
            value={batteryEnd}
            onChange={(e) => setBatteryEnd(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{
              background: theme.inputBg,
              border: `1px solid ${theme.inputBorder}`,
              color: theme.inputText,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="p-3 rounded-xl text-center"
          style={{ background: isDark ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.05)' }}
        >
          <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Energy Needed</p>
          <p className="text-lg font-bold" style={{ color: theme.green }}>{kWhNeeded.toFixed(1)} kWh</p>
        </div>
        <div
          className="p-3 rounded-xl text-center"
          style={{ background: isDark ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.05)' }}
        >
          <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Public Cost</p>
          <p className="text-lg font-bold" style={{ color: theme.gold }}>${publicCost.toFixed(2)}</p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>@45¢/kWh</p>
        </div>
        <div
          className="p-3 rounded-xl text-center"
          style={{ background: isDark ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.05)' }}
        >
          <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Home Cost</p>
          <p className="text-lg font-bold" style={{ color: theme.green }}>${homeCost.toFixed(2)}</p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>@25¢/kWh</p>
        </div>
        <div
          className="p-3 rounded-xl text-center"
          style={{ background: isDark ? 'rgba(46,204,113,0.08)' : 'rgba(39,174,96,0.05)' }}
        >
          <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Range Added</p>
          <p className="text-lg font-bold" style={{ color: theme.text }}>~{rangeAdded} km</p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>@6.5km/kWh</p>
        </div>
      </div>

      <p className="text-[10px] mt-3 text-center" style={{ color: theme.textMuted }}>
        Estimates based on average Australian EV charging rates. Actual costs vary by provider and location.
      </p>
    </div>
  );
}
