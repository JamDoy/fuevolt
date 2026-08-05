import { FueVoltIcon } from './FueVoltLogo';

export default function ArticleAuthorBio({ theme }) {
  return (
    <section
      className="mt-8 rounded-xl p-4 flex items-start gap-3"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
      aria-label="About the author"
    >
      <FueVoltIcon size={28} />
      <div>
        <h2 className="text-sm font-bold mb-1" style={{ color: theme.heading }}>About FueVolt</h2>
        <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
          FueVolt is built by a small Australian team focused on making it easy to find the cheapest fuel and nearest EV chargers. We built FueVolt after getting frustrated with not knowing where to find the cheapest fuel, with the aim of helping other Australian drivers save money.
        </p>
      </div>
    </section>
  );
}
