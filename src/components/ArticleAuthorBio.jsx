export default function ArticleAuthorBio({ theme }) {
  return (
    <section
      className="mt-8 rounded-xl p-4 flex items-start gap-3"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      aria-label="About the author"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0"
        style={{ background: theme.accent, color: '#0D2B5E' }}
        aria-label="James Doyle avatar placeholder"
      >
        JD
      </div>
      <div>
        <h2 className="text-sm font-bold mb-1" style={{ color: theme.heading }}>About James Doyle</h2>
        <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
          James Doyle is a Brisbane-based driver and the founder of FueVolt. He built FueVolt after getting frustrated with not knowing where to find the cheapest fuel, with the aim of helping other Australian drivers save money.
        </p>
      </div>
    </section>
  );
}
