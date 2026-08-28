import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';

function ShareIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff">
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.45 1.27 4.9L2 22l5.25-1.38a9.94 9.94 0 0 0 4.79 1.22h.01c5.52 0 10-4.48 10-10s-4.48-10-10.01-10zm0 18.16h-.01a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-3.11.82.83-3.03-.19-.31a8.13 8.13 0 0 1-1.25-4.32c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.23.85 5.77 2.39a8.1 8.1 0 0 1 2.39 5.78c0 4.5-3.67 8.15-8.14 8.15zm4.47-6.1c-.24-.12-1.44-.71-1.67-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.44-1.34-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42-.14 0-.3-.02-.46-.02s-.42.06-.64.3c-.22.24-.85.83-.85 2.02s.87 2.35.99 2.51c.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28z" />
    </svg>
  );
}

function SMSIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-6.9L4.4 22H1.3l8.2-9.3L1 2h7.2l5 6.3L18.9 2zm-1.2 18h1.7L7.4 4H5.6l12.1 16z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
      <circle cx="12" cy="14" r="7" />
      <circle cx="19" cy="9" r="1.6" fill="#FF4500" />
      <circle cx="9" cy="14.5" r="1.1" fill="#FF4500" />
      <circle cx="15" cy="14.5" r="1.1" fill="#FF4500" />
      <path d="M9 17.2c.8.6 1.9.9 3 .9s2.2-.3 3-.9" stroke="#FF4500" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d="M12 10.5V7l2.4-.6" stroke="#FF4500" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function isIOS() {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function buildPlatforms(title, text, url) {
  const fullText = `${text} ${url}`;
  return [
    { id: 'copy', label: 'Copy link', bg: '#6B7280', icon: <LinkIcon /> },
    { id: 'whatsapp', label: 'WhatsApp', bg: '#25D366', icon: <WhatsAppIcon />, href: `https://wa.me/?text=${encodeURIComponent(fullText)}` },
    { id: 'sms', label: 'SMS', bg: '#0EA5E9', icon: <SMSIcon />, href: isIOS() ? `sms:&body=${encodeURIComponent(fullText)}` : `sms:?body=${encodeURIComponent(fullText)}` },
    { id: 'email', label: 'Email', bg: '#64748B', icon: <EmailIcon />, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullText)}` },
    { id: 'x', label: 'X', bg: '#000000', icon: <XIcon />, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { id: 'facebook', label: 'Facebook', bg: '#1877F2', icon: <FacebookIcon />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { id: 'reddit', label: 'Reddit', bg: '#FF4500', icon: <RedditIcon />, href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}` },
  ];
}

// Renders the popover via a portal to document.body rather than as a normal
// child, because both places this button lives (the hero card's collapsing
// summary, the station detail header) have `overflow: hidden` ancestors for
// unrelated animation reasons — a normal absolutely-positioned dropdown would
// silently get clipped there.
export default function ShareMenu({ title, text, url, buttonClassName = '', buttonStyle = {} }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (popoverRef.current?.contains(event.target) || btnRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const openPopover = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setOpen(true);
  };

  const handleTriggerClick = async (event) => {
    // Both places this button lives (hero card, station header) sit inside a
    // larger clickable area that navigates elsewhere — without this, tapping
    // Share also fires that outer click and opens the station page instead.
    event.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // AbortError (user cancelled) or share failed — do nothing either way.
      }
      return;
    }
    openPopover();
  };

  const handlePlatformClick = async (platform) => {
    if (platform.id === 'copy') {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopyStatus('Copied!');
      } catch {
        setCopyStatus('Could not copy');
      }
      window.setTimeout(() => setCopyStatus(''), 1600);
      return;
    }
    window.open(platform.href, '_blank', 'noopener,noreferrer,width=600,height=550');
    setOpen(false);
  };

  const platforms = buildPlatforms(title, text, url);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleTriggerClick}
        aria-label="Share"
        className={buttonClassName || 'cursor-pointer'}
        style={buttonStyle}
      >
        <ShareIcon />
      </button>

      {open && coords && createPortal(
        <div
          ref={popoverRef}
          onClick={(event) => event.stopPropagation()}
          className="fixed rounded-2xl p-3"
          style={{
            top: coords.top,
            right: coords.right,
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
            width: '236px',
            zIndex: 1000,
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme.textMuted }}>
            Share
          </p>
          <div className="grid grid-cols-4 gap-2">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePlatformClick(p)}
                title={p.label}
                className="flex flex-col items-center gap-1 cursor-pointer"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ width: '38px', height: '38px', background: p.bg }}
                >
                  {p.icon}
                </span>
                <span className="text-[9px] leading-tight" style={{ color: theme.textMuted }}>{p.label}</span>
              </button>
            ))}
          </div>
          {copyStatus && (
            <p className="text-[11px] text-center mt-2 font-semibold" style={{ color: '#22C55E' }}>{copyStatus}</p>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
