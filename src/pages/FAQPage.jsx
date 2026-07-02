import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const FAQ_ITEMS = [
  {
    category: 'Fuel Prices',
    questions: [
      {
        q: 'Where does FueVolt get its fuel prices?',
        a: 'FueVolt pulls real-time fuel prices directly from official Australian government APIs. This includes the NSW Motor API, Victoria Fair Fuel Open Data API (Servo Saver), Queensland Fuel Pricing Direct API, and Western Australia FuelWatch. These are the same data sources used by each state government\'s official fuel price websites.',
      },
      {
        q: 'How often are fuel prices updated?',
        a: 'Fuel prices are updated in real-time as they change throughout the day. Each state government API provides different update frequencies — NSW updates multiple times daily as stations report changes, Victoria and Queensland update throughout the day, and Western Australia\'s FuelWatch updates daily with the next day\'s prices published at 2:30pm.',
      },
      {
        q: 'Which states does FueVolt cover for fuel prices?',
        a: 'FueVolt currently covers fuel stations across New South Wales, Victoria, Queensland, and Western Australia. These four states have free, publicly accessible government fuel pricing APIs. We are working to add South Australia, Tasmania, the Northern Territory, and the ACT as government data sources become available.',
      },
      {
        q: 'What fuel types can I compare?',
        a: 'FueVolt lets you compare prices for E10 (ethanol blend), Unleaded 91, Premium 95, Premium 98, Diesel, and LPG. Not all fuel types are available at every station — the app shows "Not currently available" for fuel types that a particular station doesn\'t sell or hasn\'t reported a price for.',
      },
      {
        q: 'Why does a station show "Not currently available" for some fuel types?',
        a: 'This means the government API hasn\'t reported a price for that fuel type at that station. The station may not sell that fuel type, or the price hasn\'t been reported yet. The data comes directly from government sources, so FueVolt can only display what the APIs provide.',
      },
      {
        q: 'Are the fuel prices accurate?',
        a: 'FueVolt displays prices exactly as reported by each state government\'s official API. Stations are required by law to report their prices in most states. However, there can be occasional short delays between when a station changes its price and when the government API updates. Always check the "last updated" time shown next to each price.',
      },
    ],
  },
  {
    category: 'EV Charging',
    questions: [
      {
        q: 'Where does EV charging station data come from?',
        a: 'EV charging station locations and details come from Open Charge Map, the world\'s largest open registry of EV charging locations. This is a community-maintained database with thousands of verified charging stations across Australia, including details about connector types, power output, and operator information.',
      },
      {
        q: 'What do the charger availability colours mean?',
        a: 'Green markers indicate chargers with at least one available connector. Red markers indicate all connectors are currently in use. Grey markers indicate the charger is offline or out of service. Availability data comes from the TomTom EV Charging Stations Availability API where supported.',
      },
      {
        q: 'What connector types can I filter by?',
        a: 'FueVolt supports filtering by all major connector types used in Australia: Type 2 (most common for AC charging), CCS2 (Combined Charging System for DC fast charging), CHAdeMO (older DC fast charging standard), and Tesla connectors. You can also filter by charging speed: slow (up to 7kW), fast (7-50kW), and ultra-rapid (50kW and above).',
      },
      {
        q: 'Is the EV charging data available across all of Australia?',
        a: 'Yes. Unlike fuel prices which are limited to states with government APIs, EV charging station data from Open Charge Map covers all of Australia, including regional and remote areas. Coverage is best in metropolitan areas and along major highways.',
      },
    ],
  },
  {
    category: 'Trip Planner',
    questions: [
      {
        q: 'How does the trip planner work?',
        a: 'Enter your start and end destinations, and FueVolt calculates the best route using TomTom\'s routing technology. The planner shows the total distance, estimated drive time, and finds fuel stations or EV chargers along your route. For electric vehicles, it also calculates battery usage at each stage and recommends where to stop for charging.',
      },
      {
        q: 'How does the EV battery forecast work?',
        a: 'The EV battery forecast uses your vehicle\'s battery capacity, current charge level, and energy consumption rate (kWh per 100km) to estimate your battery level at the destination. It factors in elevation changes, route distance, and suggests optimal charging stops if your battery won\'t last the full trip. This is an estimate — actual consumption varies based on speed, temperature, terrain, and driving style.',
      },
      {
        q: 'Can I use the trip planner for both fuel and electric vehicles?',
        a: 'Yes. Switch between "Fuel Vehicle" and "Electric Vehicle" modes in the trip planner. Fuel mode shows petrol stations along your route with prices. EV mode shows charging stations and includes battery forecasting and recommended charging stops based on your vehicle\'s range.',
      },
    ],
  },
  {
    category: 'General',
    questions: [
      {
        q: 'Is FueVolt free to use?',
        a: 'Yes, FueVolt is completely free. There are no subscriptions, premium tiers, or hidden fees. The service is supported by advertising. All fuel pricing data comes from free government APIs, and EV charging data comes from the free Open Charge Map database.',
      },
      {
        q: 'Is FueVolt affiliated with any fuel company or EV charging network?',
        a: 'No. FueVolt is an independent service not affiliated with any fuel company, petrol station chain, or EV charging network. We provide unbiased price comparisons using official government data sources.',
      },
      {
        q: 'Does FueVolt work on mobile phones?',
        a: 'Yes. FueVolt is a Progressive Web App (PWA) designed to work on any device with a web browser — smartphones, tablets, and desktops. On mobile, you can add FueVolt to your home screen for quick access. FueVolt is also available as an Android app.',
      },
      {
        q: 'Does FueVolt track my location?',
        a: 'FueVolt only accesses your location if you grant permission, and it is used solely to find nearby fuel stations and EV chargers. Your location data is never stored, sold, or shared with third parties. You can use FueVolt by searching for a suburb or postcode instead of sharing your location.',
      },
      {
        q: 'How can I contact FueVolt?',
        a: 'You can reach us by email at contact@fuevolt.com. We welcome feedback, feature suggestions, and bug reports.',
      },
    ],
  },
];

function FAQItem({ q, a, theme }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden mb-2"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ background: 'transparent', border: 'none', color: theme.text }}
      >
        <span className="text-sm font-semibold pr-4">{q}</span>
        <span
          className="text-xs flex-shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: theme.gold }}
        >
          &#9660;
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const { theme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: theme.text }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: theme.heading }}>Frequently Asked Questions</h1>
      <p className="text-sm mb-8" style={{ color: theme.textSecondary }}>
        Everything you need to know about using FueVolt to find cheap fuel and EV chargers in Australia.
      </p>

      {FAQ_ITEMS.map((section) => (
        <div key={section.category} className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: theme.gold }}>{section.category}</h2>
          {section.questions.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} theme={theme} />
          ))}
        </div>
      ))}

      <div className="mt-8 rounded-xl p-5 text-center" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
        <p className="text-sm font-semibold mb-2" style={{ color: theme.text }}>Still have questions?</p>
        <p className="text-xs" style={{ color: theme.textSecondary }}>
          Contact us at <a href="mailto:contact@fuevolt.com" style={{ color: theme.gold }}>contact@fuevolt.com</a> and we'll get back to you as soon as possible.
        </p>
      </div>
    </div>
  );
}
