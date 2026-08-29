/**
 * Official New UAE Dirham (AED) Currency Symbol
 * Pixel-perfect vector matching the exact cap-height and stroke of price digits.
 */
export const AedSymbol = ({ className = "", style = {} }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-label="AED"
      className={`shrink-0 inline-block pointer-events-none select-none ${className}`}
      style={{
        width: "1em",
        height: "1em",
        minWidth: "1em",
        maxWidth: "1em",
        minHeight: "1em",
        maxHeight: "1em",
        display: "inline-block",
        verticalAlign: "-0.12em",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Capital D Body with inner counter cutout */}
      <path
        d="M 8 6
           C 14 6 22 6 36 6
           C 68 6 90 24 90 50
           C 90 76 68 94 36 94
           C 22 94 14 94 8 94
           C 11 91 14 84 14 74
           L 14 26
           C 14 16 11 9 8 6
           Z
           M 27 18
           L 27 82
           C 33 82 39 82 43 82
           C 62 82 74 69 74 50
           C 74 31 62 18 43 18
           C 39 18 33 18 27 18
           Z"
        fillRule="evenodd"
      />
      {/* Top Crossbar with Flared Terminals */}
      <path
        d="M 0 35
           C 3 37.5 8 38.5 14 38.5
           L 86 38.5
           C 92 38.5 97 37.5 100 35
           C 101.5 41 97.5 45.5 87 45.5
           L 13 45.5
           C 2.5 45.5 -1.5 41 0 35
           Z"
      />
      {/* Bottom Crossbar with Flared Terminals */}
      <path
        d="M 0 54.5
           C 3 57 8 58 14 58
           L 86 58
           C 92 58 97 57 100 54.5
           C 101.5 60.5 97.5 65 87 65
           L 13 65
           C 2.5 65 -1.5 60.5 0 54.5
           Z"
      />
    </svg>
  );
};

/**
 * Robust Price Formatter with seamless typography
 */
export const AedPrice = ({
  amount = 0,
  decimals = 2,
  className = "font-mono font-bold inline-flex items-center gap-1",
  symbolClassName = "",
  numberClassName = "",
}) => {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap ${className}`}>
      <AedSymbol className={symbolClassName} />
      <span className={numberClassName}>{formatted}</span>
    </span>
  );
};

export default AedSymbol;
