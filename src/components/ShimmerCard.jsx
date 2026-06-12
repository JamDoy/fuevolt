export default function ShimmerCard() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: '#0D2B5E',
        border: '1px solid rgba(255,215,0,0.15)',
      }}
    >
      <div className="shimmer h-5 w-3/4 rounded-lg mb-3" />
      <div className="shimmer h-4 w-full rounded-lg mb-2" />
      <div className="shimmer h-4 w-2/3 rounded-lg mb-3" />
      <div className="flex gap-2">
        <div className="shimmer h-6 w-16 rounded-full" />
        <div className="shimmer h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}
