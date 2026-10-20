/**
 * Clean Text-based UAE Dirham (AED) Currency Symbol
 * Uses textual "AED" to guarantee pixel-perfect baseline alignment and eliminate visual clutter.
 */
export const AedSymbol = ({ className = "", style = {} }) => {
  return (
    <span
      className={`font-sans font-bold text-[0.85em] uppercase tracking-tight select-none ${className}`}
      style={style}
    >
      AED
    </span>
  );
};

/**
 * Robust Price Formatter with seamless textual AED typography and baseline alignment
 */
export const AedPrice = ({
  amount = 0,
  decimals = 2,
  className = "font-mono font-bold inline-flex items-baseline gap-1",
  symbolClassName = "text-[0.78em] font-sans font-semibold uppercase opacity-80",
  numberClassName = "",
}) => {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`inline-flex items-baseline gap-1 whitespace-nowrap ${className}`}>
      <span className={symbolClassName}>AED</span>
      <span className={numberClassName}>{formatted}</span>
    </span>
  );
};

export default AedSymbol;
