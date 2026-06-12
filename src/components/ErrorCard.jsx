export default function ErrorCard({ message, onRetry }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: '#0D2B5E',
        border: '1px solid rgba(255, 100, 100, 0.3)',
        boxShadow: '0 0 20px rgba(255, 100, 100, 0.05) inset',
      }}
    >
      <div className="text-3xl mb-3">😕</div>
      <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-400 mb-4">{message}</p>
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
