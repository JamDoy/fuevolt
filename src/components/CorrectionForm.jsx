import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const FIELDS = [
  { id: 'price_E10', label: 'E10 Price (cents/L)' },
  { id: 'price_U91', label: 'Unleaded 91 Price (cents/L)' },
  { id: 'price_U95', label: 'Premium 95 Price (cents/L)' },
  { id: 'price_U98', label: 'Premium 98 Price (cents/L)' },
  { id: 'price_Diesel', label: 'Diesel Price (cents/L)' },
  { id: 'price_LPG', label: 'LPG Price (cents/L)' },
  { id: 'opening_hours', label: 'Opening Hours' },
  { id: 'phone', label: 'Phone Number' },
  { id: 'address', label: 'Address' },
  { id: 'amenity_toilets', label: 'Toilets (yes/no)' },
  { id: 'amenity_car_wash', label: 'Car Wash (yes/no)' },
  { id: 'amenity_air_pump', label: 'Air Pump / Tyre Pressure (yes/no)' },
  { id: 'amenity_shop', label: 'Convenience Store (yes/no)' },
  { id: 'amenity_atm', label: 'ATM (yes/no)' },
  { id: 'amenity_ev_charging', label: 'EV Charging (yes/no)' },
  { id: 'amenity_wheelchair', label: 'Disability Access (yes/no)' },
];

function getUserHash() {
  let hash = localStorage.getItem('fuevolt_user_hash');
  if (!hash) {
    hash = 'u_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
    localStorage.setItem('fuevolt_user_hash', hash);
  }
  return hash;
}

export default function CorrectionForm({ station, onClose, onSubmitted }) {
  const { theme } = useTheme();
  const [selectedField, setSelectedField] = useState('');
  const [correctedValue, setCorrectedValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedField || !correctedValue.trim()) {
      setError('Please select a field and provide a correction.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const userHash = getUserHash();
      const body = {
        station_id: station.id,
        station_name: station.name,
        field_name: selectedField,
        corrected_value: correctedValue.trim(),
        user_hash: userHash,
      };

      const res = await fetch('/api/corrections.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit correction');
      }

      const data = await res.json();
      setSuccess(true);

      if (onSubmitted && data.correction) {
        onSubmitted(data.correction);
      }
    } catch (err) {
      setError(err.message || 'Unable to submit correction. The correction system may not be set up yet.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">&#10003;</div>
        <h3 className="text-lg font-bold mb-2" style={{ color: theme.green }}>Thank you!</h3>
        <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
          Your correction has been submitted. It will appear on the page once 3 users confirm the same information.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{
            background: theme.chipBg,
            color: theme.text,
            border: `1px solid ${theme.chipBorder}`,
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: theme.gold }}>
          Suggest a Correction
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-lg cursor-pointer"
          style={{ color: theme.textMuted, background: 'none', border: 'none' }}
        >
          &times;
        </button>
      </div>

      <p className="text-xs" style={{ color: theme.textSecondary }}>
        Help keep FueVolt accurate. Your correction will be applied once 3 users confirm the same information.
      </p>

      <div>
        <label className="text-xs font-semibold block mb-1" style={{ color: theme.textSecondary }}>
          What needs correcting?
        </label>
        <select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: theme.inputBg,
            color: theme.inputText,
            border: `1px solid ${theme.inputBorder}`,
            outline: 'none',
          }}
        >
          <option value="">Select a field...</option>
          {FIELDS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold block mb-1" style={{ color: theme.textSecondary }}>
          Correct value
        </label>
        <input
          type="text"
          value={correctedValue}
          onChange={(e) => setCorrectedValue(e.target.value)}
          placeholder={selectedField?.startsWith('price_') ? 'e.g. 175.9' : 'Enter the correct information...'}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: theme.inputBg,
            color: theme.inputText,
            border: `1px solid ${theme.inputBorder}`,
            outline: 'none',
          }}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer"
        style={{
          background: submitting ? theme.chipBg : `linear-gradient(135deg, #C8971F, #FFD700)`,
          color: submitting ? theme.textMuted : '#0D2B5E',
          border: 'none',
          opacity: submitting ? 0.6 : 1,
          transition: 'all 0.25s ease',
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Correction'}
      </button>
    </form>
  );
}
