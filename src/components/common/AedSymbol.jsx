import { useLocation } from "react-router-dom";
import { useCountryOptional } from "../../context/CountryContext";
import { usePortalCurrencyOptional } from "../../context/PortalCurrencyContext";

/**
 * Dynamic Currency Symbol (defaults to active storefront country's symbol: AED, KSh, CFA, USh, GH₵, SAR)
 * Inside /portal, automatically reads from PortalCurrencyContext so each country's back-office
 * displays its own currency (unless `forceAed` or an explicit `symbol` override is passed).
 */
export const AedSymbol = ({
  className = "",
  style = {},
  symbol = null,
  forceAed = false,
}) => {
  const countryCtx = useCountryOptional();
  const portalCtx = usePortalCurrencyOptional();
  const location = useLocation();
  const isPortal = location?.pathname?.includes("/portal");

  const resolvedSymbol =
    symbol ||
    (forceAed
      ? "AED"
      : isPortal
      ? portalCtx?.symbol || "AED"
      : countryCtx?.activeCountry?.currencySymbol ||
        countryCtx?.activeCountry?.currency ||
        "AED");

  return (
    <span
      className={`font-sans font-bold text-[0.85em] tracking-tight select-none ${className}`}
      style={style}
    >
      {resolvedSymbol}
    </span>
  );
};

/**
 * Dynamic Multi-Country Price Formatter
 * Renders seamlessly in the active storefront or active back-office portal country's currency & decimal format
 * (AED, KSh, CFA, USh, GH₵, SAR), while remaining backward-compatible with all existing `<AedPrice />` usages.
 */
export const AedPrice = ({
  amount = 0,
  decimals = undefined,
  symbol = null,
  locale = null,
  forceAed = false,
  className = "font-mono font-bold inline-flex items-baseline gap-1",
  symbolClassName = "text-[0.78em] font-sans font-semibold opacity-80",
  numberClassName = "",
}) => {
  const countryCtx = useCountryOptional();
  const portalCtx = usePortalCurrencyOptional();
  const location = useLocation();
  const isPortal = location?.pathname?.includes("/portal");

  let resolvedSymbol = "AED";
  let resolvedLocale = "en-AE";
  let resolvedDecimals = 2;

  if (!forceAed) {
    if (isPortal && portalCtx) {
      resolvedSymbol = portalCtx.symbol || "AED";
      resolvedLocale = portalCtx.locale || "en-AE";
      resolvedDecimals = Number.isFinite(Number(portalCtx.decimals))
        ? Number(portalCtx.decimals)
        : 2;
    } else if (!isPortal && countryCtx?.activeCountry) {
      const active = countryCtx.activeCountry;
      resolvedSymbol = active.currencySymbol || active.currency || "AED";
      resolvedLocale = active.locale || "en-AE";
      resolvedDecimals = Number.isFinite(Number(active.decimals))
        ? Number(active.decimals)
        : 2;
    }
  }

  if (symbol) resolvedSymbol = symbol;
  if (locale) resolvedLocale = locale;
  if (decimals !== undefined) resolvedDecimals = decimals;

  const num = Number(amount) || 0;
  const formatted = num.toLocaleString(resolvedLocale, {
    minimumFractionDigits: resolvedDecimals,
    maximumFractionDigits: resolvedDecimals,
  });

  return (
    <span className={`inline-flex items-baseline gap-1 whitespace-nowrap ${className}`}>
      <span className={symbolClassName}>{resolvedSymbol}</span>
      <span className={numberClassName}>{formatted}</span>
    </span>
  );
};

export const CurrencySymbol = AedSymbol;
export const CurrencyPrice = AedPrice;

export default AedSymbol;
