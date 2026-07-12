import { useTheme } from '../contexts/ThemeContext';

export default function ShimmerCard() {
  const { theme } = useTheme();
  const shimmerClass = theme.mode === 'dark' ? 'shimmer-dark' : 'shimmer-light';

  return (
    <div className="rounded-2xl p-5" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className={`${shimmerClass} h-4 w-3/4 rounded-lg mb-2`} />
          <div className={`${shimmerClass} h-3 w-1/3 rounded-lg mb-5`} />
          <div className={`${shimmerClass} h-6 w-24 rounded-lg`} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`${shimmerClass} h-9 w-28 rounded-lg`} />
          <div className={`${shimmerClass} h-6 w-24 rounded-full`} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 mt-4 pt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
        <div className={`${shimmerClass} h-3 w-40 rounded-lg`} />
        <div className={`${shimmerClass} h-10 w-24 rounded-xl`} />
      </div>
    </div>
  );
}
