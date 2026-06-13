import { useTheme } from '../contexts/ThemeContext';

export default function ShimmerCard() {
  const { theme } = useTheme();
  const shimmerClass = theme.mode === 'dark' ? 'shimmer-dark' : 'shimmer-light';

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
      }}
    >
      <div className={`${shimmerClass} h-5 w-3/4 rounded-lg mb-3`} />
      <div className={`${shimmerClass} h-4 w-full rounded-lg mb-2`} />
      <div className={`${shimmerClass} h-4 w-2/3 rounded-lg mb-3`} />
      <div className="flex gap-2">
        <div className={`${shimmerClass} h-6 w-16 rounded-full`} />
        <div className={`${shimmerClass} h-6 w-20 rounded-full`} />
      </div>
    </div>
  );
}
