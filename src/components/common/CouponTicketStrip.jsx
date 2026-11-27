import { useState, useEffect, useMemo } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";
import {
  fetchCoupons,
  DEFAULT_COUPONS,
  filterCouponsForLocation,
} from "../../services/couponService";
import { useCountryOptional } from "../../context/CountryContext";
import { DEFAULT_LOCATIONS } from "../../config/locationsConfig";

/**
 * Shared hook that fetches active coupons once and resolves all values & descriptions
 * into the active country's currency (KES, XOF, AED, SAR, etc.).
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useLocalizedCoupons = (overrideLocationConfig = null) => {
  const countryCtx = useCountryOptional();
  const activeLocation =
    overrideLocationConfig || countryCtx?.activeCountry || DEFAULT_LOCATIONS[0];
  const [rawCoupons, setRawCoupons] = useState(DEFAULT_COUPONS);

  useEffect(() => {
    let mounted = true;
    fetchCoupons()
      .then((list) => {
        if (mounted && Array.isArray(list) && list.length > 0) {
          setRawCoupons(list);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(
    () =>
      filterCouponsForLocation(rawCoupons, activeLocation, {
        activeOnly: true,
      }),
    [rawCoupons, activeLocation]
  );
};

/**
 * Single perforated voucher ticket in E-ALL brand palette (Deep Navy, Royal Sky & Orange accent).
 */
export const CouponTicketCard = ({
  coupon,
  copied,
  onCopy,
  accentVariant = "primary", // "primary" | "highlight"
  compact = false,
}) => {
  if (!coupon) return null;

  const isHighlight =
    accentVariant === "highlight" || coupon.badgeLabel === "BEST VALUE";

  return (
    <button
      type="button"
      onClick={() => onCopy(coupon.code)}
      aria-label={`Copy coupon code ${coupon.code}: ${coupon.headline}, ${coupon.subtitle}`}
      className="group relative w-full text-left flex items-stretch overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 cursor-pointer select-none transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.995]"
    >
      {/* Subtle serrated outer edge dots (left) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#091A32]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#091A32]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#091A32]" />
      </span>

      {/* LEFT: PROMOTIONAL OFFER BODY (E-ALL Deep Navy -> Royal Sky Gradient) */}
      <div
        className={`relative flex-1 min-w-0 flex flex-col justify-center ${
          compact
            ? "pl-4 pr-3 py-3 sm:pl-5 sm:pr-4 sm:py-3.5"
            : "pl-4 pr-3 py-3.5 sm:pl-6 sm:pr-5 sm:py-4"
        } ${
          isHighlight
            ? "bg-gradient-to-r from-[#0B3B66] via-[#0369A1] to-[#0284C7]"
            : "bg-gradient-to-r from-[#0E2F54] via-[#0B4F7E] to-[#0369A1]"
        } text-white`}
      >
        {/* Soft glossy highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.22),transparent_60%)]"
        />

        <div className="relative z-10 min-w-0">
          {coupon.badgeLabel && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider mb-1.5 shadow-2xs ${
                coupon.badgeLabel === "BEST VALUE"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                  : coupon.badgeLabel === "1ST ORDER"
                  ? "bg-orange-500/90 text-white"
                  : "bg-sky-300/20 text-sky-100 border border-sky-200/30"
              }`}
            >
              {coupon.badgeLabel}
            </span>
          )}

          <p
            className={`font-black tracking-tight leading-none text-white truncate ${
              compact
                ? "text-[15px] sm:text-lg"
                : "text-[16px] sm:text-xl lg:text-[22px]"
            }`}
          >
            {coupon.headline}
          </p>

          <p className="text-[11px] sm:text-xs text-sky-100/90 font-medium mt-1 truncate">
            {coupon.subtitle}
          </p>
        </div>
      </div>

      {/* CENTER PERFORATED SEAM + TOP/BOTTOM SEMICIRCULAR TICKET NOTCHES */}
      <div
        aria-hidden="true"
        className="relative w-0 shrink-0 z-20 flex flex-col justify-between"
      >
        <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[#091A32]" />
        <span className="absolute inset-y-2.5 -left-[0.5px] border-l-[1.5px] border-dashed border-sky-900/25" />
        <span className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[#091A32]" />
      </div>

      {/* RIGHT: CRISP FROST-WHITE CODE STUB */}
      <div
        className={`relative shrink-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 ${
          compact
            ? "w-[116px] sm:w-auto sm:min-w-[168px] pl-3 pr-4 py-2.5"
            : "w-[122px] sm:w-auto sm:min-w-[192px] pl-3.5 pr-4 sm:pl-5 sm:pr-6 py-3"
        } transition-colors ${
          copied
            ? "bg-emerald-50"
            : "bg-[#F3F9FF] group-hover:bg-white"
        }`}
      >
        <span className="text-[8.5px] sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-500 whitespace-nowrap">
          {copied ? "COPIED" : "USE CODE:"}
        </span>

        <span
          className={`inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border-[1.5px] border-dashed font-mono font-black text-[11.5px] sm:text-sm tracking-wide transition-colors whitespace-nowrap ${
            copied
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "bg-white border-sky-700/45 text-[#091A32] group-hover:border-orange-500 group-hover:text-sky-900"
          }`}
        >
          {copied ? (
            <>
              <FiCheck className="text-xs shrink-0" />
              <span>{coupon.code}</span>
            </>
          ) : (
            <>
              <span>{coupon.code}</span>
              <FiCopy className="text-[10px] text-sky-600/80 hidden sm:inline shrink-0" />
            </>
          )}
        </span>
      </div>

      {/* Subtle serrated outer edge dots (right) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#091A32]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#091A32]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#091A32]" />
      </span>
    </button>
  );
};

/**
 * Interleaved Perforated Coupon Ticket Strip
 * Renders 1 or 2 tickets side-by-side on desktop (stacked neatly on mobile)
 * directly between rows of 4 product cards with zero bulky section chrome.
 */
const CouponTicketStrip = ({
  coupons = [],
  className = "",
  compact = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(null);

  if (!Array.isArray(coupons) || coupons.length === 0) return null;

  const visible = coupons.slice(0, 2);
  const isTwin = visible.length === 2;

  const handleCopy = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2000);
  };

  return (
    <div
      className={`col-span-full ${className}`}
      role="region"
      aria-label="Active promotional voucher offers"
    >
      <div
        className="relative rounded-2xl bg-[#091A32] p-2 sm:p-2.5 shadow-sm overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(14,165,233,0.09) 0px, rgba(14,165,233,0.09) 2px, transparent 2px, transparent 14px)",
        }}
      >
        <div
          className={`grid gap-2 sm:gap-2.5 ${
            isTwin ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {visible.map((coupon, idx) => (
            <CouponTicketCard
              key={coupon.id || coupon.code}
              coupon={coupon}
              copied={copiedCode === coupon.code}
              onCopy={handleCopy}
              accentVariant={idx === 1 ? "highlight" : "primary"}
              compact={compact}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CouponTicketStrip;

