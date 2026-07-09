import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function ContactPage() {
  const { theme } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '', company: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setError('Please enter your name and a message.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      setError('Could not send your message. Please check your connection and try again.');
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

  const labelStyle = { color: theme.textSecondary, fontSize: '13px', fontWeight: 600 };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" style={{ color: theme.text }}>
      <h1 className="text-2xl font-bold mb-3" style={{ color: theme.heading }}>Contact Us</h1>

      {status === 'sent' ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}
        >
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>&#x1F64F;</div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: theme.gold }}>
            Thank you for your feedback!
          </h2>
          <p className="text-sm" style={{ color: theme.textSecondary }}>
            We&apos;ve received your message and appreciate you taking the time to reach out.
            If you left an email address, we&apos;ll get back to you as soon as we can.
          </p>
          <button
            onClick={() => {
              setForm({ name: '', email: '', message: '', company: '' });
              setStatus('idle');
            }}
            className="mt-4 px-4 py-2 rounded-lg font-semibold"
            style={{ background: theme.gold, color: '#0D2B5E', border: 'none', cursor: 'pointer', fontSize: '13px' }}
          >
            Send another message
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm leading-relaxed mb-6" style={{ color: theme.textSecondary }}>
            Have feedback, a feature request, or found an issue? We&apos;d love to hear from you.
            Fill in the form below and we&apos;ll take a look.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" style={labelStyle}>Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="mt-1"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label htmlFor="email" style={labelStyle}>Email (optional)</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com — so we can reply"
                className="mt-1"
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="message" style={labelStyle}>Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us what's on your mind..."
                rows={6}
                className="mt-1"
                style={{ ...inputStyle, resize: 'vertical' }}
                required
              />
            </div>

            {/* Honeypot field — hidden from users, catches bots */}
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
            />

            {error && (
              <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="px-5 py-3 rounded-lg font-semibold"
              style={{
                background: theme.gold,
                color: '#0D2B5E',
                border: 'none',
                cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                opacity: status === 'sending' ? 0.7 : 1,
                fontSize: '14px',
              }}
            >
              {status === 'sending' ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
