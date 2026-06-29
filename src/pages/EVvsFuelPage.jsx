import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const VEHICLE_TYPES = [
  { id: 'small', label: 'Small Car', fuelConsumption: 6.5, evConsumption: 13 },
  { id: 'sedan', label: 'Sedan', fuelConsumption: 8, evConsumption: 15 },
  { id: 'suv', label: 'SUV', fuelConsumption: 10.5, evConsumption: 18 },
  { id: 'ute', label: 'Ute / Pickup', fuelConsumption: 12, evConsumption: 22 },
  { id: 'van', label: 'Van', fuelConsumption: 11, evConsumption: 20 },
  { id: 'hatch', label: 'Hatchback', fuelConsumption: 7, evConsumption: 14 },
];

const DEFAULT_FUEL_PRICE = 1.75; // $/L
const DEFAULT_ELECTRICITY_PRICE = 0.30; // $/kWh
const DEFAULT_PUBLIC_CHARGE_PRICE = 0.45; // $/kWh

export default function EVvsFuelPage() {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  const [mode, setMode] = useState('basic');

  // Basic mode
  const [weeklyFuelCost, setWeeklyFuelCost] = useState(65);

  // Advanced mode
  const [kmPerWeek, setKmPerWeek] = useState(300);
  const [vehicleType, setVehicleType] = useState('sedan');
  const [fuelPrice, setFuelPrice] = useState(DEFAULT_FUEL_PRICE);
  const [electricityPrice, setElectricityPrice] = useState(DEFAULT_ELECTRICITY_PRICE);
  const [publicChargePrice, setPublicChargePrice] = useState(DEFAULT_PUBLIC_CHARGE_PRICE);
  const [homeChargePercent, setHomeChargePercent] = useState(80);
  const [fuelType, setFuelType] = useState('petrol');

  const vehicle = VEHICLE_TYPES.find(v => v.id === vehicleType) || VEHICLE_TYPES[1];
  const fuelConsumption = fuelType === 'diesel' ? vehicle.fuelConsumption * 0.85 : vehicle.fuelConsumption;

  // Basic calculation
  const basicEVCost = weeklyFuelCost * 0.4;
  const basicSavingWeekly = weeklyFuelCost - basicEVCost;
  const basicSavingYearly = basicSavingWeekly * 52;

  // Advanced calculation
  const litresPerWeek = (kmPerWeek * fuelConsumption) / 100;
  const advFuelCostWeekly = litresPerWeek * fuelPrice;
  const kwhPerWeek = (kmPerWeek * vehicle.evConsumption) / 100;
  const homeKwh = kwhPerWeek * (homeChargePercent / 100);
  const publicKwh = kwhPerWeek * ((100 - homeChargePercent) / 100);
  const advEVCostWeekly = (homeKwh * electricityPrice) + (publicKwh * publicChargePrice);
  const advSavingWeekly = advFuelCostWeekly - advEVCostWeekly;
  const advSavingYearly = advSavingWeekly * 52;
  const savingPercent = advFuelCostWeekly > 0 ? ((advSavingWeekly / advFuelCostWeekly) * 100).toFixed(0) : 0;

  // CO2 calculation (approx 2.31 kg CO2 per litre petrol)
  const co2SavedWeekly = litresPerWeek * 2.31;
  const co2SavedYearly = co2SavedWeekly * 52;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.text }}>
          <span style={{ color: theme.gold }}>Fuel</span> vs <span style={{ color: theme.green }}>Electric</span> Calculator
        </h1>
        <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
          See how much you could save by switching to an electric vehicle
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setMode('basic')}
          className="px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{
            transition: 'all 0.25s ease',
            border: 'none',
            ...(mode === 'basic'
              ? { background: `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`, color: '#0D2B5E' }
              : { background: theme.chipBg, color: theme.chipText }),
          }}
        >
          Basic Calculator
        </button>
        <button
          onClick={() => setMode('advanced')}
          className="px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{
            transition: 'all 0.25s ease',
            border: 'none',
            ...(mode === 'advanced'
              ? { background: `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`, color: '#FFFFFF' }
              : { background: theme.chipBg, color: theme.chipText }),
          }}
        >
          Advanced Calculator
        </button>
      </div>

      {/* Basic Mode */}
      {mode === 'basic' && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.gold }}>
            Quick Estimate
          </h2>
          <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
            Enter your current average weekly fuel spend and we will estimate your EV running costs.
          </p>

          <label className="text-xs font-semibold block mb-1" style={{ color: theme.textSecondary }}>
            Your weekly fuel cost ($)
          </label>
          <input
            type="number"
            value={weeklyFuelCost}
            onChange={(e) => setWeeklyFuelCost(Math.max(0, Number(e.target.value) || 0))}
            className="w-full px-4 py-3 rounded-xl text-lg font-bold mb-6"
            style={{
              background: theme.inputBg,
              color: theme.text,
              border: `1px solid ${theme.cardBorder}`,
            }}
          />

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ResultCard
              label="Weekly Fuel Cost"
              value={`$${weeklyFuelCost.toFixed(0)}`}
              subtitle="Your current spend"
              color={theme.gold}
              theme={theme}
              isDark={isDark}
              accentColor="gold"
            />
            <ResultCard
              label="Est. EV Cost"
              value={`$${basicEVCost.toFixed(0)}`}
              subtitle="Electric equivalent"
              color={theme.green}
              theme={theme}
              isDark={isDark}
              accentColor="green"
            />
            <ResultCard
              label="Weekly Savings"
              value={`$${basicSavingWeekly.toFixed(0)}`}
              subtitle={`$${basicSavingYearly.toFixed(0)}/year`}
              color={theme.green}
              theme={theme}
              isDark={isDark}
              accentColor="green"
            />
          </div>
        </div>
      )}

      {/* Advanced Mode */}
      {mode === 'advanced' && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: theme.green }}>
            Detailed Comparison
          </h2>

          {/* Vehicle Type */}
          <div className="mb-4">
            <label className="text-xs font-semibold block mb-2" style={{ color: theme.textSecondary }}>
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VEHICLE_TYPES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVehicleType(v.id)}
                  className="px-2 py-2 rounded-xl text-xs font-semibold cursor-pointer text-center"
                  style={{
                    transition: 'all 0.2s ease',
                    border: 'none',
                    ...(vehicleType === v.id
                      ? { background: `linear-gradient(135deg, ${theme.greenDark}, ${theme.green})`, color: '#FFFFFF' }
                      : { background: theme.chipBg, color: theme.chipText }),
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fuel Type */}
          <div className="mb-4">
            <label className="text-xs font-semibold block mb-2" style={{ color: theme.textSecondary }}>
              Fuel Type
            </label>
            <div className="flex gap-2">
              {['petrol', 'diesel'].map((ft) => (
                <button
                  key={ft}
                  onClick={() => setFuelType(ft)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer capitalize"
                  style={{
                    transition: 'all 0.2s ease',
                    border: 'none',
                    ...(fuelType === ft
                      ? { background: `linear-gradient(135deg, ${theme.goldDark}, ${theme.gold})`, color: '#0D2B5E' }
                      : { background: theme.chipBg, color: theme.chipText }),
                  }}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <InputField
              label="km per week"
              value={kmPerWeek}
              onChange={setKmPerWeek}
              theme={theme}
            />
            <InputField
              label="Fuel price ($/L)"
              value={fuelPrice}
              onChange={setFuelPrice}
              step={0.01}
              theme={theme}
            />
            <InputField
              label="Home electricity ($/kWh)"
              value={electricityPrice}
              onChange={setElectricityPrice}
              step={0.01}
              theme={theme}
            />
            <InputField
              label="Public charging ($/kWh)"
              value={publicChargePrice}
              onChange={setPublicChargePrice}
              step={0.01}
              theme={theme}
            />
            <InputField
              label="% charged at home"
              value={homeChargePercent}
              onChange={(v) => setHomeChargePercent(Math.min(100, Math.max(0, v)))}
              theme={theme}
            />
            <div>
              <label className="text-[10px] block mb-1" style={{ color: theme.textMuted }}>
                Fuel consumption
              </label>
              <p className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: theme.chipBg, color: theme.text }}>
                {fuelConsumption.toFixed(1)} L/100km
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: theme.textMuted }}>
                Avg for {vehicle.label}
              </p>
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: isDark ? 'rgba(255,215,0,0.06)' : 'rgba(200,151,31,0.04)',
                border: `1px solid ${isDark ? 'rgba(255,215,0,0.2)' : 'rgba(200,151,31,0.15)'}`,
              }}
            >
              <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Weekly Fuel Cost</p>
              <p className="text-3xl font-bold" style={{ color: theme.gold }}>
                ${advFuelCostWeekly.toFixed(2)}
              </p>
              <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>
                {litresPerWeek.toFixed(1)}L @ ${fuelPrice.toFixed(2)}/L
              </p>
              <p className="text-xs font-semibold mt-2" style={{ color: theme.gold }}>
                ${(advFuelCostWeekly * 52).toFixed(0)}/year
              </p>
            </div>
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: isDark ? 'rgba(46,204,113,0.06)' : 'rgba(39,174,96,0.04)',
                border: `1px solid ${isDark ? 'rgba(46,204,113,0.2)' : 'rgba(39,174,96,0.15)'}`,
              }}
            >
              <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>Weekly EV Cost</p>
              <p className="text-3xl font-bold" style={{ color: theme.green }}>
                ${advEVCostWeekly.toFixed(2)}
              </p>
              <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>
                {kwhPerWeek.toFixed(1)} kWh ({homeChargePercent}% home, {100 - homeChargePercent}% public)
              </p>
              <p className="text-xs font-semibold mt-2" style={{ color: theme.green }}>
                ${(advEVCostWeekly * 52).toFixed(0)}/year
              </p>
            </div>
          </div>

          {/* Savings Summary */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(46,204,113,0.1), rgba(255,215,0,0.05))'
                : 'linear-gradient(135deg, rgba(39,174,96,0.08), rgba(200,151,31,0.04))',
              border: `1px solid ${isDark ? 'rgba(46,204,113,0.25)' : 'rgba(39,174,96,0.2)'}`,
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs" style={{ color: theme.textSecondary }}>Weekly Saving</p>
                <p className="text-2xl font-bold" style={{ color: advSavingWeekly >= 0 ? theme.green : '#e74c3c' }}>
                  ${advSavingWeekly.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: theme.textSecondary }}>Annual Saving</p>
                <p className="text-2xl font-bold" style={{ color: advSavingYearly >= 0 ? theme.green : '#e74c3c' }}>
                  ${advSavingYearly.toFixed(0)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: theme.textSecondary }}>You Save</p>
                <p className="text-2xl font-bold" style={{ color: theme.gold }}>
                  {savingPercent}%
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: theme.textSecondary }}>CO2 Saved/Year</p>
                <p className="text-2xl font-bold" style={{ color: theme.green }}>
                  {co2SavedYearly.toFixed(0)}
                  <span className="text-xs ml-0.5" style={{ color: theme.textSecondary }}>kg</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assumptions & Methodology */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.cardBorder}`,
        }}
      >
        <h3 className="text-sm font-bold mb-3" style={{ color: theme.gold }}>
          About This Calculator
        </h3>
        <div className="space-y-2">
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            This calculator provides <strong>estimates only</strong> and should be used as a general guide.
            Actual costs will vary depending on your specific vehicle, driving habits, electricity tariff,
            charging habits, and fuel prices in your area. Fuel and electricity prices change frequently.
          </p>
          {mode === 'basic' && (
            <p className="text-xs" style={{ color: theme.textMuted }}>
              Basic mode estimates EV costs at approximately 40% of your fuel costs, based on average
              Australian fuel and electricity prices. Use the Advanced calculator for a more tailored result.
            </p>
          )}
          {mode === 'advanced' && (
            <div className="text-xs space-y-1" style={{ color: theme.textMuted }}>
              <p>Fuel consumption figures are Australian averages for each vehicle type. Diesel is estimated at 85% of petrol consumption.</p>
              <p>EV consumption based on average comparable electric vehicles (e.g. Sedan = Tesla Model 3 / BYD Seal class).</p>
              <p>CO2 calculation: 2.31 kg CO2 per litre of petrol burned (Australian Government figure).</p>
              <p>Default electricity price: $0.30/kWh (Australian average household rate). Default public charging: $0.45/kWh.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ label, value, subtitle, color, theme, isDark, accentColor }) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{
        background: isDark
          ? `rgba(${accentColor === 'green' ? '46,204,113' : '255,215,0'},0.06)`
          : `rgba(${accentColor === 'green' ? '39,174,96' : '200,151,31'},0.04)`,
        border: `1px solid ${isDark
          ? `rgba(${accentColor === 'green' ? '46,204,113' : '255,215,0'},0.2)`
          : `rgba(${accentColor === 'green' ? '39,174,96' : '200,151,31'},0.15)`}`,
      }}
    >
      <p className="text-xs mb-1" style={{ color: theme.textSecondary }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>{subtitle}</p>
    </div>
  );
}

function InputField({ label, value, onChange, step = 1, theme }) {
  return (
    <div>
      <label className="text-[10px] block mb-1" style={{ color: theme.textMuted }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        step={step}
        className="w-full px-3 py-2 rounded-xl text-sm"
        style={{
          background: theme.inputBg,
          color: theme.text,
          border: `1px solid ${theme.cardBorder}`,
        }}
      />
    </div>
  );
}
