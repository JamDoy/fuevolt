import { useTheme } from '../contexts/ThemeContext';

const DATA_SOURCES = [
  { label: 'NSW Government FuelCheck', href: 'https://www.fuelcheck.nsw.gov.au/' },
  { label: 'Queensland Government fuel price reporting', href: 'https://www.treasury.qld.gov.au/policies-and-programs/fuel-in-queensland/' },
  { label: 'Service Victoria Servo Saver', href: 'https://service.vic.gov.au/fuel' },
  { label: 'Western Australia FuelWatch', href: 'https://fuelwatch.wa.gov.au/' },
];

export default function AboutPage({ onContact }) {
  const { theme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: theme.text }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: theme.heading }}>About FueVolt</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>Why FueVolt Exists</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          FueVolt was started in 2026 by James Doyle, a Brisbane-based driver who was frustrated by not knowing which nearby servo had the cheapest fuel. Checking several sources before every fill was inconvenient, so he built one place where Australian drivers could compare reported prices, find EV chargers and plan a trip.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          The aim is practical: make transport costs easier to understand without favouring a fuel retailer or charging network. FueVolt remains independently operated and is supported by advertising revenue.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>What FueVolt Does</h2>
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: theme.gold }}>Government-Reported Fuel Prices</h3>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              FueVolt retrieves petrol, diesel and LPG price reports from official state sources. The site shows when government data was checked separately from when a retailer last reported a price change. Prices can change, so drivers should still confirm the bowser price before filling.
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: theme.green }}>EV Charging Station Finder</h3>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              Drivers can find EV charging locations across Australia and filter by connector type and charging speed. Charger records describe locations and equipment; FueVolt does not claim real-time bay availability.
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: theme.text }}>Planning and Comparison Tools</h3>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              The trip planner and EV-versus-fuel calculator provide estimates based on the details a driver enters. They are planning aids, not guarantees of range, cost or charger operation.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>Why Drivers Can Check the Data</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          FueVolt links its coverage to the original public authorities so drivers can review the source and reporting rules themselves. Current fuel-price coverage includes New South Wales, Victoria, Queensland and Western Australia.
        </p>
        <ul className="space-y-2 text-sm">
          {DATA_SOURCES.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer" className="underline" style={{ color: theme.accent }}>
                {source.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed mt-3" style={{ color: theme.textMuted }}>
          Fuel retailers supply the underlying price reports under each state’s rules. FueVolt does not alter a source-reported price or invent a newer update time.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>Contact James</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          Have feedback, a correction or a question about FueVolt? Send it through the contact form.
        </p>
        <button
          onClick={onContact}
          className="px-4 py-2 rounded-lg font-semibold"
          style={{ background: theme.gold, color: '#0D2B5E', border: 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          Send Feedback
        </button>
      </section>
    </div>
  );
}
