// Renders a price string in the seven-segment "LED price sign" font, colored
// green/orange/red the same way fuel stations light up their own price
// boards — cheap, about average, or expensive relative to nearby stations.
const CONTEXT_COLORS = {
  below: '#22C55E',
  about: '#F59E0B',
  above: '#EF4444',
};

export default function DigitalPrice({ children, context, color, className = '', style = {} }) {
  const resolvedColor = color || CONTEXT_COLORS[context] || 'inherit';
  return (
    <span className={`price-digital ${className}`} style={{ color: resolvedColor, ...style }}>
      {children}
    </span>
  );
}
