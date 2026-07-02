import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function SavingsCalculator({ cheapest, average }) {
  const { theme } = useTheme();
  const [kmPerWeek, setKmPerWeek] = useState('300');
  const [consumption, setConsumption] = useState('8'); // L/100km

  if (!cheapest || !average) return null;

  const numKm = Number(kmPerWeek) || 0;
  const numConsumption = Number(consumption) || 0;
  const savingPerLitre = (average - cheapest) / 100;
  const litresPerWeek = (numKm * numConsumption) / 100;
  const weekSaving = savingPerLitre * litresPerWeek;
  const yearSaving = weekSaving * 52;

  return (
    <div
      className="rounded-2xl p-4 mt-4"
      style={{
        background: theme.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(46,204,113,0.08))'
          : 'linear-gradient(135deg, rgba(255,215,0,0.12), rgba(46,204,113,0.12))',
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <h3 className="text-sm font-bold mb-3" style={{ color: theme.gold }}>
        💰 Savings Calculator
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[10px] block mb-1" style={{ color: theme.textMuted }}>
            km/week
          </label>
          <input
            type="number"
            value={kmPerWeek}
            onChange={(e) => setKmPerWeek(e.target.value)}
            className="w-full px-2 py-1 rounded-lg text-xs"
            style={{
              background: theme.inputBg,
              color: theme.text,
              border: `1px solid ${theme.cardBorder}`,
            }}
          />
        </div>
        <div>
          <label className="text-[10px] block mb-1" style={{ color: theme.textMuted }}>
            L/100km
          </label>
          <input
            type="number"
            value={consumption}
            onChange={(e) => setConsumption(e.target.value)}
            step="0.5"
            className="w-full px-2 py-1 rounded-lg text-xs"
            style={{
              background: theme.inputBg,
              color: theme.text,
              border: `1px solid ${theme.cardBorder}`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 rounded-lg" style={{ background: theme.chipBg }}>
          <p className="text-xs" style={{ color: theme.textMuted }}>Weekly Saving</p>
          <p className="text-lg font-bold" style={{ color: theme.green }}>
            ${weekSaving.toFixed(2)}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: theme.chipBg }}>
          <p className="text-xs" style={{ color: theme.textMuted }}>Annual Saving</p>
          <p className="text-lg font-bold" style={{ color: theme.gold }}>
            ${yearSaving.toFixed(0)}
          </p>
        </div>
      </div>

      <p className="text-[10px] mt-2 text-center" style={{ color: theme.textMuted }}>
        Based on filling at cheapest ({(cheapest / 100).toFixed(1)}¢/L) vs average ({(average / 100).toFixed(1)}¢/L)
      </p>
    </div>
  );
}
