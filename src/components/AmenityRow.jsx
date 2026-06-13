import { useTheme } from '../contexts/ThemeContext';

export default function AmenityRow({ label, value, correction }) {
  const { theme } = useTheme();

  const displayValue = correction?.value || value;

  let icon, color, text;
  if (displayValue === 'yes') {
    icon = '\u2713';
    color = theme.green;
    text = 'Yes';
  } else if (displayValue === 'no') {
    icon = '\u2717';
    color = '#EF4444';
    text = 'No';
  } else {
    icon = '?';
    color = theme.textMuted;
    text = 'Unknown';
  }

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg"
      style={{
        background: theme.glassBg,
        border: `1px solid ${theme.glassBorder}`,
      }}
    >
      <span className="text-sm" style={{ color: theme.text }}>{label}</span>
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </span>
        <span className="text-xs font-semibold" style={{ color }}>{text}</span>
        {correction?.verified && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(46,204,113,0.15)', color: theme.green }}
          >
            verified
          </span>
        )}
      </div>
    </div>
  );
}
