import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const FAQ_ITEMS = [
  {
    category: 'Fuel Prices',
    questions: [
      {
        q: 'Where does FueVolt get its fuel prices?',
        a: 'FueVolt pulls real-time fuel prices directly from official Australian government sources. Prices are updated throughout the day as fuel stations report changes.',
      },
      {
        q: 'How often are fuel prices updated?',
        a: 'Fuel prices are updated in real-time as they change throughout the day. Each state has different update frequencies — some update multiple times daily as stations report changes, while others update daily with the next day\'s prices.',
      },
      {
        q: 'Which states does FueVolt cover for fuel prices?',
        a: 'FueVolt currently covers fuel stations across New South Wales, Victoria, Queensland, and Western Australia. These four states have publicly accessible government fuel pricing data. We are working to add South Australia, Tasmania, the Northern Territory, and the ACT as government data sources become available.',
      },
      {
        q: 'What fuel types can I compare?',
        a: 'FueVolt lets you compare prices for E10 (ethanol blend), Unleaded 91, Premium 95, Premium 98, Diesel, and LPG. Not all fuel types are available at every station — FueVolt shows "Not currently available" when a station does not sell a fuel type or has not reported its price.',
      },
      {
        q: 'Why does a station show "Not currently available" for some fuel types?',
        a: 'This means a price hasn\'t been reported for that fuel type at that station. The station may not sell that fuel type, or the price hasn\'t been reported yet.',
      },
      {
        q: 'Are the fuel prices accurate?',
        a: 'FueVolt displays prices exactly as reported by official government sources. Stations are required by law to report their prices in most states. However, there can be occasional short delays between when a station changes its price and when the data updates. Always check the "last updated" time shown next to each price.',
      },
    ],
  },
  {
    category: 'EV Charging',
    questions: [
      {
        q: 'Where does EV charging station data come from?',
        a: 'FueVolt displays charging station records from third-party charging datasets, including connector types, power output, and operator information when those details are available.',
      },
      {
        q: 'What connector types can I filter by?',
        a: 'FueVolt supports filtering by all major connector types used in Australia: Type 2 (most common for AC charging), CCS2 (Combined Charging System for DC fast charging), CHAdeMO (older DC fast charging standard), and Tesla connectors. You can also filter by charging speed: slow (up to 7kW), fast (7-50kW), and ultra-rapid (50kW and above).',
      },
      {
        q: 'Is the EV charging data available across all of Australia?',
        a: 'EV charging station data covers locations across Australia, including regional and remote areas. Coverage and record completeness vary, with the strongest coverage generally in metropolitan areas and along major highways.',
      },
    ],
  },
  {
    category: 'Trip Planner',
    questions: [
      {
        q: 'How does the trip planner work?',
        a: 'Enter your start and end destinations, and FueVolt calculates the best route. The planner shows the total distance, estimated drive time, and finds fuel stations or EV chargers along your route. For electric vehicles, it also calculates battery usage at each stage and recommends where to stop for charging.',
      },
      {
        q: 'How does the EV battery forecast work?',
        a: 'The EV battery forecast uses the route distance plus your entered battery capacity, current charge level, and energy consumption rate (kWh per 100km) to estimate energy use and remaining charge. Suggested stops are based on your entered range and nearby charger data. It is an estimate and does not model temperature, terrain, speed, towing, or driving style.',
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
        q: 'Is FueVolt affiliated with any fuel company or EV charging network?',
        a: 'No. FueVolt is an independent service not affiliated with any fuel company, petrol station chain, or EV charging network. We provide unbiased price comparisons using official government data sources.',
      },
      {
        q: 'Does FueVolt work on mobile phones?',
        a: 'Yes. FueVolt is a Progressive Web App (PWA) designed to work on devices with a web browser. On mobile, you can add FueVolt to your home screen for quick access.',
      },
      {
        q: 'Does FueVolt track my location?',
        a: 'FueVolt only accesses your location if you grant permission, and it is used solely to find nearby fuel stations and EV chargers. Your location data is never stored, sold, or shared with third parties. You can use FueVolt by searching for a suburb or postcode instead of sharing your location.',
      },
      {
        q: 'How can I contact FueVolt?',
        a: 'You can reach us through our Contact page. We welcome feedback, feature suggestions, and bug reports.',
      },
      {
        q: 'What is the fuel price cycle?',
        a: 'In many Australian cities, fuel prices rise sharply and then gradually fall over the following days or weeks. Comparing current station prices can help you avoid paying more than nearby alternatives, but cycle timing varies and cannot be predicted with certainty.',
      },
      {
        q: 'Can I save favourite stations?',
        a: 'Yes. Tap the star icon on a fuel station or EV charger card to save it as a favourite. Favourites are stored locally in the same browser on your device, and the star remains highlighted when you revisit that station.',
      },
      {
        q: 'How does the EV vs Fuel calculator work?',
        a: 'The basic calculator uses your weekly fuel spend and a disclosed indicative assumption. The advanced calculator uses your weekly distance, vehicle type, fuel price, electricity prices, and home-versus-public charging split. Results are estimates; default prices are indicative rather than live.',
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

export default function FAQPage({ onContact }) {
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
        <p className="text-sm font-semibold mb-3" style={{ color: theme.text }}>Still have questions?</p>
        <button
          onClick={onContact}
          className="px-4 py-2 rounded-lg font-semibold"
          style={{ background: theme.gold, color: '#0D2B5E', border: 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          Contact Us
        </button>
      </div>
    </div>
  );
}
