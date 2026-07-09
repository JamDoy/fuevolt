import { useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { useTheme } from '../contexts/ThemeContext';

function MapInteractionController({ enabled }) {
  const map = useMap();

  if (enabled) {
    map.dragging.enable();
    map.touchZoom.enable();
    map.scrollWheelZoom.enable();
  } else {
    map.dragging.disable();
    map.touchZoom.disable();
    map.scrollWheelZoom.disable();
  }

  return null;
}

export { MapInteractionController };

export default function TouchableMap({ children, style, className }) {
  const { theme } = useTheme();
  const [active, setActive] = useState(false);
  const overlayRef = useRef(null);

  return (
    <div className={className} style={{ ...style, position: 'relative', isolation: 'isolate' }}>
      {children(active, <MapInteractionController enabled={active} />)}
      {!active && (
        <div
          ref={overlayRef}
          onClick={() => setActive(true)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
          }}
        >
          <span
            style={{
              background: theme.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
              color: theme.text,
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            Tap to interact with map
          </span>
        </div>
      )}
      {active && (
        <button
          onClick={() => setActive(false)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1000,
            background: theme.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
            color: theme.text,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Lock map
        </button>
      )}
    </div>
  );
}
