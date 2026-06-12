export default function StatusBadge({ status }) {
  const statusConfig = {
    'Operational': { bg: 'linear-gradient(135deg, #2ECC71, #27AE60)', color: '#FFF', label: 'Available' },
    'Available': { bg: 'linear-gradient(135deg, #2ECC71, #27AE60)', color: '#FFF', label: 'Available' },
    'In Use': { bg: 'linear-gradient(135deg, #C8971F, #FFD700)', color: '#0D2B5E', label: 'Busy' },
    'Busy': { bg: 'linear-gradient(135deg, #C8971F, #FFD700)', color: '#0D2B5E', label: 'Busy' },
    'Unknown': { bg: '#4B5563', color: '#9CA3AF', label: 'Unknown' },
    'Not Operational': { bg: '#374151', color: '#6B7280', label: 'Offline' },
    'Offline': { bg: '#374151', color: '#6B7280', label: 'Offline' },
  };

  const config = statusConfig[status] || statusConfig['Unknown'];

  return (
    <span
      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
