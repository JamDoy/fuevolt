import { useTheme } from '../contexts/ThemeContext';

export default function PrivacyPolicyPage() {
  const { theme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: theme.text }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: theme.heading }}>Privacy Policy</h1>
      <p className="text-sm mb-4" style={{ color: theme.subtext }}>Last updated: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      <Section title="1. Overview" theme={theme}>
        <p>FueVolt ("we", "our", "the app") is an Australian fuel price comparison and EV charging station finder. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application and website.</p>
      </Section>

      <Section title="2. Information We Collect" theme={theme}>
        <h4 className="font-semibold mt-3 mb-1">Location Data</h4>
        <p>When you use "Use My Location" or GPS-based features, we access your device's location to find nearby fuel stations and EV chargers. This data is processed locally on your device and is not stored on our servers.</p>

        <h4 className="font-semibold mt-3 mb-1">Favourites & Preferences</h4>
        <p>When you save fuel stations or EV chargers as favourites, or use the EV charge cost estimator, this data is stored locally on your device using localStorage. It is never transmitted to any server.</p>

        <h4 className="font-semibold mt-3 mb-1">Usage Data</h4>
        <p>We may collect anonymous usage statistics such as pages viewed, search queries, and app interactions to improve our service. This data cannot be used to personally identify you.</p>

        <h4 className="font-semibold mt-3 mb-1">Advertising Data</h4>
        <p>We use Google AdMob to display advertisements. AdMob may collect device identifiers, IP addresses, and usage data to serve relevant ads. Please refer to <a href="https://policies.google.com/privacy" className="underline" style={{ color: theme.accent }}>Google's Privacy Policy</a> for details on their data practices.</p>


      </Section>

      <Section title="3. Data Sources" theme={theme}>
        <p>FueVolt aggregates publicly available data from the following sources:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li><strong>NSW Government</strong> — Fuel prices via the NSW Motor API (api.nsw.gov.au)</li>
          <li><strong>QLD Government</strong> — Fuel prices via the QLD Fuel Pricing Direct API (fuelpricesqld.com.au)</li>
          <li><strong>WA Government</strong> — Fuel prices via FuelWatch (fuelwatch.wa.gov.au)</li>
          <li><strong>OpenStreetMap</strong> — Station locations, names, addresses, and opening hours via the Overpass API</li>
          <li><strong>Open Charge Map</strong> — EV charging station locations and details (openchargemap.org)</li>
          <li><strong>Nominatim (OpenStreetMap)</strong> — Reverse geocoding for address resolution</li>
          <li><strong>TomTom</strong> — Map display tiles, geocoding, routing, traffic data, and EV charger availability (tomtom.com)</li>
        </ul>
        <p className="mt-2">Fuel prices displayed are sourced directly from official government APIs where available. For states without a registered API (VIC, SA, NT), prices are clearly labelled as estimates. We do not guarantee the accuracy of third-party data.</p>
      </Section>

      <Section title="4. How We Use Your Information" theme={theme}>
        <ul className="list-disc pl-6 space-y-1">
          <li>To display nearby fuel stations and EV chargers based on your location</li>
          <li>To filter EV stations by connector type (Type 2, CCS, CHAdeMO, Tesla) and charging speed</li>
          <li>To calculate EV charging cost estimates based on your battery size and charge level inputs</li>
          <li>To save your favourite stations locally for quick access</li>
          <li>To plan trips with live traffic and route optimization</li>
          <li>To show real-time EV charger availability</li>
          <li>To sort fuel stations by actual drive time using live traffic data</li>
          <li>To send geofence-based alerts when near saved stations</li>
          <li>To serve relevant advertisements via Google AdMob</li>
          <li>To improve app performance and user experience</li>
        </ul>
      </Section>

      <Section title="5. Data Storage & Security" theme={theme}>
        <p>Search results and fuel prices are cached locally on your device (via localStorage) to reduce API calls and improve performance. This cached data is stored only on your device and is not transmitted to our servers.</p>

      </Section>

      <Section title="6. Third-Party Services" theme={theme}>
        <p>We use the following third-party services:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li><strong>Google AdMob</strong> — Advertising (subject to Google's Privacy Policy)</li>
          <li><strong>OpenStreetMap / Nominatim</strong> — Mapping and geocoding (subject to OSM's Privacy Policy)</li>
          <li><strong>Open Charge Map</strong> — EV station data (subject to OCM's terms)</li>
          <li><strong>TomTom</strong> — Maps, routing, geocoding, traffic, and EV availability (subject to TomTom's Privacy Policy)</li>
        </ul>
      </Section>

      <Section title="7. Children's Privacy" theme={theme}>
        <p>FueVolt is not directed at children under 13. We do not knowingly collect personal information from children.</p>
      </Section>

      <Section title="8. Your Rights" theme={theme}>
        <p>Since we do not collect personal data or require user accounts, there is no personal data to access, modify, or delete. You can clear locally cached data by clearing the app's storage in your device settings.</p>
      </Section>

      <Section title="9. Changes to This Policy" theme={theme}>
        <p>We may update this Privacy Policy from time to time. Changes will be reflected in the "Last updated" date above. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
      </Section>

      <Section title="10. Contact" theme={theme}>
        <p>If you have questions about this Privacy Policy, contact us at:</p>
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
