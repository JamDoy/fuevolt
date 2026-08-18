import { useState, useEffect, useId } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { injectFAQSchema, removeFAQSchema } from '../utils/seo';
import { FAQ_SECTIONS as FAQ_ITEMS } from '../data/siteFaq';

function FAQItem({ q, a, theme }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className="rounded-xl overflow-hidden mb-2"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ background: 'transparent', border: 'none', color: theme.text }}
      >
        <span className="text-sm font-semibold pr-4">{q}</span>
        <span
          className="text-xs flex-shrink-0 transition-transform"
          aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: theme.gold }}
        >
          &#9660;
        </span>
      </button>
      {open && (
        <div id={panelId} className="px-4 pb-4">
          <p className="text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage({ onContact }) {
  const { theme } = useTheme();

  useEffect(() => {
    const flat = FAQ_ITEMS.flatMap((section) => section.questions);
    injectFAQSchema(flat);
    return () => removeFAQSchema();
  }, []);

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
