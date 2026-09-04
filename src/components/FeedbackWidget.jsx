import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Floating feedback button + modal, shown on every page. Reuses the same
// /api/contact.php backend as the Contact page (validation, honeypot spam
// protection, and the contact@fuevolt.com inbox already work) rather than
// standing up a separate pipeline — submissions are tagged with
// source: 'feedback-widget' so they're easy to tell apart in the inbox.
//
// To disable: set FEATURES.feedbackWidget to false in src/config/features.js.
// To remove entirely: delete this file and its one usage in App.jsx.
export default function FeedbackWidget() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ message: '', company: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const reset = () => {
    setForm({ message: '', company: '' });
    setStatus('idle');
    setError('');
  };

  const closeWidget = () => {
    setOpen(false);
    if (status === 'sent') reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setError('Please enter your feedback.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Site feedback', source: 'feedback-widget', ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStatus('sent');
      } else {
        setStatus('error');
        setError(data.error || 'Something went wrong. Please try again later.');
      }
    } catch {
      setStatus('error');
      setError('Could not send your feedback. Please check your connection and try again.');
    }
  };

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    color: theme.text,
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Give feedback"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[400] flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm cursor-pointer"
        style={{ background: theme.gold, color: '#0D2B5E', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.24)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={closeWidget}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            {status === 'sent' ? (
              <div className="text-center">
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>&#x1F64F;</div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: theme.gold }}>Thanks for the feedback!</h2>
                <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>We read every message.</p>
                <button
                  onClick={closeWidget}
                  className="px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer"
                  style={{ background: theme.gold, color: '#0D2B5E', border: 'none' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold" style={{ color: theme.heading }}>Give feedback</h2>
                  <button
                    type="button"
                    onClick={closeWidget}
                    aria-label="Close"
                    className="cursor-pointer"
                    style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', lineHeight: 1 }}
                  >
                    &times;
                  </button>
                </div>
                <p className="text-sm mb-4" style={{ color: theme.textSecondary }}>
                  Spotted a bug, or have an idea to make FueVolt better? Let us know.
                </p>
                {/* Honeypot — hidden from real users, bots tend to fill every field */}
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                />
                <div className="mb-4">
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Your feedback..."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-xs mb-3" style={{ color: theme.danger || '#EF4444' }}>{error}</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm cursor-pointer disabled:opacity-60"
                  style={{ background: theme.gold, color: '#0D2B5E', border: 'none' }}
                >
                  {status === 'sending' ? 'Sending...' : 'Send feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
