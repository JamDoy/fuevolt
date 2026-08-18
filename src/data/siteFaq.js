// Shared FAQ content — single source of truth for both scripts/prerender.js
// (static HTML + FAQPage schema for crawlers) and the live FAQPage.jsx, so
// the two can't drift into describing different app behaviour.

export const FAQ_SECTIONS = [
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
        a: 'FueVolt currently covers fuel stations across New South Wales, Victoria, Queensland, Western Australia and Tasmania (Tasmania is covered via the same government network as NSW). We are working to add South Australia, the Northern Territory, and the ACT as government data sources become available.',
      },
      {
        q: 'What fuel types can I compare?',
        a: 'FueVolt lets you compare prices for E10 (ethanol blend), Unleaded 91, Premium 95, Premium 98, Diesel, and LPG. Not all fuel types are available at every station — FueVolt shows a dash instead of a price when a station does not sell a fuel type or has not reported it.',
      },
      {
        q: 'Why does a station not show a price for some fuel types?',
        a: 'This means a price hasn\'t been reported for that fuel type at that station. The station may not sell that fuel type, or the price hasn\'t been reported yet.',
      },
      {
        q: 'Are the fuel prices accurate?',
        a: 'FueVolt displays prices exactly as reported by official government sources. Stations are required by law to report their prices in most of the states FueVolt covers. However, there can be occasional short delays between when a station changes its price and when the data updates. Always check the "last updated" time shown next to each price.',
      },
    ],
  },
  {
    category: 'EV Charging',
    questions: [
      {
        q: 'Where does EV charging station data come from?',
        a: 'FueVolt displays charging station records from Open Charge Map, an open, community-maintained charging location dataset, including connector types, power output, and operator information when those details are available.',
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
        a: 'Enter your start and end destinations, and FueVolt calculates a route. The planner shows the total distance, estimated drive time, and finds fuel stations or EV chargers along your route. For electric vehicles, it also estimates battery usage at each stage and suggests where to stop for charging.',
      },
      {
        q: 'How does the EV battery forecast work?',
        a: 'The EV battery forecast uses the route distance plus your entered battery capacity, current charge level, and energy consumption rate to estimate energy use and remaining charge. Suggested stops are based on your entered range and nearby charger data. It is an estimate and does not model temperature, terrain, speed, towing, or driving style.',
      },
      {
        q: 'Can I use the trip planner for both fuel and electric vehicles?',
        a: 'Yes. Switch between Fuel and Electric Vehicle modes in the trip planner. Fuel mode shows petrol stations along your route with current prices. EV mode shows charging stations and includes battery forecasting and suggested charging stops based on your vehicle\'s range.',
      },
    ],
  },
  {
    category: 'General',
    questions: [
      {
        q: 'Is FueVolt affiliated with any fuel company or EV charging network?',
        a: 'No. FueVolt is an independent service and is not affiliated with any fuel company, petrol station chain, or EV charging network.',
      },
      {
        q: 'Does FueVolt work on mobile phones?',
        a: 'Yes. FueVolt is a Progressive Web App (PWA) designed to work on devices with a web browser. On mobile, you can add FueVolt to your home screen for quick access.',
      },
      {
        q: 'Does FueVolt track my location?',
        a: 'FueVolt only accesses your device location if you grant permission, and it is used to find nearby fuel stations and EV chargers. That location is processed on your device and is not stored on FueVolt\'s servers. You can use FueVolt by searching for a suburb or postcode instead of sharing your location. See the Privacy Policy for how FueVolt\'s advertising and analytics services handle data more broadly.',
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

export const FAQ_FLAT = FAQ_SECTIONS.flatMap((section) => section.questions);
