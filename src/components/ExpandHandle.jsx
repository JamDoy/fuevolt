export default function ExpandHandle({ expanded, hiddenCount, onClick, theme }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="w-full flex flex-col items-center gap-1.5 cursor-pointer"
      style={{
        background: 'none',
        border: 'none',
        padding: '12px 0 8px',
        minHeight: '44px',
      }}
    >
      <span style={{ width: '40px', height: '4px', borderRadius: '9999px', background: theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#D1D5DB' }} />
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.green}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 300ms ease' }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
      <span className="text-sm sm:text-[13px] font-semibold" style={{ color: theme.green, letterSpacing: '0.01em' }}>
        {expanded ? 'Show less' : `Show ${hiddenCount} more station${hiddenCount === 1 ? '' : 's'}`}
      </span>
    </button>
  );
}
