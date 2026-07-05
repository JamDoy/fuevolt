import { useTheme } from '../contexts/ThemeContext';

export default function AboutPage() {
  const { theme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: theme.text }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: theme.heading }}>About FueVolt</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>Our Mission</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          FueVolt was created to help Australian drivers save money on fuel and make the transition to electric vehicles easier. Whether you drive a petrol car, diesel ute, or a fully electric vehicle, FueVolt gives you the tools to find the cheapest fuel, locate EV chargers, and plan road trips — all in one place, completely free.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          We believe every Australian deserves access to transparent fuel pricing and reliable EV charging information without paywalls, hidden fees, or expensive subscriptions.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>What We Do</h2>
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: theme.gold }}>Real-Time Fuel Prices</h3>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              We pull live fuel prices directly from official Australian government sources. Prices are updated in real-time throughout the day, so you always know exactly where the cheapest petrol, diesel, E10, premium unleaded, and LPG is near you.
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: theme.green }}>EV Charging Station Finder</h3>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              FueVolt helps EV drivers find thousands of charging points across Australia. You can filter by connector type (Type 2, CCS2, CHAdeMO, Tesla) and charging speed to find the right charger for your vehicle.
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: theme.text }}>Trip Planner</h3>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              Planning a road trip? Our trip planner calculates the best route with fuel stations and EV chargers along the way. For electric vehicles, it includes battery level forecasts at each waypoint and recommends optimal charging stops based on your vehicle's range.
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: theme.text }}>EV vs Fuel Calculator</h3>
            <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              Thinking about switching to an EV? Our calculator estimates how much you could save by comparing your current fuel costs against the equivalent electricity costs of driving an electric vehicle. Enter your weekly fuel spend, driving distance, vehicle type, and electricity rates for a personalised savings estimate.
            </p>
          </div>
        </div>
      </section>



      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>Coverage</h2>
        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          FueVolt currently covers fuel stations across four Australian states: New South Wales, Victoria, Queensland, and Western Australia. EV charging station data covers all of Australia. We are working to expand fuel price coverage to South Australia, Tasmania, the Northern Territory, and the ACT.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>Free and Independent</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          FueVolt is a completely free service. We are not affiliated with any fuel company, petrol station chain, or EV charging network. Our goal is to provide unbiased, accurate information to help Australians make informed decisions about fuel and electric vehicles.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          The site is supported by advertising revenue, which allows us to keep the service free for all users.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: theme.gold }}>Contact Us</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: theme.textSecondary }}>
          Have feedback, a feature request, or found an issue? We'd love to hear from you.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          Email: <a href="mailto:contact@fuevolt.com" style={{ color: theme.gold }}>contact@fuevolt.com</a>
        </p>
        <p className="text-sm leading-relaxed mt-2" style={{ color: theme.textSecondary }}>
          FueVolt is an Australian-made product, designed and built in Australia for Australian drivers.
        </p>
      </section>
    </div>
  );
}
