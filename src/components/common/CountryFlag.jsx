/**
 * Crisp cross-platform inline SVG Country Flags (renders cleanly on Windows, macOS, iOS & Android
 * without broken two-letter emoji fallbacks like "AE" or "KE").
 */
export const CountryFlag = ({ code = "AE", className = "w-5 h-3.5" }) => {
  const upper = String(code || "AE").trim().toUpperCase();
  const baseCls = `${className} rounded-[3px] shrink-0 object-cover ring-1 ring-black/10 overflow-hidden inline-block align-middle`;

  switch (upper) {
    case "AE":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="24" height="5.33" y="0" fill="#00732F" />
          <rect width="24" height="5.34" y="5.33" fill="#FFFFFF" />
          <rect width="24" height="5.33" y="10.67" fill="#111827" />
          <rect width="6.5" height="16" x="0" y="0" fill="#EF3340" />
        </svg>
      );
    case "KE":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="24" height="4.8" y="0" fill="#111827" />
          <rect width="24" height="0.8" y="4.8" fill="#FFFFFF" />
          <rect width="24" height="4.8" y="5.6" fill="#BB0000" />
          <rect width="24" height="0.8" y="10.4" fill="#FFFFFF" />
          <rect width="24" height="4.8" y="11.2" fill="#006600" />
          <ellipse cx="12" cy="8" rx="2.2" ry="3.6" fill="#BB0000" stroke="#FFFFFF" strokeWidth="0.6" />
          <ellipse cx="12" cy="8" rx="0.7" ry="1.8" fill="#111827" />
        </svg>
      );
    case "SN":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="8" height="16" x="0" fill="#00853F" />
          <rect width="8" height="16" x="8" fill="#FDEF42" />
          <rect width="8" height="16" x="16" fill="#E31B23" />
          <polygon
            points="12,5.3 12.7,7.3 14.8,7.3 13.1,8.5 13.7,10.5 12,9.3 10.3,10.5 10.9,8.5 9.2,7.3 11.3,7.3"
            fill="#00853F"
          />
        </svg>
      );
    case "UG":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="24" height="2.67" y="0" fill="#111827" />
          <rect width="24" height="2.67" y="2.67" fill="#FCDC04" />
          <rect width="24" height="2.67" y="5.34" fill="#D90000" />
          <rect width="24" height="2.67" y="8" fill="#111827" />
          <rect width="24" height="2.67" y="10.67" fill="#FCDC04" />
          <rect width="24" height="2.66" y="13.34" fill="#D90000" />
          <circle cx="12" cy="8" r="2.5" fill="#FFFFFF" />
          <circle cx="12" cy="8" r="1" fill="#D90000" />
        </svg>
      );
    case "CI":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="8" height="16" x="0" fill="#F77F00" />
          <rect width="8" height="16" x="8" fill="#FFFFFF" />
          <rect width="8" height="16" x="16" fill="#009E60" />
        </svg>
      );
    case "GH":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="24" height="5.33" y="0" fill="#CE1126" />
          <rect width="24" height="5.34" y="5.33" fill="#FCD116" />
          <rect width="24" height="5.33" y="10.67" fill="#006B3F" />
          <polygon
            points="12,5.6 12.6,7.4 14.5,7.4 13,8.5 13.5,10.3 12,9.2 10.5,10.3 11,8.5 9.5,7.4 11.4,7.4"
            fill="#111827"
          />
        </svg>
      );
    case "SA":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="24" height="16" fill="#006C35" />
          <rect x="5" y="5.5" width="14" height="2.2" rx="1" fill="#FFFFFF" opacity="0.92" />
          <rect x="6.5" y="9.8" width="11" height="1.1" rx="0.5" fill="#FFFFFF" opacity="0.92" />
        </svg>
      );
    case "CN":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="24" height="16" fill="#DE2910" />
          <polygon
            points="5,3.2 5.6,5 7.5,5 6,6.1 6.5,7.9 5,6.8 3.5,7.9 4,6.1 2.5,5 4.4,5"
            fill="#FFDE00"
          />
        </svg>
      );
    case "HK":
      return (
        <svg viewBox="0 0 24 16" className={baseCls} aria-hidden="true">
          <rect width="24" height="16" fill="#DE2910" />
          <circle cx="12" cy="8" r="3.2" fill="#FFFFFF" opacity="0.92" />
          <circle cx="12" cy="8" r="1.1" fill="#DE2910" />
        </svg>
      );
    default:
      return (
        <span
          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-800 text-white text-[9px] font-mono font-bold leading-none shrink-0"
          aria-hidden="true"
        >
          {upper.slice(0, 2)}
        </span>
      );
  }
};

export default CountryFlag;

