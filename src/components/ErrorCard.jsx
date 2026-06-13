import { useTheme } from '../contexts/ThemeContext';

export default function ErrorCard({ message, onRetry }) {
  const { theme } = useTheme();

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.errorBorder}`,
        boxShadow: theme.errorGlow,
      }}
    >
      <div className="text-3xl mb-3">&#x1F615;</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text }}>Something went wrong</h3>
      <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #1A6FDB, #0D3A8C)',
            color: '#FFFFFF',
            border: 'none',
            transition: 'all 0.25s ease',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
