import { useTheme } from '../contexts/ThemeContext';

export default function TermsPage() {
  const { theme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: theme.text }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: theme.heading }}>Terms of Service</h1>
      <p className="text-sm mb-4" style={{ color: theme.subtext }}>Last updated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <Section title="1. Acceptance of Terms" theme={theme}>
        <p>By downloading, installing, or using the FueVolt application ("the app"), you agree to be bound by these Terms of Service. If you do not agree, do not use the app.</p>
      </Section>

      <Section title="2. Service Description" theme={theme}>
        <p>FueVolt is a fuel price comparison and EV charging station finder for Australia. The app aggregates publicly available data from government fuel price APIs, OpenStreetMap, and Open Charge Map to help users find and compare fuel prices and EV charging stations near them.</p>
        <p className="mt-2">Key features include:</p>
        <ul className="list-disc pl-6 mt-1 space-y-1">
          <li>Real-time fuel price comparison from official government sources</li>
          <li>EV charging station finder with connector type and speed filters</li>
          <li>EV charge cost estimator (estimates based on average Australian rates)</li>
          <li>Fuel vs EV weekly cost comparison</li>
          <li>Favourite stations (saved locally on your device)</li>
          <li>Community correction system for station information</li>
        </ul>
      </Section>

      <Section title="3. Data Accuracy & Disclaimer" theme={theme}>
        <p><strong>Fuel prices</strong> are sourced from official Australian state and territory government APIs where available, including:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>New South Wales — NSW Government Motor API (api.nsw.gov.au)</li>
          <li>Western Australia — FuelWatch (fuelwatch.wa.gov.au)</li>
        </ul>
        <p className="mt-2"><strong>Station locations and details</strong> are sourced from OpenStreetMap (openstreetmap.org), a collaborative mapping project maintained by volunteers worldwide.</p>
        <p className="mt-2"><strong>EV charging station data</strong> is sourced from Open Charge Map (openchargemap.org), an open-source registry of charging infrastructure.</p>
        <p className="mt-2"><strong>EV charging cost estimates</strong> provided by the app's cost estimator are approximate calculations based on average Australian electricity rates (45¢/kWh for public charging, 25¢/kWh for home charging). Actual costs vary significantly by provider, time of day, location, and individual electricity plans. These estimates should not be relied upon for financial planning.</p>
        <p className="mt-2 font-semibold">Important:</p>
        <ul className="list-disc pl-6 mt-1 space-y-1">
          <li>Prices may not reflect the current pump price at the time of your visit. Prices are updated periodically and may be delayed.</li>
          <li>Station details (opening hours, amenities, contact information) are sourced from third-party databases and may be incomplete or outdated.</li>
          <li>FueVolt does not guarantee the accuracy, completeness, or timeliness of any information displayed.</li>
          <li>Always verify prices and availability at the station before making purchasing decisions.</li>
          <li>Where government data is unavailable, prices may be clearly labelled as estimates — these should not be relied upon for purchasing decisions.</li>
        </ul>
      </Section>

      <Section title="4. Community Corrections" theme={theme}>
        <p>Users may submit corrections to station information. These corrections are subject to the following rules:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Corrections are only applied to the live display after at least 3 independent users submit the same correction</li>
          <li>Each user may only submit one correction per field per station</li>
          <li>Corrections are submitted anonymously</li>
          <li>We reserve the right to remove or reject any correction at our discretion</li>
          <li>Community-verified information is clearly labelled and should still be independently verified where critical</li>
        </ul>
      </Section>

      <Section title="5. Acceptable Use" theme={theme}>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Use the app for any unlawful purpose</li>
          <li>Submit false or misleading corrections</li>
          <li>Attempt to manipulate the correction system through multiple submissions</li>
          <li>Reverse-engineer, decompile, or disassemble the app</li>
          <li>Use automated tools to scrape data from the app</li>
          <li>Interfere with or disrupt the app's functionality</li>
        </ul>
      </Section>

      <Section title="6. Intellectual Property" theme={theme}>
        <p>The FueVolt name, logo, design, and original code are owned by FueVolt. Third-party data (fuel prices, maps, station information) remains the property of their respective sources and is used under their applicable licenses:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>OpenStreetMap data — Open Database License (ODbL)</li>
          <li>Open Charge Map data — Creative Commons Attribution-ShareAlike 4.0</li>
          <li>Government fuel price data — used under public access terms of the respective state/territory APIs</li>
        </ul>
      </Section>

      <Section title="7. Advertising" theme={theme}>
        <p>The app displays advertisements served by Google AdMob. Ad content is determined by Google and is not controlled by FueVolt. We are not responsible for the content of third-party advertisements.</p>
      </Section>

      <Section title="8. Limitation of Liability" theme={theme}>
        <p>To the maximum extent permitted by Australian law:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>FueVolt is provided "as is" without warranties of any kind</li>
          <li>We are not liable for any loss or damage arising from your use of the app or reliance on information displayed</li>
          <li>We are not responsible for decisions made based on fuel price or station information shown in the app</li>
          <li>Our total liability to you shall not exceed AUD $10</li>
        </ul>
      </Section>

      <Section title="9. Modifications" theme={theme}>
        <p>We reserve the right to modify these Terms at any time. Changes take effect immediately upon posting. Your continued use of the app after changes constitutes acceptance of the modified Terms.</p>
      </Section>

      <Section title="10. Governing Law" theme={theme}>
        <p>These Terms are governed by the laws of Australia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Australia.</p>
      </Section>

      <Section title="11. Contact" theme={theme}>
        <p>For questions about these Terms, contact us at:</p>
        <p className="mt-1"><strong>Email:</strong> support@fuevolt.com</p>
      </Section>
    </div>
  );
}

function Section({ title, theme, children }) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold mb-2" style={{ color: theme.heading }}>{title}</h3>
      <div className="text-sm leading-relaxed space-y-1" style={{ color: theme.text }}>
        {children}
      </div>
    </section>
  );
}
