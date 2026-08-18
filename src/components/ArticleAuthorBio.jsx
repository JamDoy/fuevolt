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
          FueVolt compares official government fuel prices and EV charging locations across Australia, so finding the cheapest option takes one search instead of several.
        </p>
      </div>
    </section>
  );
}
