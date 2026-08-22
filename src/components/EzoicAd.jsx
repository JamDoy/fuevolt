import { useEffect, useRef } from 'react';

// Injects a real <script> element per Ezoic's documented pattern (rather than
// just calling the function directly) so it behaves exactly like pasting
// their snippet at this position in the page.
export default function EzoicAd({ className = '', style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.dataset.ezoicInjected) return;
    containerRef.current.dataset.ezoicInjected = 'true';

    const script = document.createElement('script');
    script.text = `
      window.ezstandalone = window.ezstandalone || {};
      ezstandalone.cmd = ezstandalone.cmd || [];
      ezstandalone.cmd.push(function () {
        ezstandalone.showAds({});
      });
    `;
    containerRef.current.appendChild(script);
  }, []);

  return <div ref={containerRef} className={className} style={style} />;
}
